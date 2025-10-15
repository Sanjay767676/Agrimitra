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

  // Add welcome message if no messages
  useEffect(() => {
    if (messages.length === 0 && profile) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        sender: "bot",
        message: "🙏 Namaste! I'm KRISHI SAKHI, your AI farming companion. I can help you with crop advice, weather insights, and farming best practices. How can I assist you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, profile]);

  const sendMessage = async (messageText: string) => {
    if (!profile || !messageText.trim()) return;

    setIsLoading(true);

    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: "farmer",
        message: messageText,
        timestamp: new Date(),
        originalLanguage: profile.chatbotLanguage,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Translate message to English if needed
      let englishMessage = messageText;
      if (profile.chatbotLanguage !== "en") {
        englishMessage = await translationService.translateText(
          messageText,
          profile.chatbotLanguage,
          "en"
        );
      }

      // Build context for AI
      const context = {
        profile: {
          name: profile.name,
          crop: profile.cropType,
          soil: profile.soilType,
          irrigation: profile.irrigation,
          landSize: `${profile.landSize} ${profile.landUnit}`,
          location: profile.location,
        },
        weather: weather ? {
          tempC: weather.tempC,
          humidity: weather.humidity,
          condition: weather.condition,
          rainProb: Math.round(weather.rainProb24h * 100),
        } : null,
        recentMessages: updatedMessages.slice(-6), // Last 3 exchanges
      };

      // Get AI response
      const aiResponse = await aiService.getChatResponse(englishMessage, context);

      // Translate response back to chatbot language if needed
      let translatedResponse = aiResponse;
      if (profile.chatbotLanguage !== "en") {
        translatedResponse = await translationService.translateText(
          aiResponse,
          "en",
          profile.chatbotLanguage
        );
      }

      // Add bot message
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: translatedResponse,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Save to storage
      await storageService.saveChatHistory(profile.id!, finalMessages);

    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        message: "I'm sorry, I'm having trouble responding right now. Please try again later.",
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
