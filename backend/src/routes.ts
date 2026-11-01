import type { Express, Request } from "express";
import { getSupabaseAdmin, getUserFromToken } from "./supabase";
import { scrapeAmazonProducts } from "./amazonScraper";
import { getGovernmentSchemes } from "./schemesScraper";
import { generateGoogleTTS } from "./googleTTS";
import { translateTextWithAI } from "./translator";
import { generateCropRecommendations } from "./cropAnalytics";

function getBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : undefined;
}

export function registerRoutes(app: Express): void {
  // Weather proxy route (to avoid CORS issues)
  app.get("/api/weather", async (req, res) => {
    try {
      const { location } = req.query;
      if (!location || typeof location !== "string") {
        return res.status(400).json({ error: "Location parameter required" });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "OPENWEATHER_API_KEY is not configured" });
      }

      // Get coordinates for location
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
      );

      if (!geoResponse.ok) {
        throw new Error("Failed to get location coordinates");
      }

      const geoData = await geoResponse.json() as any;
      if (!geoData || geoData.length === 0) {
        throw new Error("Location not found");
      }

      const { lat, lon } = geoData[0];

      // Get current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await weatherResponse.json() as any;

      // Get forecast for rain probability
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
      );

      let rainProb24h = 0;
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json() as any;
        rainProb24h = forecastData.list.reduce((acc: number, item: any) => acc + item.pop, 0) / forecastData.list.length;
      }

      const response = {
        tempC: Math.round(weatherData.main.temp),
        humidity: weatherData.main.humidity,
        condition: weatherData.weather[0].description,
        rainProb24h,
        wind: Math.round(weatherData.wind.speed * 3.6), // Convert m/s to km/h
        forecastArray: [],
      };

      res.json(response);
    } catch (error) {
      console.error("Weather API error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // AI chat proxy route (supports Gemini and OpenAI)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const systemPrompt = buildSystemPrompt(context);

      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const provider = process.env.AI_PROVIDER || (geminiKey ? "gemini" : (openaiKey ? "openai" : undefined));

      if (!provider) {
        return res.status(500).json({
          error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY."
        });
      }

      if (provider === "gemini") {
        if (!geminiKey) {
          return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
        }
        const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;

        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nUser: ${message}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        };

        const resp = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => null);
          console.error("Gemini API error:", errorData);
          throw new Error(`Gemini API error: ${resp.status}`);
        }

        const data = await resp.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        return res.json({ response: text });
      }

      // Fallback to OpenAI
      if (!openaiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as any;
      res.json({ response: data.choices[0].message.content.trim() });

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Government schemes endpoint (Scraped with Playwright from official portals)
  // Supports multi-language translation (e.g., ?lang=ta for Tamil)
  app.get("/api/schemes", async (req, res) => {
    try {
      const { state, category, q, lang } = req.query as {
        state?: string;
        category?: string;
        q?: string;
        lang?: string;
      };
      const schemes = await getGovernmentSchemes({ state, category, q, lang });
      return res.json({ schemes });
    } catch (error) {
      console.error("Schemes API error:", error);
      res.status(500).json({ error: "Failed to fetch schemes" });
    }
  });

  // AI & Agronomic Crop Suggestions & Yield Analytics
  app.post("/api/crop/suggestions", async (req, res) => {
    try {
      const { location, landArea, landUnit, previousCrop, soilType, irrigation, weather, lang } = req.body;
      const recommendations = await generateCropRecommendations({
        location: location || "India",
        landArea: Number(landArea) || 1,
        landUnit: landUnit || "acre",
        previousCrop: previousCrop || "paddy",
        soilType: soilType || "Clay loam",
        irrigation: irrigation || "Canal / Borewell",
        weather,
        lang: lang || "en"
      });
      return res.json({ recommendations });
    } catch (error: any) {
      console.error("Crop suggestions error:", error);
      res.status(500).json({ error: "Failed to generate crop suggestions" });
    }
  });

  // Google Text-to-Speech proxy endpoint for natural voice synthesis in any Indian language
  app.get("/api/tts", async (req, res) => {
    try {
      const text = (req.query.text as string) || "";
      const lang = (req.query.lang as string) || "hi";
      if (!text.trim()) {
        return res.status(400).json({ error: "Text parameter is required" });
      }
      const audioBuffer = await generateGoogleTTS(text, lang);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error("Google TTS error:", error.message);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const { text, language } = req.body;
      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }
      const audioBuffer = await generateGoogleTTS(text, language || "hi");
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(audioBuffer);
    } catch (error: any) {
      console.error("Google TTS error:", error.message);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  // Yield estimation endpoint (simple rules + placeholders)
  app.post("/api/yield/estimate", async (req, res) => {
    try {
      const { crop, area, unit, irrigation, fertilizerLevel, sowingDate } = req.body || {};
      const missing = [] as string[];
      if (!crop) missing.push("crop");
      if (!area) missing.push("area");
      if (!unit) missing.push("unit");
      if (!sowingDate) missing.push("sowingDate");
      if (missing.length) return res.status(400).json({ missing });

      // Very simple baseline yields (tons per hectare) by crop
      const base: Record<string, number> = { rice: 4.0, wheat: 3.2, maize: 3.5, cotton: 1.8, sugarcane: 65 };
      const toHa = (value: number, unit: string) => unit === "acre" ? value * 0.404686 : value; // assume ha if not acre
      const areaHa = toHa(Number(area), String(unit));
      let yieldPerHa = base[String(crop).toLowerCase()] ?? 3.0;

      if (String(irrigation).toLowerCase().includes("drip") || String(irrigation).toLowerCase().includes("sprinkler")) {
        yieldPerHa *= 1.08;
      }
      if (String(fertilizerLevel).toLowerCase().includes("high")) {
        yieldPerHa *= 1.12;
      } else if (String(fertilizerLevel).toLowerCase().includes("low")) {
        yieldPerHa *= 0.9;
      }

      const estTotal = areaHa * yieldPerHa;
      return res.json({ unit: "ton", perHectare: Number(yieldPerHa.toFixed(2)), total: Number(estTotal.toFixed(2)) });
    } catch (error) {
      console.error("Yield estimate error:", error);
      res.status(500).json({ error: "Failed to estimate yield" });
    }
  });

  // Marketplace products scraped from Amazon with Playwright MCP / scraper
  app.get("/api/market/products", async (req, res) => {
    try {
      const { category = "equipment", q = "" } = req.query as { category?: string; q?: string };
      const products = await scrapeAmazonProducts(category, q);
      return res.json({ products });
    } catch (error) {
      console.error("Market products error:", error);
      res.status(200).json({ products: [] });
    }
  });

  // Translation proxy route powered by Gemini for Indian languages
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, from, to } = req.body;

      if (!text || !from || !to) {
        return res.status(400).json({ error: "Text, from, and to languages are required" });
      }

      // If languages are the same, return original text
      if (from === to) {
        return res.json({ translatedText: text });
      }

      const translated = await translateTextWithAI(text, from, to);
      return res.json({ translatedText: translated || text });
    } catch (error) {
      console.error("Translation error:", error);
      res.json({ translatedText: req.body.text || "" });
    }
  });

  // Marketplace trending items powered by Gemini with rich agricultural fallback
  app.get("/api/market/trending", async (req, res) => {
    const defaultPesticides = [
      {
        name: "Neem Oil 10000 PPM (Azadirachtin)",
        use: "Broad-spectrum biological control against sucking pests, aphids & whiteflies",
        safety: "Spray during cool evening hours; safe for honeybees & natural predators"
      },
      {
        name: "Trichoderma Viride Bio-Fungicide",
        use: "Protects roots from soil-borne damping-off, root rot & fusarium wilt",
        safety: "Apply with moist farmyard manure; do not mix with chemical fungicides"
      },
      {
        name: "Chlorantraniliprole 18.5% SC",
        use: "Long-lasting protection against stem borer & leaf folder in cereal crops",
        safety: "Follow exact label dosage (60ml/acre); always wear protective gloves"
      },
      {
        name: "Pseudomonas Fluorescens Bio-Agent",
        use: "Induces systemic resistance against bacterial leaf blight and blast",
        safety: "Mix with irrigation water or spray during vegetative development"
      }
    ];

    const defaultEquipment = [
      {
        name: "16L Battery-Operated Knapsack Sprayer",
        use: "Uniform, effortless foliar application of fertilizers and organic extracts",
        tip: "Rinse tank with clean water after each spray; keep battery charged"
      },
      {
        name: "Automatic Drip Irrigation Kit (1 Acre)",
        use: "Precision root-zone fertigation, saving up to 60% water in dry conditions",
        tip: "Flush sub-mains and drip laterals bi-weekly to prevent emitter clogging"
      },
      {
        name: "Mini Power Weeder (2-Stroke)",
        use: "Quick inter-row weeding, soil pulverization and aeration",
        tip: "Operate at optimal soil moisture; inspect tines and check engine oil"
      },
      {
        name: "Precision Seed Drill & Broadcaster",
        use: "Uniform seed placement and basal fertilizer application at optimal depth",
        tip: "Calibrate seed gate opening according to seed size before sowing"
      }
    ];

    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      const location = (req.query.location as string) || "Tamil Nadu, India";
      const crop = (req.query.crop as string) || "general crops";
      const lang = ((req.query.lang as string) || "en").toLowerCase();

      let recommendations = {
        pesticides: defaultPesticides,
        equipment: defaultEquipment
      };

      if (geminiKey) {
        try {
          const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;
          const prompt = `You are an Indian agricultural marketplace expert for farmers in ${location} growing ${crop}.
Return STRICT JSON containing 2 arrays:
1. "pesticides": 3-4 items with { "name": string, "use": string, "safety": string }
2. "equipment": 3-4 items with { "name": string, "use": string, "tip": string }
Focus on verified, commonly used Indian agricultural inputs and tools. No markdown, only raw JSON.`;

          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 800 }
            })
          });

          if (resp.ok) {
            const data = (await resp.json()) as any;
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const jsonStart = text.indexOf("{");
            const jsonEnd = text.lastIndexOf("}");
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
              const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
              if (Array.isArray(parsed.pesticides) && parsed.pesticides.length > 0 &&
                  Array.isArray(parsed.equipment) && parsed.equipment.length > 0) {
                recommendations = parsed;
              }
            }
          }
        } catch (e: any) {
          console.warn("[Trending] Gemini parse warning:", e.message);
        }
      }

      // Translate if target language is not English
      if (lang && lang !== "en") {
        try {
          recommendations.pesticides = await Promise.all(
            recommendations.pesticides.map(async (p: any) => ({
              name: await translateTextWithAI(p.name, "en", lang),
              use: await translateTextWithAI(p.use, "en", lang),
              safety: await translateTextWithAI(p.safety, "en", lang)
            }))
          );
          recommendations.equipment = await Promise.all(
            recommendations.equipment.map(async (e: any) => ({
              name: await translateTextWithAI(e.name, "en", lang),
              use: await translateTextWithAI(e.use, "en", lang),
              tip: await translateTextWithAI(e.tip, "en", lang)
            }))
          );
        } catch {}
      }

      return res.json(recommendations);
    } catch (error) {
      console.error("Trending market API error:", error);
      return res.status(200).json({
        pesticides: defaultPesticides,
        equipment: defaultEquipment
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Authenticated farmer data (Supabase-backed). The frontend sends the user's
  // Supabase access token as `Authorization: Bearer <token>`.
  // ---------------------------------------------------------------------------

  // Get the current user's farmer profile
  app.get("/api/me/profile", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: "Supabase is not configured" });

      const user = await getUserFromToken(getBearerToken(req));
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await admin
        .from("farmer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return res.json({ profile: data || null });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Create or update the current user's farmer profile
  app.put("/api/me/profile", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: "Supabase is not configured" });

      const user = await getUserFromToken(getBearerToken(req));
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const b = req.body || {};
      const row = {
        user_id: user.id,
        name: b.name ?? "",
        location: b.location ?? null,
        crop_type: b.cropType ?? "",
        soil_type: b.soilType ?? "",
        land_size: b.landSize ?? 0,
        land_unit: b.landUnit ?? "",
        irrigation: b.irrigation ?? "",
        website_language: b.websiteLanguage ?? "en",
        chatbot_language: b.chatbotLanguage ?? "en",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await admin
        .from("farmer_profiles")
        .upsert(row, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return res.json({ profile: data });
    } catch (error) {
      console.error("Save profile error:", error);
      return res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // Get the current user's chat messages
  app.get("/api/me/messages", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: "Supabase is not configured" });

      const user = await getUserFromToken(getBearerToken(req));
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { data, error } = await admin
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return res.json({ messages: data || [] });
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Append a chat message for the current user
  app.post("/api/me/messages", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: "Supabase is not configured" });

      const user = await getUserFromToken(getBearerToken(req));
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const b = req.body || {};
      const row = {
        user_id: user.id,
        sender: b.sender,
        message: b.message,
        original_language: b.originalLanguage ?? null,
      };

      const { data, error } = await admin
        .from("chat_messages")
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      return res.json({ message: data });
    } catch (error) {
      console.error("Save message error:", error);
      return res.status(500).json({ error: "Failed to save message" });
    }
  });

  // Clear the current user's chat messages
  app.delete("/api/me/messages", async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(503).json({ error: "Supabase is not configured" });

      const user = await getUserFromToken(getBearerToken(req));
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const { error } = await admin.from("chat_messages").delete().eq("user_id", user.id);
      if (error) throw error;
      return res.json({ success: true });
    } catch (error) {
      console.error("Clear messages error:", error);
      return res.status(500).json({ error: "Failed to clear messages" });
    }
  });
}

