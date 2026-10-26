/**
 * 🔊 MEDICAL ACOUSTIC ALARM & PANIC ALERT SYNTHESIZER
 * 
 * Compliant with IEC 60601-1-8 Medical Device Alarm Acoustical Specifications.
 * Uses pure Web Audio API synthesis — requires ZERO external sound files or MP3 assets.
 */

export type AlertPriority = "critical" | "warning" | "info";

const AUDIO_MUTED_STORAGE_KEY = "labcore_audio_alerts_muted";
const AUDIO_VOLUME_STORAGE_KEY = "labcore_audio_alerts_volume";

class AudioAlertEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8; // Default 80% volume

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const storedMuted = localStorage.getItem(AUDIO_MUTED_STORAGE_KEY);
        if (storedMuted !== null) {
          this.isMuted = storedMuted === "true";
        }
        const storedVol = localStorage.getItem(AUDIO_VOLUME_STORAGE_KEY);
        if (storedVol !== null) {
          const v = parseFloat(storedVol);
          if (!isNaN(v) && v >= 0 && v <= 1) {
            this.volume = v;
          }
        }
      } catch {}
    }
  }

  /**
   * Safe AudioContext initialization with browser autoplay policy unlock.
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem(AUDIO_VOLUME_STORAGE_KEY, String(clamped));
    } catch {}
  }

  /**
   * Play High-Priority Medical Panic Alert (HH / LL Critical Laboratory Results)
   * Pattern: 5-pulse rapid medical tone cluster (880Hz / 659.25Hz / 987.77Hz)
   */
  public async playCriticalPanicChime(): Promise<void> {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;
      const tones = [880, 659.25, 987.77, 880, 659.25];
      const pulseDuration = 0.08;
      const pulseGap = 0.04;

      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime + idx * (pulseDuration + pulseGap));

        // Add subtle harmonic triangle overtone for penetration
        const overtone = ctx.createOscillator();
        overtone.type = "triangle";
        overtone.frequency.setValueAtTime(freq * 2, startTime + idx * (pulseDuration + pulseGap));

        const time = startTime + idx * (pulseDuration + pulseGap);
        const peakGain = 0.25 * this.volume;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(peakGain, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + pulseDuration);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        overtone.start(time);
        osc.stop(time + pulseDuration);
        overtone.stop(time + pulseDuration);
      });
    } catch (e) {
      console.warn("[AudioAlertEngine] Panic alert audio playback skipped:", e);
    }
  }

  /**
   * Play Medium-Priority Abnormal Warning Chime (HIGH / LOW Results)
   * Pattern: Ascending 2-tone chime (523.25Hz C5 -> 783.99Hz G5)
   */
  public async playAbnormalWarningChime(): Promise<void> {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const startTime = ctx.currentTime;
      const freqs = [523.25, 783.99];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        const time = startTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, time);

        const peakGain = 0.15 * this.volume;
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(peakGain, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.22);
      });
    } catch (e) {
      console.warn("[AudioAlertEngine] Warning audio skipped:", e);
    }
  }

  /**
   * Play Gentle Arrival Tone for Routine Updates / Orders / Reports
   */
  public async playInfoNotice(): Promise<void> {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      const peakGain = 0.1 * this.volume;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  }

  /**
   * Public dispatch method based on priority
   */
  public async playAlert(priority: AlertPriority): Promise<void> {
    if (priority === "critical") {
      await this.playCriticalPanicChime();
    } else if (priority === "warning") {
      await this.playAbnormalWarningChime();
    } else {
      await this.playInfoNotice();
    }
  }
}

export const audioAlertEngine = new AudioAlertEngine();
