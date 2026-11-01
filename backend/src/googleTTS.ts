/**
 * Google Text-to-Speech (TTS) natural voice engine for Indian languages
 */

const LANG_MAPPING: Record<string, string> = {
  hi: "hi",
  en: "en-in",
  ta: "ta",
  te: "te",
  bn: "bn",
  kn: "kn",
  ml: "ml",
  mr: "mr",
  gu: "gu",
  pa: "pa",
  ur: "ur",
  od: "or",
  as: "as"
};

/**
 * Split long AI responses into natural speech chunks under 180 chars
 */
function splitIntoSpeechChunks(text: string): string[] {
  // Clean markdown asterisks, hashes, backticks, emojis so speech sounds natural
  const clean = text
    .replace(/[*#`_~]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[🌾🌱🚜🌧️💧☀️]/g, "")
    .trim();

  if (!clean) return [];

  // Match sentences by sentence terminators (., !, ?, ।, \n)
  const rawSentences = clean.split(/(?<=[.!?।\n])\s+/);
  const chunks: string[] = [];

  let current = "";
  for (const s of rawSentences) {
    if (!s) continue;
    if ((current + " " + s).trim().length < 160) {
      current = (current + " " + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length > 160) {
        // split long clause by commas or conjunctions
        const sub = s.split(/(?<=[,;])\s+/);
        let subCurr = "";
        for (const part of sub) {
          if ((subCurr + " " + part).trim().length < 160) {
            subCurr = (subCurr + " " + part).trim();
          } else {
            if (subCurr) chunks.push(subCurr);
            subCurr = part;
          }
        }
        if (subCurr) current = subCurr;
        else current = "";
      } else {
        current = s;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks.slice(0, 10); // cap to 10 chunks to prevent excess latency
}

export async function generateGoogleTTS(text: string, lang = "en"): Promise<Buffer> {
  const tl = LANG_MAPPING[lang.toLowerCase()] || "hi";
  const chunks = splitIntoSpeechChunks(text);

  if (chunks.length === 0) {
    throw new Error("No pronounceable text provided");
  }

  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
      });

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        audioBuffers.push(buf);
      }
    } catch (e: any) {
      console.warn(`[GoogleTTS] Failed to synthesize chunk "${chunk.slice(0, 20)}...":`, e.message);
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error("Failed to synthesize audio from Google TTS");
  }

  return Buffer.concat(audioBuffers);
}

