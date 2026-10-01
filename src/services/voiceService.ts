import type { Language } from '../types';

export interface TTSVoiceOption {
  id: string;
  name: string;
  lang: string;
  isIndian: boolean;
}

export type VoiceStateChangeCallback = (state: {
  isSpeaking: boolean;
  isPaused: boolean;
  currentWord?: string;
}) => void;

class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private listeners: Set<VoiceStateChangeCallback> = new Set();
  private isSpeakingState = false;
  private isPausedState = false;
  private speechRate = 0.95; // Slightly slower for clear kiosk comprehension
  private speechPitch = 1.05; // Friendly, warm robot tone
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private speakTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Use both addEventListener and property assignment for maximum browser compatibility
      if (this.synth.addEventListener) {
        this.synth.addEventListener('voiceschanged', () => this.loadVoices());
      }
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }

      // Proactively poll for voices during initial page startup (Chrome/Safari async voice loading)
      [100, 300, 800, 1500, 3000].forEach(delay => {
        setTimeout(() => this.loadVoices(), delay);
      });

      // Unlock speech synthesis on user interaction
      const unlock = () => this.unlock();
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public unlock() {
    if (!this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    try {
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        this.availableVoices = voices;
      }
    } catch {
      // ignore
    }
  }

  public subscribe(cb: VoiceStateChangeCallback): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(currentWord?: string) {
    this.listeners.forEach(cb =>
      cb({
        isSpeaking: this.isSpeakingState,
        isPaused: this.isPausedState,
        currentWord
      })
    );
  }

  public getVoices(): TTSVoiceOption[] {
    this.loadVoices();
    return this.availableVoices.map(v => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isIndian: this.isIndianVoice(v),
    }));
  }

  private isIndianVoice(voice: SpeechSynthesisVoice): boolean {
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();
    return (
      lang.includes('in') ||
      lang.startsWith('hi') ||
      name.includes('india') ||
      name.includes('hindi') ||
      name.includes('हिन्दी') ||
      name.includes('veena') ||
      name.includes('rishi') ||
      name.includes('lekha') ||
      name.includes('neerja') ||
      name.includes('prabhat') ||
      name.includes('ravi') ||
      name.includes('heera') ||
      name.includes('kiran') ||
      name.includes('swara') ||
      name.includes('kalpana') ||
      name.includes('hemant')
    );
  }

  // Find best matching voice for the target language
  public selectBestVoice(lang: Language): SpeechSynthesisVoice | null {
    this.loadVoices();
    if (this.availableVoices.length === 0) return null;

    if (lang === 'hi') {
      // 1. Pure Hindi voices (Lekha, Google हिन्दी, Swara, Neerja, hi-IN, hi_IN)
      const hiVoice = this.availableVoices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        const vName = v.name.toLowerCase();
        return (
          vLang === 'hi-in' ||
          vLang.startsWith('hi') ||
          vName.includes('lekha') ||
          vName.includes('hindi') ||
          v.name.includes('हिन्दी') ||
          vName.includes('swara') ||
          vName.includes('neerja') ||
          vName.includes('kalpana') ||
          vName.includes('hemant')
        );
      });
      if (hiVoice) return hiVoice;

      // 2. Indian English voice fallback (can pronounce Indian terms well)
      const indianVoice = this.availableVoices.find(v => this.isIndianVoice(v));
      if (indianVoice) return indianVoice;

      // 3. Any available voice
      return this.availableVoices[0] || null;
    }

    // For Hinglish or English: prioritize en-IN Indian accented English voices
    const indianEnVoice = this.availableVoices.find(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const vName = v.name.toLowerCase();
      return (
        vLang === 'en-in' ||
        vName.includes('rishi') ||
        vName.includes('veena') ||
        (vLang.startsWith('en') && (vName.includes('india') || vName.includes('ravi') || vName.includes('heera')))
      );
    });
    if (indianEnVoice) return indianEnVoice;

    // Secondary fallback: Any Indian voice
    const anyIndianVoice = this.availableVoices.find(v => this.isIndianVoice(v));
    if (anyIndianVoice) return anyIndianVoice;

    // Fallback: Natural English voice (Google, Samantha, Daniel, Karen)
    const naturalEn = this.availableVoices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );
    if (naturalEn) return naturalEn;

    return this.availableVoices[0] || null;
  }

  // Format numbers cleanly for Hindi speech synthesis so the engine doesn't stutter on decimals
  private prepareHindiText(text: string): string {
    return text
      .replace(/(\d+)\.(\d+)/g, '$1 दशमलव $2')
      .replace(/%/g, ' प्रतिशत ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  public speak(
    text: string,
    lang: Language = 'hinglish',
    onComplete?: () => void,
    fallbackText?: string
  ) {
    if (!this.synth) {
      console.warn('SpeechSynthesis not supported on this device.');
      onComplete?.();
      return;
    }

    this.unlock();

    // Clear any queued speak timer
    if (this.speakTimeout) {
      clearTimeout(this.speakTimeout);
      this.speakTimeout = null;
    }

    // Clear keep-alive timer
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    // If currently speaking, cancel cleanly
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }

    // Chromium fix: wait 50ms for speech synthesis audio thread to reset before speaking new utterance
    this.speakTimeout = setTimeout(() => {
      if (!this.synth) return;

      this.loadVoices();
      const chosenVoice = this.selectBestVoice(lang);
      
      // If language is Hindi but chosen voice is English (e.g. device has no Hindi voice installed),
      // speak the fallbackText (Hinglish/English) to avoid silent synthesis failures!
      let textToSpeak = text;
      let targetLang = lang;
      if (lang === 'hi') {
        const isTrueHindiVoice = chosenVoice && (
          chosenVoice.lang.toLowerCase().startsWith('hi') ||
          chosenVoice.name.toLowerCase().includes('lekha') ||
          chosenVoice.name.includes('हिन्दी') ||
          chosenVoice.name.toLowerCase().includes('hindi')
        );
        if (!isTrueHindiVoice && fallbackText) {
          textToSpeak = fallbackText;
          targetLang = 'hinglish';
        } else {
          textToSpeak = this.prepareHindiText(text);
        }
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      this.activeUtterance = utterance;
      (window as any).__activeSpeechUtterance = utterance; // GC protection for Chromium V8

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-IN';
      }

      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      let hasHandledCompletion = false;

      const cleanupUtterance = () => {
        if (this.keepAliveTimer) {
          clearInterval(this.keepAliveTimer);
          this.keepAliveTimer = null;
        }
        this.activeUtterance = null;
        delete (window as any).__activeSpeechUtterance;
      };

      utterance.onstart = () => {
        this.isSpeakingState = true;
        this.isPausedState = false;
        this.notify();

        // Chrome 14-second bug workaround: keep-alive heartbeat
        this.keepAliveTimer = setInterval(() => {
          if (!this.isSpeakingState || !this.synth) {
            if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
            return;
          }
          if (this.synth.paused) {
            this.synth.resume();
          }
        }, 3000);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const word = textToSpeak.substring(event.charIndex, event.charIndex + (event.charLength || 6));
          this.notify(word);
        }
      };

      utterance.onend = () => {
        if (hasHandledCompletion) return;
        hasHandledCompletion = true;
        cleanupUtterance();
        this.isSpeakingState = false;
        this.isPausedState = false;
        this.notify();
        onComplete?.();
      };

      utterance.onerror = (err) => {
        console.warn('SpeechSynthesis error:', err);
        cleanupUtterance();

        // If Hindi failed, try fallback Hinglish immediately
        if (lang === 'hi' && fallbackText && !hasHandledCompletion) {
          hasHandledCompletion = true;
          this.isSpeakingState = false;
          this.speak(fallbackText, 'hinglish', onComplete);
          return;
        }

        if (!hasHandledCompletion) {
          hasHandledCompletion = true;
          this.isSpeakingState = false;
          this.isPausedState = false;
          this.notify();
          onComplete?.();
        }
      };

      // Ensure synthesizer is not paused
      if (this.synth.paused) {
        this.synth.resume();
      }

      this.synth.speak(utterance);
    }, 50);
  }

  public pause() {
    if (this.synth && this.isSpeakingState && !this.isPausedState) {
      this.synth.pause();
      this.isPausedState = true;
      this.notify();
    }
  }

  public resume() {
    if (this.synth && this.isPausedState) {
      this.synth.resume();
      this.isPausedState = false;
      this.notify();
    }
  }

  public stop() {
    if (this.speakTimeout) {
      clearTimeout(this.speakTimeout);
      this.speakTimeout = null;
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
    this.activeUtterance = null;
    delete (window as any).__activeSpeechUtterance;
    this.isSpeakingState = false;
    this.isPausedState = false;
    this.notify();
  }

  public setRate(rate: number) {
    this.speechRate = Math.max(0.7, Math.min(1.4, rate));
  }

  public getRate(): number {
    return this.speechRate;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isPaused(): boolean {
    return this.isPausedState;
  }
}

export const voiceService = new VoiceService();
