import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFarmerProfileSchema, insertChatMessageSchema, insertWeatherAlertSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Farmer profile routes
  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertFarmerProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      const profileData = insertFarmerProfileSchema.parse(req.body);
      const profile = await storage.updateProfile(req.params.id, profileData);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const success = await storage.deleteProfile(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Chat message routes
  app.post("/api/profiles/:profileId/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.get("/api/profiles/:profileId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.profileId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/profiles/:profileId/messages", async (req, res) => {
    try {
      const success = await storage.clearMessages(req.params.profileId);
      res.json({ success });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Weather alert routes
  app.post("/api/profiles/:profileId/alerts", async (req, res) => {
    try {
      const alertData = insertWeatherAlertSchema.parse({
        ...req.body,
        profileId: req.params.profileId,
      });
      const alert = await storage.createAlert(alertData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.get("/api/profiles/:profileId/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAlerts(req.params.profileId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/alerts/:alertId/read", async (req, res) => {
    try {
      const alert = await storage.markAlertAsRead(req.params.alertId);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

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
      
      const geoData = await geoResponse.json();
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
      
      const weatherData = await weatherResponse.json();

      // Get forecast for rain probability
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
      );
      
      let rainProb24h = 0;
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
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
        const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
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

        const data = await resp.json();
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

      const data = await response.json();
      res.json({ response: data.choices[0].message.content.trim() });

    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Government schemes endpoint (AI-powered with fallback)
  app.get("/api/schemes", async (req, res) => {
    try {
      const { state, category, q } = req.query as { state?: string; category?: string; q?: string };

      const curated = [
        {
          id: "pm-kisan",
          title: "PM-KISAN (Income Support)",
          state: "ALL",
          category: "income-support",
          url: "https://pmkisan.gov.in/",
          applicationUrl: "https://pmkisan.gov.in/",
          description: "₹6,000/year income support to eligible farmer families.",
        },
        {
          id: "pmfby",
          title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
          state: "ALL",
          category: "crop-insurance",
          url: "https://pmfby.gov.in/",
          applicationUrl: "https://pmfby.gov.in/",
          description: "Crop insurance against yield losses due to natural calamities, pests, and diseases.",
        },
        {
          id: "kcc",
          title: "Kisan Credit Card (KCC)",
          state: "ALL",
          category: "credit",
          url: "https://www.mysaathi.org/kisan-credit-card",
          applicationUrl: "https://www.mysaathi.org/kisan-credit-card",
          description: "Short-term credit for cultivation and other needs with simplified disbursal.",
        },
        {
          id: "pmksy",
          title: "PMKSY - Micro Irrigation",
          state: "ALL",
          category: "irrigation",
          url: "https://pmksy.gov.in/",
          applicationUrl: "https://pmksy.gov.in/",
          description: "Assistance for drip and sprinkler irrigation to improve water use efficiency.",
        },
      ];

      // Try Gemini to augment with state/category specific schemes
      const geminiKey = process.env.GEMINI_API_KEY;
      let aiSchemes: any[] | null = null;
      if (geminiKey) {
        try {
          const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;
          const prompt = `Return JSON array of farmer welfare schemes in ${state || "India"} filtered by category '${category || "any"}'. Each item must have {id,title,description,url,applicationUrl,state,category}. Strict JSON, no prose.`;
          const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
          });
          if (resp.ok) {
            const data = await resp.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const start = text.indexOf("[");
            const end = text.lastIndexOf("]");
            if (start >= 0 && end > start) {
              aiSchemes = JSON.parse(text.slice(start, end + 1));
            }
          }
        } catch (e) {
          aiSchemes = null;
        }
      }

      let results = aiSchemes && Array.isArray(aiSchemes) && aiSchemes.length > 0 ? aiSchemes : curated;
      if (state && state.toUpperCase() !== "ALL") {
        results = results.filter((s) => s.state === "ALL" || s.state.toUpperCase() === state.toUpperCase());
      }
      if (category) {
        results = results.filter((s) => s.category === category);
      }
      if (q) {
        const query = q.toLowerCase();
        results = results.filter((s) =>
          s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
        );
      }

      return res.json({ schemes: results });
    } catch (error) {
      console.error("Schemes API error:", error);
      res.status(500).json({ error: "Failed to fetch schemes" });
    }
  });

  // Yield estimation endpoint (simple rules + placeholders)
  app.post("/api/yield/estimate", async (req, res) => {
    try {
      const { crop, area, unit, variety, irrigation, fertilizerLevel, sowingDate, location } = req.body || {};
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

  // Marketplace products via Gemini; links default to Amazon search if direct URL missing
  app.get("/api/market/products", async (req, res) => {
    try {
      const { category = "equipment", q = "" } = req.query as { category?: string; q?: string };
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!geminiKey) {
        // Basic fallback list
        const items = [
          { name: "Manual Knapsack Sprayer 16L", category: "equipment" },
          { name: "Drip Irrigation Kit (50 plants)", category: "equipment" },
          { name: "Hybrid Tomato Seeds - 10g", category: "seeds" },
          { name: "NPK 19:19:19 Water Soluble 1kg", category: "fertilizers" },
        ].filter(i => i.category === category);
        return res.json({ products: items.map(i => ({
          name: i.name,
          imageUrl: "",
          url: `https://www.amazon.in/s?k=${encodeURIComponent(i.name)}`,
          category
        })) });
      }

      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;
      const prompt = `List 6 concise ${category} items for Indian farmers. JSON array with objects {name,imageUrl?,url?}. If url missing, it's okay. No prose.` + (q ? ` Focus on: ${q}.` : "");
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
      });
      if (!resp.ok) throw new Error(`Gemini ${resp.status}`);
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      let items: any[] = [];
      if (start >= 0 && end > start) items = JSON.parse(text.slice(start, end + 1));
      const products = (items || []).map((p: any) => ({
        name: p.name,
        imageUrl: p.imageUrl || "",
        url: p.url || `https://www.amazon.in/s?k=${encodeURIComponent(p.name || "farm")}`,
        category
      }));
      return res.json({ products });
    } catch (error) {
      console.error("Market products error:", error);
      res.status(200).json({ products: [] });
    }
  });

  // Translation proxy route
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

      const apiKey = process.env.TRANSLATE_API_KEY;
      
      if (!apiKey) {
        // Return mock translation for demo
        return res.json({ translatedText: `[${from.toUpperCase()}→${to.toUpperCase()}] ${text}` });
      }

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: from,
          target: to,
          format: "text",
        }),
      });

      if (!response.ok) {
        throw new Error("Translation API error");
      }

      const data = await response.json();
      res.json({ translatedText: data.data.translations[0].translatedText });

    } catch (error) {
      console.error("Translation error:", error);
      // Return fallback mock translation
      res.json({ translatedText: `[${req.body.from?.toUpperCase()}→${req.body.to?.toUpperCase()}] ${req.body.text}` });
    }
  });

  // Marketplace trending items powered by Gemini
  app.get("/api/market/trending", async (req, res) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      const provider = process.env.AI_PROVIDER || (geminiKey ? "gemini" : undefined);
      const location = (req.query.location as string) || "India";
      const crop = (req.query.crop as string) || "general";

      if (provider !== "gemini" || !geminiKey) {
        // Fallback static suggestions
        return res.json({
          pesticides: [
            { name: "Neem Oil (Azadirachtin)", use: "Organic pest control for aphids, mites", safety: "Spray in evening; avoid flowering" },
            { name: "Imidacloprid 17.8% SL", use: "Sucking pests in vegetables", safety: "Follow label; avoid overuse" }
          ],
          equipment: [
            { name: "Low-pressure Sprayer", use: "Foliar application", tip: "Use fine nozzle; uniform coverage" },
            { name: "Drip Irrigation Kit", use: "Water saving irrigation", tip: "Mulch to reduce evaporation" }
          ]
        });
      }

      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;
      const prompt = `You are an agriculture marketplace assistant in ${location}. For crop context: ${crop}. Return a concise JSON with two arrays: pesticides and equipment. Each pesticide item has {name, use, safety}. Each equipment item has {name, use, tip}. Keep 3-5 items per array. No prose.`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 }
        })
      });

      if (!resp.ok) {
        throw new Error(`Gemini error ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Try to parse JSON from the model output
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        return res.json(json);
      }

      // Fallback minimal structure
      return res.json({ pesticides: [], equipment: [] });
    } catch (error) {
      console.error("Trending market API error:", error);
      res.status(200).json({ pesticides: [], equipment: [] });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function buildSystemPrompt(context: any): string {
  const { profile, weather } = context;

  let prompt = `You are KRISHI SAKHI, a friendly AI farming companion for Indian farmers. Your role is to provide practical, actionable farming advice in a conversational, non-technical tone.

FARMER PROFILE:
- Name: ${profile?.name || "Farmer"}
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
1. Keep responses short, friendly, and actionable (2-4 bullet points max)
2. Use relevant emojis (🌾, 🌧️, 🌞, 💧, etc.)
3. Include weather-based advice:
   - If temp >35°C: recommend irrigation timing and frequency
   - If rain >60%: advise against irrigation and outdoor spraying
   - If humidity >85% + rice crop: mention favorable conditions
4. Address the farmer by name when appropriate
5. Be encouraging and supportive
6. Provide specific steps they can take today/this week
7. Reference their specific crop and conditions when relevant

Respond as a knowledgeable but friendly farming advisor who understands local Indian farming practices.`;

  return prompt;
}
