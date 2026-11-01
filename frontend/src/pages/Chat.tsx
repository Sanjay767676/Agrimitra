import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "../hooks/useProfile";
import { useWeather } from "../hooks/useWeather";
import { useChat } from "../hooks/useChat";
import { useVoice } from "../hooks/useVoice";
import { useI18n } from "../hooks/useI18n";
import ChatMessage from "../components/ui/chat-message";
import AlertCard from "../components/ui/alert-card";
import VoiceButton from "../components/ui/voice-button";

export default function Chat() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { weather, alerts, isLoading: weatherLoading } = useWeather();
  const { messages, sendMessage, isLoading: chatLoading } = useChat();
  const { isRecording, isPlaying, startRecording, stopRecording, speak, stopSpeaking, toggleTTS, ttsEnabled, micPermissionDenied, clearMicError } = useVoice();
  const { languages } = useI18n();
  const [inputMessage, setInputMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  const currentChatLanguage = languages.find((lang) => lang.code === profile?.chatbotLanguage) || languages[0];

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

  // Natural Google TTS auto-speech when new Krishi Sakhi response arrives
  useEffect(() => {
    if (!ttsEnabled || messages.length <= 1) return;
    const latest = messages[messages.length - 1];
    if (latest && latest.sender === "bot" && latest.id !== "welcome" && latest.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = latest.id;
      speak(latest.message, profile?.chatbotLanguage || "hi");
    }
  }, [messages, ttsEnabled, profile?.chatbotLanguage, speak]);

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
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

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
      const langCode = profile?.chatbotLanguage || "hi";
      startRecording((transcript) => {
        setInputMessage(transcript);
        textareaRef.current?.focus();
      }, langCode);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 rounded-3xl shadow-organic">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-user-circle text-4xl text-muted-foreground mb-4"></i>
            <h2 className="text-xl font-heading font-semibold mb-2">Profile Required</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Please set up your farmer profile before using the chat.
            </p>
            <Button onClick={() => (window.location.href = "/profile")} className="rounded-xl">
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
        {/* Sidebar - Farm Context & Alerts */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 w-80 bg-card border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col`}
          data-testid="chat-sidebar"
        >
          {/* Farm Profile Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-2xl p-2.5">
                <i className="fas fa-seedling text-primary-foreground text-lg"></i>
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground">{profile.name}</h2>
                <p className="text-xs text-muted-foreground">{profile.location || "Location not set"}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/40 p-2 rounded-xl">
              <span>🌾 {profile.cropType}</span>
              <span>•</span>
              <span>{profile.landSize} {profile.landUnit}</span>
              <span>•</span>
              <span>💧 {profile.irrigation}</span>
            </div>
          </div>

          {/* Alerts & Insights */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-2 text-sm flex items-center gap-1.5">
                <i className="fas fa-bell text-accent"></i>
                Active Alerts
              </h3>
              {weatherLoading ? (
                <div className="space-y-2">
                  <div className="h-16 bg-muted/60 rounded-xl animate-pulse"></div>
                  <div className="h-16 bg-muted/60 rounded-xl animate-pulse"></div>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} onClick={() => handleAlertClick(alert.id)} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground p-3 border border-border rounded-xl text-center">
                  No critical alerts for your farm.
                </div>
              )}
            </div>

            {/* Speaking Language Card */}
            <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <i className="fas fa-volume-up"></i> AI Voice & STT
                </span>
                <a href="/profile" className="text-[11px] text-primary hover:underline">
                  Change
                </a>
              </div>
              <p className="text-xs text-foreground font-medium">
                Speaking: <span className="font-bold text-primary">{currentChatLanguage.nativeName}</span> ({currentChatLanguage.name})
              </p>
              <p className="text-[11px] text-muted-foreground">
                Google Natural STT & Voice configured in Profile
              </p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-card border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-3 rounded-full shadow-sm">
                <i className="fas fa-robot text-primary-foreground"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-foreground">{t("chat.title", { defaultValue: "KRISHI SAKHI" })}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                    AI Farm Advisor
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Voice in {currentChatLanguage.nativeName} ({currentChatLanguage.name})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Speaking Indicator */}
              {isPlaying && (
                <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                  <i className="fas fa-volume-up"></i>
                  <span>Speaking...</span>
                  <button
                    onClick={stopSpeaking}
                    className="hover:text-destructive text-primary transition-colors ml-1"
                    title="Stop Speaking"
                  >
                    <i className="fas fa-stop-circle"></i>
                  </button>
                </div>
              )}

              {/* TTS Mute/Unmute */}
              <Button
                variant={ttsEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleTTS}
                className="rounded-xl h-9 px-3"
                data-testid="button-toggle-tts"
                title={ttsEnabled ? "Natural Voice Speech On" : "Voice Speech Muted"}
              >
                <i className={`fas ${ttsEnabled ? "fa-volume-up" : "fa-volume-mute"} mr-1.5`}></i>
                <span className="hidden sm:inline text-xs">{ttsEnabled ? "Voice On" : "Muted"}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="md:hidden rounded-xl h-9"
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
                onPlay={(text) => (isPlaying ? stopSpeaking() : speak(text, profile.chatbotLanguage))}
                isPlaying={isPlaying}
              />
            ))}
            {chatLoading && (
              <div className="flex items-start space-x-3">
                <div className="bg-primary p-2 rounded-full shrink-0">
                  <i className="fas fa-robot text-primary-foreground text-sm"></i>
                </div>
                <div className="bg-secondary/40 rounded-2xl rounded-tl-lg p-4 max-w-md border border-border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="bg-card border-t border-border p-4">
            {/* Microphone Permission Warning Banner */}
            {micPermissionDenied && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-2xl mb-3 text-xs leading-relaxed animate-in fade-in">
                <div className="flex items-start space-x-2.5">
                  <i className="fas fa-microphone-slash text-amber-600 dark:text-amber-400 mt-0.5 text-sm"></i>
                  <div>
                    <span className="font-semibold block mb-0.5">Microphone Permission Blocked</span>
                    Click the <strong>lock or site settings icon (🔒)</strong> in your browser's address bar next to <code>localhost</code>, toggle <strong>Microphone</strong> to <strong>Allow</strong>, and click the mic again.
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={clearMicError} className="h-6 w-6 p-0 text-xs shrink-0 ml-2">
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            )}

            {/* Voice Recording Indicator */}
            {isRecording && (
              <div className="flex items-center justify-between bg-destructive/10 px-4 py-2.5 rounded-2xl mb-3 border border-destructive/20 animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="recording-wave bg-destructive w-1 h-3 rounded-full"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                  <span className="text-xs text-destructive font-medium">
                    Google STT Listening in {currentChatLanguage.nativeName}...
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={stopRecording} className="h-6 text-xs text-destructive hover:bg-destructive/10">
                  Done
                </Button>
              </div>
            )}

            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={`Ask Krishi Sakhi in ${currentChatLanguage.nativeName} or speak with microphone...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="resize-none max-h-32 min-h-[2.5rem] rounded-2xl"
                  data-testid="textarea-chat-input"
                />
              </div>

              <div className="flex space-x-2">
                <VoiceButton isRecording={isRecording} onClick={handleVoiceInput} disabled={chatLoading} />

                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full transition-colors h-10 w-10"
                  data-testid="button-send-message"
                >
                  <i className="fas fa-paper-plane text-sm"></i>
                </Button>
              </div>
            </div>

            {/* Language Indicator */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>
                  <i className="fas fa-language mr-1 text-primary"></i>
                  Speaking & Listening: <span className="font-semibold text-foreground">{currentChatLanguage.nativeName}</span>
                </span>
                <span>
                  <i className="fas fa-microphone mr-1 text-primary"></i>
                  Google STT Active
                </span>
              </div>
              <a href="/profile" className="hover:text-primary transition-colors flex items-center gap-1">
                <i className="fas fa-cog text-[10px]"></i>
                Change Voice Language
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
