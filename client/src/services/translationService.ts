class TranslationService {
  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    // If languages are the same, return original text
    if (fromLang === toLang) {
      return text;
    }

    try {
      const response = await fetch(`/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from: fromLang, to: toLang }),
      });

      if (!response.ok) {
        throw new Error("Translation API error");
      }

      const data = await response.json();
      return data.translatedText as string;

    } catch (error) {
      console.error("Translation error:", error);
      return this.getMockTranslation(text, fromLang, toLang);
    }
  }

  private getMockTranslation(text: string, fromLang: string, toLang: string): string {
    // Mock translation mapping for demo purposes
    const translations: Record<string, Record<string, Record<string, string>>> = {
      "ml": {
        "en": {
          "എന്റെ വിളകൾക്ക് എന്ത് ചെയ്യണം?": "What should I do for my crops?",
          "മഴയുടെ സാധ്യത എത്രയാണ്?": "What is the probability of rain?",
          "നീരാവി എത്രയാണ്?": "What is the humidity?",
        }
      },
      "en": {
        "ml": {
          "What should I do for my crops?": "എന്റെ വിളകൾക്ക് എന്ത് ചെയ്യണം?",
          "Check your irrigation system": "നിങ്ങളുടെ ജലസേചന സംവിധാനം പരിശോധിക്കുക",
          "Monitor for pests": "കീടങ്ങളെ നിരീക്ഷിക്കുക",
        }
      }
    };

    // Try to find exact match
    if (translations[fromLang]?.[toLang]?.[text]) {
      return translations[fromLang]![toLang]![text]!;
    }

    // Keep text unchanged if no translation available

    // For other languages to English, try to return original or add a note
    if (toLang === "en" && fromLang !== "en") {
      return `[${fromLang.toUpperCase()}] ${text}`;
    }

    // Fallback: return original text
    return text;
  }
}

export const translationService = new TranslationService();
