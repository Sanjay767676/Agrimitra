/**
 * High-quality multi-language translator for Indian languages powered by Gemini
 */

const translationCache = new Map<string, string>();

const LANGUAGE_NAMES: Record<string, string> = {
  ta: "Tamil",
  hi: "Hindi",
  te: "Telugu",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
  od: "Odia",
  as: "Assamese",
  en: "English"
};

export async function translateTextWithAI(
  text: string,
  fromLang = "en",
  toLang = "ta"
): Promise<string> {
  const clean = text?.trim();
  if (!clean) return "";
  if (fromLang.toLowerCase() === toLang.toLowerCase()) return clean;

  const cacheKey = `${fromLang.toLowerCase()}->${toLang.toLowerCase()}:${clean}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const targetLangName = LANGUAGE_NAMES[toLang.toLowerCase()] || toLang;
  const sourceLangName = LANGUAGE_NAMES[fromLang.toLowerCase()] || fromLang;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${geminiKey}`;

      const prompt = `Translate the following text from ${sourceLangName} to natural, fluent ${targetLangName} for an Indian farmer. Output ONLY the translated text without explanations, markdown or quotation marks:\n\n${clean}`;

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
        })
      });

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          translationCache.set(cacheKey, translated);
          return translated;
        }
      }
    } catch (e: any) {
      console.warn(`[Translator] Translation error:`, e.message);
    }
  }

  return clean;
}

