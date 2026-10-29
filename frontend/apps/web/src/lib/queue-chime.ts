export type ChimeStyle =
  | "CRYSTAL_BELL"
  | "AIRPORT_DINGDONG"
  | "ELEVATED_TRIAD"
  | "SUBTLE_PING";

export type AnnouncementLanguage = "EN_IN" | "HI_IN" | "BILINGUAL";

export interface ChimeSettings {
  style: ChimeStyle;
  volume: number;
  voiceEnabled: boolean;
  language: AnnouncementLanguage;
  speechRate: number;
  rate?: number;
  speechPitch: number;
  repeatTwice: boolean;
  muted?: boolean;
}

const DEFAULT_CHIME_SETTINGS: ChimeSettings = {
  style: "CRYSTAL_BELL",
  volume: 0.8,
  voiceEnabled: true,
  language: "BILINGUAL",
  speechRate: 0.95,
  rate: 0.95,
  speechPitch: 1.0,
  repeatTwice: false,
  muted: false,
};

class QueueAudioEngine {
  private settings: ChimeSettings = { ...DEFAULT_CHIME_SETTINGS };

  getSettings(): ChimeSettings {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("labcore_chime_settings");
        if (raw) {
          this.settings = { ...DEFAULT_CHIME_SETTINGS, ...JSON.parse(raw) };
        }
      } catch {}
    }
    return { ...this.settings };
  }

  updateSettings(partial: Partial<ChimeSettings>): ChimeSettings {
    this.settings = { ...this.getSettings(), ...partial };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("labcore_chime_settings", JSON.stringify(this.settings));
      } catch {}
    }
    return { ...this.settings };
  }

  setMuted(muted: boolean) {
    this.updateSettings({ muted });
  }

  async playHospitalChime(style?: ChimeStyle): Promise<void> {
    if (typeof window === "undefined") return;
    const current = this.getSettings();
    if (current.muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const s = style || current.style;
      const freq = s === "AIRPORT_DINGDONG" ? 659.25 : s === "SUBTLE_PING" ? 880 : 783.99;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(0.05, current.volume * 0.15), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  async announceToken(tokenData?: any): Promise<void> {
    await this.playHospitalChime();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const current = this.getSettings();
    if (current.muted || !current.voiceEnabled) return;
    try {
      const tokenNo = tokenData?.tokenNumber || tokenData?.token || "OPD-101";
      const patientName = tokenData?.patientName || tokenData?.name || "Patient";
      const room = tokenData?.station || tokenData?.room || "Collection Counter 1";
      const utterance = new SpeechSynthesisUtterance(
        `Token ${tokenNo}, ${patientName}, please proceed to ${room}.`
      );
      utterance.rate = current.speechRate || 0.95;
      utterance.pitch = current.speechPitch || 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  async testPreviewAnnouncement(): Promise<void> {
    await this.announceToken({
      tokenNumber: "OPD-108",
      patientName: "Rajeshwari Devi",
      station: "Phlebotomy Bay 1",
    });
  }
}

export const queueAudio = new QueueAudioEngine();
