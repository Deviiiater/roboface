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

  private isUnlocked = false;
  private pendingUtterance: { text: string; lang: Language; onComplete?: () => void; fallbackText?: string } | null = null;

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
      [50, 150, 400, 1000, 2500, 5000].forEach(delay => {
        setTimeout(() => this.loadVoices(), delay);
      });

      // Unlock speech synthesis on any user interaction across the tablet
      const unlock = () => this.unlock();
      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public unlock() {
    if (!this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      if (!this.isUnlocked) {
        // Prime audio on tablet/mobile with an instantaneous silent utterance
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0.01;
        dummy.rate = 10;
        this.synth.speak(dummy);
        this.isUnlocked = true;
      }
    } catch {
      // ignore
    }

    // If an utterance was pending user touch gesture on tablet, trigger it now!
    if (this.pendingUtterance) {
      const { text, lang, onComplete, fallbackText } = this.pendingUtterance;
      this.pendingUtterance = null;
      this.speak(text, lang, onComplete, fallbackText);
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

  public hasHindiVoice(): boolean {
    this.loadVoices();
    return this.availableVoices.some(v => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const vName = v.name.toLowerCase();
      return (
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

  // Automatic phonetic Romanized Hindi fallback for tablets lacking a Devanagari Hindi voice pack
  public hindiToPhonetic(hindiText: string): string {
    let out = hindiText
      .replace(/सुप्रभात/g, 'Suprabhat')
      .replace(/सिटी सेंट्रल स्कूल में आपका स्वागत है/g, 'City Central School mein aapka swagat hai')
      .replace(/क्या आप अपना परिणाम जानना चाहते हैं\?/g, 'Kya aap apna result jaanna chahte hain?')
      .replace(/कृपया छात्र का नाम, कक्षा और सेक्शन बोलें/g, 'Kripya student ka naam, class aur section bolein')
      .replace(/जैसे राहुल शर्मा कक्षा १० बी/g, 'Jaise Rahul Sharma class dasvi B')
      .replace(/में आपके अंक अच्छे नहीं हैं/g, 'mein aapke marks acche nahi hain')
      .replace(/आपका स्कोर/g, 'aapka score')
      .replace(/है। आपके लिए सुधार का सुझाव:/g, 'hai. Aapke liye sudhar ka sujhav:')
      .replace(/नियमित अभ्यास से आपके अंक अवश्य बढ़ेंगे!/g, 'Niyamit abhyas se aapke marks zaroor badhenge!')
      .replace(/आपके सभी विषयों में बहुत अच्छे अंक हैं! इसी तरह मेहनत जारी रखें।/g, 'Aapke sabhi subjects mein bohot acche marks hain! Isi tarah mehnat jaari rakhein.')
      .replace(/परिणाम नहीं मिला/g, 'Record nahi mila')
      .replace(/विद्यार्थी/g, 'student')
      .replace(/छात्र/g, 'student')
      .replace(/प्रतिशत/g, 'percent')
      .replace(/अंक/g, 'marks')
      .replace(/दशमलव/g, 'point')
      .replace(/कक्षा/g, 'Class')
      .replace(/सेक्शन/g, 'Section')
      .replace(/गणित/g, 'Maths')
      .replace(/विज्ञान/g, 'Science')
      .replace(/अंग्रेजी/g, 'English')
      .replace(/हिंदी/g, 'Hindi')
      .replace(/सामाजिक विज्ञान/g, 'Social Science')
      .replace(/कंप्यूटर/g, 'Computer');

    const devanagariMap: [RegExp, string][] = [
      [/का/g, 'ka'], [/के/g, 'ke'], [/की/g, 'ki'], [/को/g, 'ko'], [/में/g, 'mein'],
      [/से/g, 'se'], [/पर/g, 'par'], [/है/g, 'hai'], [/हैं/g, 'hain'], [/था/g, 'tha'],
      [/थी/g, 'thi'], [/थे/g, 'the'], [/और/g, 'aur'], [/या/g, 'ya'], [/नहीं/g, 'nahi'],
      [/हाँ/g, 'haan'], [/बहुत/g, 'bohot'], [/अच्छा/g, 'accha'], [/अच्छे/g, 'acche'],
      [/अच्छी/g, 'acchi'], [/नाम/g, 'naam'], [/रोल/g, 'roll'], [/नंबर/g, 'number'],
      [/सुधार/g, 'sudhar'], [/सुझाव/g, 'sujhav'], [/कृपया/g, 'kripya'], [/बोलें/g, 'bolein']
    ];
    for (const [re, rep] of devanagariMap) {
      out = out.replace(re, rep);
    }
    return out.replace(/\s+/g, ' ').trim();
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
      
      // If language is Hindi but chosen voice is English (e.g. tablet has no native Hindi voice pack),
      // seamlessly speak phonetic Hinglish so the Indian English engine speaks it fluently without failing!
      let textToSpeak = text;
      let targetLang = lang;
      if (lang === 'hi') {
        const isTrueHindiVoice = chosenVoice && (
          chosenVoice.lang.toLowerCase().startsWith('hi') ||
          chosenVoice.name.toLowerCase().includes('lekha') ||
          chosenVoice.name.includes('हिन्दी') ||
          chosenVoice.name.toLowerCase().includes('hindi')
        );
        if (!isTrueHindiVoice) {
          textToSpeak = fallbackText || this.hindiToPhonetic(text);
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

      // Slightly lower rate for Indian English / tablet playback so every syllable is crisp
      utterance.rate = targetLang === 'hi' ? 0.92 : this.speechRate;
      utterance.pitch = this.speechPitch;
      utterance.volume = 1.0;

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
