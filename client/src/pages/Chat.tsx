import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "../hooks/useProfile";
import { useWeather } from "../hooks/useWeather";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { useI18n } from "../hooks/useI18n";
import ChatMessage from "../components/ui/chat-message";
import AlertCard from "../components/ui/alert-card";
import VoiceButton from "../components/ui/voice-button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Chat() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { weather, alerts, isLoading: weatherLoading } = useWeather();
  const { messages, sendMessage, isLoading: chatLoading } = useChat();
  const { isRecording, isPlaying, startRecording, stopRecording, speak, toggleTTS, ttsEnabled } = useVoice();
  const { languages } = useI18n();
  const [inputMessage, setInputMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;
    
    const message = inputMessage.trim();
    setInputMessage("");
    
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAlertClick = async (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    // Generate contextual message based on alert type
    let contextualMessage = "";
    if (alert.type === "weather") {
      contextualMessage = `Tell me about the ${alert.title.toLowerCase()} and what I should do for my crops.`;
    } else if (alert.type === "pest") {
      contextualMessage = `What should I do about the ${alert.title.toLowerCase()}?`;
    } else if (alert.type === "market") {
      contextualMessage = `Give me advice about the ${alert.title.toLowerCase()}.`;
    }

    if (contextualMessage) {
      await sendMessage(contextualMessage);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((transcript) => {
        setInputMessage(transcript);
        textareaRef.current?.focus();
      });
    }
  };

  const currentChatLanguage = languages.find(lang => lang.code === profile?.chatbotLanguage) || languages[0];

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-user-circle text-4xl text-muted-foreground mb-4"></i>
            <h2 className="text-xl font-semibold mb-2">Profile Required</h2>
            <p className="text-muted-foreground mb-4">
              Please set up your farmer profile before using the chat.
            </p>
            <Button onClick={() => window.location.href = "/profile"}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className={`w-80 bg-card border-r border-border flex flex-col ${sidebarOpen ? 'block' : 'hidden md:flex'}`}>
          {/* Profile Summary */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <i className="fas fa-user text-primary text-xl"></i>
              </div>
              <div>
                <h3 className="font-semibold text-foreground" data-testid="text-farmer-name">
                  {profile.name}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-farmer-location">
                  {profile.location || "Location not set"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 p-2 rounded-lg">
                <p className="text-muted-foreground">Crop</p>
                <p className="font-medium" data-testid="text-farmer-crop">
                  {t(`crops.${profile.cropType}`)}
                </p>
              </div>
              <div className="bg-muted/50 p-2 rounded-lg">
                <p className="text-muted-foreground">Land</p>
                <p className="font-medium" data-testid="text-farmer-land">
                  {profile.landSize} {t(`units.${profile.landUnit}`)}
                </p>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t("chat.activeAlerts")}</h3>
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                {alerts.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onClick={() => handleAlertClick(alert.id)}
                />
              ))}
            </div>

            {/* Weather Summary */}
            <div className="mt-6 bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground text-sm mb-3">{t("chat.currentWeather")}</h4>
              {weatherLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : weather ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <i className="fas fa-thermometer-half text-destructive mb-1"></i>
                    <p className="text-muted-foreground">{t("chat.temperature")}</p>
                    <p className="font-medium" data-testid="text-temperature">{weather.tempC}°C</p>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-tint text-primary mb-1"></i>
                    <p className="text-muted-foreground">{t("chat.humidity")}</p>
                    <p className="font-medium" data-testid="text-humidity">{weather.humidity}%</p>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-cloud-rain text-accent mb-1"></i>
                    <p className="text-muted-foreground">{t("chat.rainChance")}</p>
                    <p className="font-medium" data-testid="text-rain-chance">{Math.round(weather.rainProb24h * 100)}%</p>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-wind text-muted-foreground mb-1"></i>
                    <p className="text-muted-foreground">{t("chat.wind")}</p>
                    <p className="font-medium" data-testid="text-wind">{weather.wind} km/h</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Weather data unavailable</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-card border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-full">
                <i className="fas fa-robot text-primary-foreground"></i>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t("chat.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("chat.subtitle")}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTTS}
                className={ttsEnabled ? "bg-primary text-primary-foreground" : ""}
                data-testid="button-toggle-tts"
              >
                <i className={`fas ${ttsEnabled ? "fa-volume-up" : "fa-volume-mute"}`}></i>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <i className="fas fa-bars"></i>
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages-container">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onPlay={(text) => speak(text, profile.chatbotLanguage)}
                isPlaying={isPlaying}
              />
            ))}
            {chatLoading && (
              <div className="flex items-start space-x-3">
                <div className="bg-primary p-2 rounded-full shrink-0">
                  <i className="fas fa-robot text-primary-foreground text-sm"></i>
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-lg p-4 max-w-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="bg-card border-t border-border p-4">
            {/* Voice Recording Indicator */}
            {isRecording && (
              <div className="flex items-center space-x-2 bg-destructive/10 px-3 py-2 rounded-lg mb-3">
                <div className="flex space-x-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="recording-wave bg-destructive w-1 h-2 rounded-full"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
                <span className="text-sm text-destructive font-medium">{t("chat.recording")}</span>
              </div>
            )}

            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={t("chat.placeholder")}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="resize-none max-h-32 min-h-[2.5rem]"
                  data-testid="textarea-chat-input"
                />
              </div>

              <div className="flex space-x-2">
                <VoiceButton
                  isRecording={isRecording}
                  onClick={handleVoiceInput}
                  disabled={chatLoading}
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full transition-colors"
                  data-testid="button-send-message"
                >
                  <i className="fas fa-paper-plane"></i>
                </Button>
              </div>
            </div>

            {/* Language Indicator */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  <i className="fas fa-language mr-1"></i>
                  {t("chat.chatLanguage")}: <span className="font-medium">{currentChatLanguage.nativeName}</span>
                </span>
                <span>
                  <i className="fas fa-microphone mr-1"></i>
                  {t("chat.voiceReady")}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <i className="fas fa-shield-alt"></i>
                <span>{t("chat.securePrivate")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
