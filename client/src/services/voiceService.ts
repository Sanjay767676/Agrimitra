class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  isSTTSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  isTTSSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  startSTT(
    onResult: (transcript: string) => void,
    onError: (error: any) => void,
    language: string = 'en-US'
  ): any {
    if (!this.isSTTSupported()) {
      onError(new Error('Speech recognition not supported'));
      return null;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.getSTTLanguageCode(language);

    this.recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
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
        console.error('Error stopping speech recognition:', error);
      }
    }
  }

  async speakText(text: string, language: string = 'en'): Promise<void> {
    if (!this.isTTSSupported() || !this.synthesis) {
      throw new Error('Text-to-speech not supported');
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.getTTSLanguageCode(language);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find a voice for the language
      const voices = this.synthesis!.getVoices();
      const voice = voices.find(v => v.lang.startsWith(utterance.lang)) || 
                   voices.find(v => v.lang.startsWith('en')) ||
                   voices[0];
      
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis!.speak(utterance);
    });
  }

  private getSTTLanguageCode(langCode: string): string {
    const sttLanguageMap: Record<string, string> = {
      'en': 'en-US',
      'ml': 'ml-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'ur': 'ur-IN',
      'od': 'or-IN',
      'as': 'as-IN',
    };

    return sttLanguageMap[langCode] || 'en-US';
  }

  private getTTSLanguageCode(langCode: string): string {
    const ttsLanguageMap: Record<string, string> = {
      'en': 'en-US',
      'ml': 'ml-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'kn': 'kn-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'gu': 'gu-IN',
      'pa': 'pa-Guru-IN',
      'ur': 'ur-PK',
      'od': 'or-IN',
      'as': 'as-IN',
    };

    return ttsLanguageMap[langCode] || 'en-US';
  }

  // Cloud-based STT/TTS placeholders for production
  async cloudSTT(audioBlob: Blob, language: string): Promise<string> {
    // Placeholder for Google Cloud Speech-to-Text API
    // In production, this would send audio to a backend endpoint
    // which would call the Google Cloud Speech API securely
    throw new Error('Cloud STT not implemented - use browser STT for demo');
  }

  async cloudTTS(text: string, language: string): Promise<Blob> {
    // Placeholder for Google Cloud Text-to-Speech API
    // In production, this would call a backend endpoint
    // which would generate audio using Google Cloud TTS API
    throw new Error('Cloud TTS not implemented - use browser TTS for demo');
  }
}

export const voiceService = new VoiceService();
