class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  isSTTSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }

  isTTSSupported(): boolean {
    return true;
  }

  /**
   * Request or verify microphone access cleanly via MediaDevices
   */
  async requestMicAccess(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately after checking permission so the mic is released
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e: any) {
      console.warn("[VoiceService] Mic permission check:", e.name || e.message);
      return false;
    }
  }

  /**
   * Start Google Cloud Speech-to-Text via browser SpeechRecognition engine
   */
  startSTT(
    onResult: (transcript: string, isFinal?: boolean) => void,
    onError: (error: any) => void,
    language: string = "hi"
  ): any {
    if (!this.isSTTSupported()) {
      onError(new Error("Speech recognition not supported in this browser"));
      return null;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.getSTTLanguageCode(language);

    console.log(`[Google STT] Listening in language: ${this.recognition.lang}`);

    this.recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const resultText = (final || interim).trim();
      if (resultText) {
        onResult(resultText, Boolean(final));
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn("[Google STT] Recognition status/event:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onError("not-allowed");
      } else if (event.error !== "no-speech") {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      console.log("[Google STT] Session completed");
    };

    try {
      this.recognition.start();
      return this.recognition;
    } catch (error) {
      onError(error);
      return null;
    }
  }

  stopSTT(recognition: any): void {
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  }

  /**
   * Stop any ongoing speech playback (Google TTS audio or SpeechSynthesis)
   */
  stopAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Clean markdown asterisks, bullet emojis, and links for human-sounding TTS
   */
  private cleanTextForSpeech(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[🌾🌧️🌞💧🌱🚜🛡️🔧📦💰📉📈👉⚠️✔️✨]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();
  }

  /**
   * Speak using natural Google Cloud TTS proxy with browser SpeechSynthesis fallback
   */
  async speakText(text: string, language: string = "hi"): Promise<void> {
    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    this.stopAudio();

    // 1. First priority: Google Natural TTS audio stream
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(language)}`;
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      const playPromise = new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = (e) => {
          this.currentAudio = null;
          reject(e);
        };
      });

      await audio.play();
      await playPromise;
      return;
    } catch (e: any) {
      console.warn("[VoiceService] Google TTS playback failed, falling back to local synthesizer:", e.message);
    }

    // 2. Secondary fallback: Browser SpeechSynthesis
    if (!this.synthesis) return;

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = this.getTTSLanguageCode(language);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = this.synthesis?.getVoices() || [];
      const matchLang = utterance.lang.toLowerCase();
      const preferredVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith(matchLang.slice(0, 2))
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synthesis?.speak(utterance);
    });
  }

  private getSTTLanguageCode(lang: string): string {
    const map: Record<string, string> = {
      ta: "ta-IN",
      hi: "hi-IN",
      te: "te-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      ml: "ml-IN",
      pa: "pa-IN",
      ur: "ur-IN",
      od: "or-IN",
      as: "as-IN",
      en: "en-IN",
    };
    return map[lang] || "hi-IN";
  }

  private getTTSLanguageCode(lang: string): string {
    const map: Record<string, string> = {
      ta: "ta-IN",
      hi: "hi-IN",
      te: "te-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      ml: "ml-IN",
      pa: "pa-IN",
      ur: "ur-IN",
      od: "or-IN",
      as: "as-IN",
      en: "en-US",
    };
    return map[lang] || "hi-IN";
  }
}

export const voiceService = new VoiceService();
