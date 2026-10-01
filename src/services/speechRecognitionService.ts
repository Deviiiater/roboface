// Speech Recognition Service for Touch/Voice Student Search
// Tablet-optimized: recreates a fresh recognition instance on every listen request
// to prevent mobile WebKit/Chromium audio pipeline lockups or deaf states.

type SpeechCallback = (transcript: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;
type EndCallback = (finalTranscript: string) => void;

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListeningState = false;
  private lastCapturedTranscript = '';

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public startListening(
    onResult: SpeechCallback,
    onError?: ErrorCallback,
    lang: string = 'en-IN',
    onEnd?: EndCallback
  ) {
    if (!this.isSupported()) {
      onError?.('Speech recognition is not supported in this browser. Please use manual input.');
      return;
    }

    // Always cleanly tear down any existing instance to ensure fresh audio pipeline on tablets
    this.stopListening();
    this.lastCapturedTranscript = '';

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      const rec = new SpeechRecognitionClass();
      this.recognition = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      rec.onstart = () => {
        this.isListeningState = true;
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        let hasFinalSegment = false;

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0] && res[0].transcript) {
            fullTranscript += res[0].transcript + ' ';
            if (res.isFinal) {
              hasFinalSegment = true;
            }
          }
        }

        const cleaned = fullTranscript.replace(/\s+/g, ' ').trim();
        if (cleaned) {
          this.lastCapturedTranscript = cleaned;
          onResult(cleaned, hasFinalSegment);
        }
      };

      rec.onerror = (event: any) => {
        const error = event.error || '';
        // Non-fatal normal events
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }
        this.isListeningState = false;
        onError?.(error || 'Microphone error');
      };

      rec.onend = () => {
        this.isListeningState = false;
        onEnd?.(this.lastCapturedTranscript);
      };

      try {
        rec.start();
      } catch (err: any) {
        // If audio device is busy finishing previous abort, retry after 100ms
        setTimeout(() => {
          try {
            rec.start();
          } catch (retryErr: any) {
            this.isListeningState = false;
            onError?.(retryErr?.message || 'Could not activate microphone.');
          }
        }, 100);
      }
    } catch (err: any) {
      this.isListeningState = false;
      onError?.(err?.message || 'Could not activate microphone.');
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        const r = this.recognition;
        this.recognition = null;
        r.onstart = null;
        r.onresult = null;
        r.onerror = null;
        r.onend = null;
        r.stop();
        r.abort();
      } catch {
        // ignore
      }
    }
    this.isListeningState = false;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();
