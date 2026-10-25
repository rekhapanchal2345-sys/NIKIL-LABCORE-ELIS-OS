/**
 * LabCore ELIS LIS - Elite Hospital Acoustic Chime & Clear Speech Engine
 * Multi-Harmonic Web Audio Synthesizer + Protected SpeechSynthesis Coordinator
 * Standardized for Hospital, Laboratory, and Multi-Specialty Clinical Environments
 */

export type ChimeStyle = 'CRYSTAL_BELL' | 'AIRPORT_DINGDONG' | 'ELEVATED_TRIAD' | 'SUBTLE_PING';
export type AnnouncementLanguage = 'en' | 'hi' | 'both';

export interface ChimeSettings {
  volume: number; // 0.1 to 1.0
  rate: number; // 0.85 to 1.15
  pitch: number; // 0.9 to 1.1
  style: ChimeStyle;
  language: AnnouncementLanguage;
}

class EliteQueueAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private speechQueue: Array<{ text: string; lang: 'en-IN' | 'hi-IN'; onEnd?: () => void }> = [];
  private isSpeaking: boolean = false;
  private activeUtterances: Set<SpeechSynthesisUtterance> = new Set();

  private settings: ChimeSettings = {
    volume: 0.85,
    rate: 0.92,
    pitch: 1.0,
    style: 'CRYSTAL_BELL',
    language: 'both',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('labcore_chime_settings_v1');
        if (saved) {
          this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
      } catch {}
    }
  }

  public getSettings(): ChimeSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<ChimeSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('labcore_chime_settings_v1', JSON.stringify(this.settings));
      } catch {}
    }
  }

  private initAudio() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.speechQueue = [];
      this.activeUtterances.clear();
      this.isSpeaking = false;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Synthesize an acoustic multi-harmonic medical chime with smooth exponential decay
   */
  private playHarmonicTone(frequency: number, startTime: number, duration: number, gainWeight = 1.0) {
    if (!this.audioCtx) return;

    const baseGain = 0.28 * this.settings.volume * gainWeight;

    // Fundamental Tone
    const osc1 = this.audioCtx.createOscillator();
    const gain1 = this.audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);
    gain1.gain.setValueAtTime(baseGain, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc1.connect(gain1);
    gain1.connect(this.audioCtx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + duration);

    // 2nd Harmonic (Octave overtone for crystalline warmth)
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, startTime);
    gain2.gain.setValueAtTime(baseGain * 0.25, startTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.65);
    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);
    osc2.start(startTime);
    osc2.stop(startTime + duration * 0.65);

    // 3rd Harmonic (Soft overtone)
    const osc3 = this.audioCtx.createOscillator();
    const gain3 = this.audioCtx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(frequency * 3, startTime);
    gain3.gain.setValueAtTime(baseGain * 0.08, startTime);
    gain3.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.4);
    osc3.connect(gain3);
    gain3.connect(this.audioCtx.destination);
    osc3.start(startTime);
    osc3.stop(startTime + duration * 0.4);
  }

  /**
   * Play the selected hospital acoustic chime
   */
  public playHospitalChime(overrideStyle?: ChimeStyle): Promise<void> {
    if (this.isMuted || typeof window === 'undefined') return Promise.resolve();
    this.initAudio();

    const style = overrideStyle || this.settings.style;

    return new Promise((resolve) => {
      try {
        if (!this.audioCtx) {
          resolve();
          return;
        }

        const now = this.audioCtx.currentTime + 0.02;

        if (style === 'CRYSTAL_BELL') {
          // 3-tone melodic hospital chime (G5 ~784Hz -> E5 ~659Hz -> C5 ~523Hz)
          this.playHarmonicTone(783.99, now, 0.75, 0.9);
          this.playHarmonicTone(659.25, now + 0.28, 0.75, 0.95);
          this.playHarmonicTone(523.25, now + 0.56, 1.25, 1.0);
          setTimeout(resolve, 1450);
        } else if (style === 'AIRPORT_DINGDONG') {
          // Classic 2-tone airport / clinical bell (F5 ~698Hz -> C5 ~523Hz)
          this.playHarmonicTone(698.46, now, 0.85, 1.0);
          this.playHarmonicTone(523.25, now + 0.38, 1.35, 1.05);
          setTimeout(resolve, 1350);
        } else if (style === 'ELEVATED_TRIAD') {
          // Upward rising warm triad (C5 ~523Hz -> E5 ~659Hz -> G5 ~784Hz)
          this.playHarmonicTone(523.25, now, 0.65, 0.9);
          this.playHarmonicTone(659.25, now + 0.22, 0.75, 0.95);
          this.playHarmonicTone(783.99, now + 0.45, 1.35, 1.05);
          setTimeout(resolve, 1400);
        } else {
          // SUBTLE_PING: Single gentle confirmation note (A5 ~880Hz)
          this.playHarmonicTone(880.0, now, 1.1, 0.9);
          setTimeout(resolve, 800);
        }
      } catch (err) {
        console.warn('AudioContext chime error:', err);
        resolve();
      }
    });
  }

  /**
   * Convert token string into clear, separated phonetic digits
   * e.g. "T-05" -> "T, 0, 5" | "EMG-01" -> "Emergency Token, E, M, G, 0, 1"
   */
  private formatTokenForSpeech(tokenNumber: string): { english: string; hindi: string } {
    const raw = tokenNumber.trim();

    if (raw.startsWith('EMG-')) {
      const num = raw.replace('EMG-', '').split('').join(', ');
      return {
        english: `Emergency Token E, M, G, ${num}`,
        hindi: `आपातकालीन टोकन ई, एम, जी, ${num}`,
      };
    }

    if (raw.startsWith('VIP-')) {
      const num = raw.replace('VIP-', '').split('').join(', ');
      return {
        english: `Priority Token V, I, P, ${num}`,
        hindi: `प्राथमिकता टोकन वी, आई, पी, ${num}`,
      };
    }

    if (raw.startsWith('SNR-')) {
      const num = raw.replace('SNR-', '').split('').join(', ');
      return {
        english: `Senior Citizen Token S, N, R, ${num}`,
        hindi: `वरिष्ठ नागरिक टोकन एस, एन, आर, ${num}`,
      };
    }

    if (raw.startsWith('PED-')) {
      const num = raw.replace('PED-', '').split('').join(', ');
      return {
        english: `Pediatric Token P, E, D, ${num}`,
        hindi: `बाल चिकित्सा टोकन पी, ई, डी, ${num}`,
      };
    }

    // Standard tokens like T-14 -> "Token T, 1, 4"
    const cleaned = raw.replace('-', ' ').split('').join(', ');
    return {
      english: `Token ${cleaned}`,
      hindi: `टोकन ${cleaned}`,
    };
  }

  /**
   * Announce token with crystal-clear hospital speech
   */
  public async announceToken(options: {
    tokenNumber: string;
    patientName: string;
    counterName: string;
    language?: AnnouncementLanguage;
  }) {
    if (this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    const lang = options.language || this.settings.language;

    // 1. First trigger acoustic hospital chime bell
    await this.playHospitalChime();

    const phonetics = this.formatTokenForSpeech(options.tokenNumber);

    // English Announcement
    const cleanPatientName = options.patientName.replace(/[^a-zA-Z\s.]/g, '');
    const cleanCounter = options.counterName.replace(/[(].*?[)]/g, '').trim();

    const englishText = `Attention please. ${phonetics.english}, ${cleanPatientName}, please proceed to ${cleanCounter}.`;

    // Hindi Announcement
    const hindiCounter = cleanCounter
      .replace(/Phlebotomy Booth/gi, 'फ़्लेबोटोमी बूथ')
      .replace(/OPD Cabin/gi, 'ओपीडी कक्ष')
      .replace(/Triage & Vitals/gi, 'ट्राइएज एवं वाइटल्स डेस्क')
      .replace(/Billing/gi, 'बिलिंग काउंटर');

    const hindiText = `कृपया ध्यान दें। ${phonetics.hindi}, ${cleanPatientName}, कृपया ${hindiCounter} पर पधारें।`;

    if (lang === 'en' || lang === 'both') {
      this.enqueueSpeech(englishText, 'en-IN');
    }

    if (lang === 'hi' || lang === 'both') {
      this.enqueueSpeech(hindiText, 'hi-IN');
    }
  }

  private enqueueSpeech(text: string, lang: 'en-IN' | 'hi-IN') {
    this.speechQueue.push({ text, lang });
    this.processSpeechQueue();
  }

  private processSpeechQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0 || this.isMuted) return;

    const item = this.speechQueue.shift();
    if (!item) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    utterance.lang = item.lang;

    // Chromium Garbage Collection Bug Guard:
    this.activeUtterances.add(utterance);

    const cleanup = () => {
      this.activeUtterances.delete(utterance);
      this.isSpeaking = false;
      setTimeout(() => {
        this.processSpeechQueue();
      }, 350);
    };

    utterance.onend = cleanup;
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      cleanup();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      cleanup();
    }
  }

  /**
   * Preview chime and sample voice announcement for quick testing
   */
  public async testPreviewAnnouncement() {
    await this.announceToken({
      tokenNumber: 'T-05',
      patientName: 'Mr. Rajesh Sharma',
      counterName: 'Phlebotomy Booth 1',
    });
  }
}

export const queueAudio = new EliteQueueAudioEngine();
