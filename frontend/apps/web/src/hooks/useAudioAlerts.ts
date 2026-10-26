"use client";

import { useState, useEffect, useCallback } from "react";
import { audioAlertEngine, AlertPriority } from "@/lib/audioAlerts";

export function useAudioAlerts() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.8);

  useEffect(() => {
    setIsMuted(audioAlertEngine.getIsMuted());
    setVolumeState(audioAlertEngine.getVolume());
  }, []);

  const toggleMute = useCallback(() => {
    const nextState = audioAlertEngine.toggleMute();
    setIsMuted(nextState);
    return nextState;
  }, []);

  const setVolume = useCallback((vol: number) => {
    audioAlertEngine.setVolume(vol);
    setVolumeState(vol);
  }, []);

  const playAlert = useCallback(async (priority: AlertPriority) => {
    await audioAlertEngine.playAlert(priority);
  }, []);

  const testAudio = useCallback(async () => {
    await audioAlertEngine.playCriticalPanicChime();
  }, []);

  return {
    isMuted,
    volume,
    toggleMute,
    setVolume,
    playAlert,
    testAudio,
  };
}
