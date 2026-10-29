"use client";

import { useState, useCallback, useEffect } from "react";
import { audioAlertEngine } from "@/lib/audioAlerts";

export function useAudioAlerts() {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(audioAlertEngine.isMuted());
  }, []);

  const toggleMute = useCallback(() => {
    const next = audioAlertEngine.toggleMute();
    setIsMuted(next);
  }, []);

  const testAudio = useCallback(() => {
    audioAlertEngine.playCriticalPanicChime();
  }, []);

  return {
    isMuted,
    toggleMute,
    testAudio,
  };
}
