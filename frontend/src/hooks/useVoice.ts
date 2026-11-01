import { useState, useCallback, useRef } from "react";
import { voiceService } from "../services/voiceService";

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(
    async (onResult: (transcript: string) => void, language: string = "hi") => {
      if (!voiceService.isSTTSupported()) {
        console.warn("Speech recognition not supported");
        return;
      }

      setMicPermissionDenied(false);

      // Verify microphone access via getUserMedia first
      const hasAccess = await voiceService.requestMicAccess();
      if (!hasAccess) {
        setMicPermissionDenied(true);
        return;
      }

      try {
        recognitionRef.current = voiceService.startSTT(
          (transcript, isFinal) => {
            onResult(transcript);
            if (isFinal) {
              setIsRecording(false);
            }
          },
          (error) => {
            console.error("Speech recognition error:", error);
            if (error === "not-allowed" || error === "permission-denied") {
              setMicPermissionDenied(true);
            }
            setIsRecording(false);
          },
          language
        );
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        setIsRecording(false);
      }
    },
    []
  );

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      voiceService.stopSTT(recognitionRef.current);
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceService.stopAudio();
    setIsPlaying(false);
  }, []);

  const speak = useCallback(
    async (text: string, language: string = "hi") => {
      if (!ttsEnabled || !voiceService.isTTSSupported()) return;

      try {
        setIsPlaying(true);
        await voiceService.speakText(text, language);
      } catch (error) {
        console.error("TTS error:", error);
      } finally {
        setIsPlaying(false);
      }
    },
    [ttsEnabled]
  );

  const toggleTTS = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      if (!next) {
        voiceService.stopAudio();
      }
      return next;
    });
  }, []);

  return {
    isRecording,
    isPlaying,
    ttsEnabled,
    micPermissionDenied,
    clearMicError: () => setMicPermissionDenied(false),
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
    toggleTTS,
    isSTTSupported: voiceService.isSTTSupported(),
    isTTSSupported: voiceService.isTTSSupported(),
  };
}
