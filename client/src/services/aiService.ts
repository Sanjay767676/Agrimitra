class AIService {
  constructor() {}

  async getChatResponse(message: string, context: any): Promise<string> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("OpenAI API error:", errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response as string;

    } catch (error) {
      console.error("AI service error:", error);
      
      // Return contextual fallback responses
      return this.getFallbackResponse(message, context);
    }
  }

  private buildSystemPrompt(context: any): string {
    const { profile, weather, recentMessages } = context;
    
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

  private getFallbackResponse(message: string, context: any): string {
    const { profile, weather } = context;
    const lowerMessage = message.toLowerCase();

    // Weather-related responses
    if (lowerMessage.includes("rain") || lowerMessage.includes("weather")) {
      if (weather?.rainProb > 60) {
        return "🌧️ I see rain is expected! For your crops, I recommend:\n• Stop irrigation - let nature water your fields\n• Delay any fertilizer application for 2-3 days\n• Ensure good drainage to prevent waterlogging\n• Cover any stored seeds or equipment";
      }
      return "🌤️ Check the local weather forecast regularly. Plan your irrigation and field activities accordingly. Early morning or evening is usually best for most farm work.";
    }

    // Irrigation-related responses
    if (lowerMessage.includes("irrigat") || lowerMessage.includes("water")) {
      if (weather?.tempC > 35) {
        return `🌡️ With ${weather.tempC}°C temperature, your crops need extra care:\n• Increase irrigation frequency\n• Water early morning (5-7 AM) or evening (6-8 PM)\n• Check soil moisture daily\n• Consider mulching to retain moisture`;
      }
      return "💧 For good irrigation:\n• Water early morning or evening\n• Check soil moisture 2-3 inches deep\n• Ensure proper drainage\n• Don't overwater - it can harm roots";
    }

    // Crop-specific advice
    if (profile?.crop === "rice" && (lowerMessage.includes("rice") || lowerMessage.includes("paddy"))) {
      return "🌾 For your rice crop:\n• Maintain proper water levels in fields\n• Watch for pest activity after rain\n• Apply fertilizer when fields are not flooded\n• Keep bunds strong to prevent water loss";
    }

    // Pest-related responses
    if (lowerMessage.includes("pest") || lowerMessage.includes("insect") || lowerMessage.includes("bug")) {
      return "🐛 For pest management:\n• Inspect crops regularly (early morning is best)\n• Use neem-based organic sprays as prevention\n• Remove affected plants immediately\n• Avoid spraying during flowering or when beneficial insects are active";
    }

    // General farming advice
    return `🙏 Thank you for your question! Here's some general advice for your ${profile?.crop || "crops"}:\n• Monitor your fields daily for any changes\n• Keep soil healthy with organic matter\n• Follow local agricultural extension advice\n• Plan activities based on weather forecasts\n\nFeel free to ask about specific farming challenges!`;
  }
}

export const aiService = new AIService();
