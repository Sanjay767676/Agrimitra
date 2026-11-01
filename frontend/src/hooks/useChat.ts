import { useState, useEffect } from "react";
import { useProfile } from "./useProfile";
import { useWeather } from "./useWeather";
import { aiService } from "../services/aiService";
import { translationService } from "../services/translationService";
import { storageService } from "../services/storageService";
import type { ChatMessage } from "../types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useProfile();
  const { weather } = useWeather();

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (profile?.id) {
        const history = await storageService.getChatHistory(profile.id);
        setMessages(history);
      }
    };
    loadChatHistory();
  }, [profile?.id]);

  // Add welcome message in farmer's preferred language if no messages
  useEffect(() => {
    if (messages.length === 0 && profile) {
      const lang = (profile.chatbotLanguage || "en").toLowerCase();
      let welcomeText = "🙏 Namaste! I'm KRISHI SAKHI, your AI farming companion. I can help you with crop advice, weather insights, and farming best practices. How can I assist you today?";
      if (lang === "ta") {
        welcomeText = "🙏 வணக்கம்! நான் கிருஷி சகி, உங்கள் AI விவசாய தோழி. பயிர் ஆலோசனை, நேரடி வானிலை மற்றும் சிறந்த விவசாய முறைகளில் உங்களுக்கு உதவ நான் தயாராக உள்ளேன். இன்று உங்களுக்கு எவ்வாறு உதவட்டும்?";
      } else if (lang === "hi") {
        welcomeText = "🙏 नमस्ते! मैं कृषि सखी हूँ, आपकी AI कृषि सलाहकार। मैं फसल सलाह, मौसम और खेती की तकनीकों में आपकी सहायता कर सकती हूँ। आज मैं आपकी क्या मदद करूँ?";
      } else if (lang === "te") {
        welcomeText = "🙏 నమస్కారం! నేను కృషి సఖి, మీ AI వ్యవసాయ మిత్రురాలిని. పంట సలహాలు, వాతావరణ సమాచారం అందించడంలో సహాయపడతాను. ఈరోజు మీకు ఎలా సహాయపడగలను?";
      } else if (lang === "kn") {
        welcomeText = "🙏 ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿ ಸಖಿ, ನಿಮ್ಮ AI ಕೃಷಿ ಸಲಹೆಗಾರ್ತಿ. ಬೆಳೆ ಸಲಹೆ ಮತ್ತು ಹವಾಮಾನ ಮಾಹಿತಿಯಲ್ಲಿ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";
      }

      const welcomeMessage: ChatMessage = {
        id: "welcome",
        sender: "bot",
        message: welcomeText,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, profile]);

  const sendMessage = async (messageText: string) => {
    if (!profile || !messageText.trim()) return;

    setIsLoading(true);

    try {
      const chatLang = (profile.chatbotLanguage || "en").toLowerCase();

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "farmer",
        message: messageText,
        timestamp: new Date(),
        originalLanguage: chatLang,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Persist the farmer's message (Supabase when signed in)
      await storageService.appendMessage(userMessage);

      // Build context for AI with explicit language preference
      const context = {
        profile: {
          name: profile.name,
          crop: profile.cropType,
          soil: profile.soilType,
          irrigation: profile.irrigation,
          landSize: `${profile.landSize} ${profile.landUnit}`,
          location: profile.location,
          chatbotLanguage: chatLang,
        },
        language: chatLang,
        weather: weather ? {
          tempC: weather.tempC,
          humidity: weather.humidity,
          condition: weather.condition,
          rainProb: Math.round(weather.rainProb24h * 100),
        } : null,
        recentMessages: updatedMessages.slice(-6),
      };

      // Get AI response
      const aiResponse = await aiService.getChatResponse(messageText, context);

      // Ensure response matches chatbot language
      let finalBotText = aiResponse;
      if (chatLang !== "en") {
        // If the AI somehow replied primarily in English, translate it to the target language
        const isEnglishOnly = /^[\x00-\x7F\s.,!?'"()-]+$/.test(aiResponse.slice(0, 100));
        if (isEnglishOnly) {
          finalBotText = await translationService.translateText(
            aiResponse,
            "en",
            chatLang
          );
        }
      }

      // Add bot message
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: finalBotText,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Persist the bot's reply (Supabase when signed in)
      await storageService.appendMessage(botMessage);

      // Save to storage (localStorage cache / fallback)
      await storageService.saveChatHistory(profile.id || "local", finalMessages);

    } catch (error) {
      console.error("Error sending message:", error);
      
      const chatLang = (profile?.chatbotLanguage || "en").toLowerCase();
      let fallbackError = "I'm sorry, I'm having trouble responding right now. Please try again later.";
      if (chatLang === "ta") {
        fallbackError = "மன்னிக்கவும், தற்போது பதிலளிப்பதில் சிக்கல் ஏற்பட்டுள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.";
      } else if (chatLang === "hi") {
        fallbackError = "क्षमा करें, मुझे इस समय उत्तर देने में समस्या आ रही है। कृपया कुछ समय बाद पुनः प्रयास करें।";
      }

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: fallbackError,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
  };
}
