import { useState, useCallback, useRef } from "react";
import { voiceService } from "../services/voiceService";

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback((onResult: (transcript: string) => void) => {
    if (!voiceService.isSTTSupported()) {
      console.warn("Speech recognition not supported");
      return;
    }

    try {
      recognitionRef.current = voiceService.startSTT(
        (transcript) => {
          setIsRecording(false);
          onResult(transcript);
        },
        (error) => {
          console.error("Speech recognition error:", error);
          setIsRecording(false);
        }
      );
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      voiceService.stopSTT(recognitionRef.current);
      setIsRecording(false);
    }
  }, []);

  const speak = useCallback(async (text: string, language: string = "en") => {
    if (!ttsEnabled || !voiceService.isTTSSupported()) return;

    try {
      setIsPlaying(true);
      await voiceService.speakText(text, language);
    } catch (error) {
      console.error("TTS error:", error);
    } finally {
      setIsPlaying(false);
    }
  }, [ttsEnabled]);

  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => !prev);
  }, []);

  return {
    isRecording,
    isPlaying,
    ttsEnabled,
    startRecording,
    stopRecording,
    speak,
    toggleTTS,
    isSTTSupported: voiceService.isSTTSupported(),
    isTTSSupported: voiceService.isTTSSupported(),
  };
}