function buildSystemPrompt(context: any): string {
  const { profile, weather } = context || {};

  const langCode = (profile?.chatbotLanguage || profile?.language || context?.language || "en").toLowerCase();
  const LANGUAGE_LABELS: Record<string, string> = {
    ta: "Tamil (தமிழ்)",
    hi: "Hindi (हिन्दी)",
    te: "Telugu (తెలుగు)",
    kn: "Kannada (ಕನ್ನಡ)",
    bn: "Bengali (বাংলা)",
    mr: "Marathi (मराठी)",
    gu: "Gujarati (ગુજરાતી)",
    ml: "Malayalam (മലയാളം)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    ur: "Urdu (اردو)",
    od: "Odia (ଓଡ଼ିଆ)",
    as: "Assamese (অসমীয়া)",
    en: "English"
  };
  const langName = LANGUAGE_LABELS[langCode] || langCode;

  let prompt = `You are KRISHI SAKHI, a friendly AI farming companion for Indian farmers. Your role is to provide practical, actionable farming advice in a conversational, respectful, and encouraging tone.

FARMER PROFILE:
- Name: ${profile?.name || "Farmer"}
- Preferred Language: ${langName}
- Crop: ${profile?.crop || "General farming"}
- Soil Type: ${profile?.soil || "Mixed soil"}
- Irrigation: ${profile?.irrigation || "Traditional"}
- Land Size: ${profile?.landSize || "Small farm"}
- Location: ${profile?.location || "India"}

CURRENT WEATHER:`;

  if (weather) {
    prompt += `
- Temperature: ${weather.tempC}°C
- Humidity: ${weather.humidity}%
- Condition: ${weather.condition}
- Rain Probability: ${weather.rainProb}%`;
  } else {
    prompt += " Weather data not available";
  }

  prompt += `

GUIDELINES:
1. Keep responses concise, friendly, and actionable (2-4 bullet points max)
2. Use relevant emojis (🌾, 🌧️, 🌞, 💧, etc.)
3. Include weather-based advice:
   - If temp >35°C: recommend irrigation timing and frequency
   - If rain >60%: advise against irrigation and outdoor spraying
   - If humidity >85% + rice crop: mention favorable conditions
4. Address the farmer by name warmly
5. Be encouraging, empathetic and supportive
6. Provide specific steps they can take today/this week
7. Reference their specific crop, land, and local conditions when relevant`;

  if (langCode !== "en") {
    prompt += `

CRITICAL LANGUAGE REQUIREMENT:
The farmer's preferred language is ${langName}.
You MUST respond ENTIRELY in ${langName}.
Do NOT reply in English.
Speak warmly and naturally in everyday, polite ${langName} suitable for an Indian farmer so that text-to-speech can pronounce it naturally.`;
  }

  return prompt;
}

