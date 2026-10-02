import React, { useState, useEffect } from 'react';
import { RobotFace, EyeMood } from './RobotFace';
import type { Language } from '../types';
import { sounds } from '../services/soundEffects';
import { voiceService } from '../services/voiceService';
import { Volume2, VolumeX, Settings, Sparkles, ArrowRight, RotateCcw, RotateCw, Maximize2, Minimize2, Download } from 'lucide-react';

interface HomeScreenProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onStart: () => void;
  onOpenAdmin: () => void;
  onQuickSelectStudent?: (studentName: string, studentClass: string) => void;
  onRotate?: () => void;
  rotation?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onSelectLanguage,
  onStart,
  onOpenAdmin,
  onQuickSelectStudent,
  onRotate,
  rotation = 0,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpokenOnce, setHasSpokenOnce] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);
  const [mood, setMood] = useState<EyeMood>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Listen for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    sounds.playClick();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    sounds.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Exact speech scripts requested by user
  const getGreetingText = (lang: Language) => {
    switch (lang) {
      case 'hi':
        return 'सुप्रभात! सिटी सेंट्रल स्कूल में आपका स्वागत है। क्या आप अपना परिणाम जानना चाहते हैं?';
      case 'hinglish':
        return 'Good morning! Welcome to City Central School. Result jaanna chahte hain?';
      case 'en':
      default:
        return 'Good morning! Welcome to City Central School. Want to know the result?';
    }
  };

  const getFallbackGreeting = () => {
    return 'Good morning! Welcome to City Central School. Result jaanna chahte hain?';
  };

  const handleFaceTap = () => {
    sounds.playClick();
    const text = getGreetingText(language);
    setSubtitle(text);
    setIsSpeaking(true);
    setMood('happy');
    setHasSpokenOnce(true);

    voiceService.speak(
      text,
      language,
      () => {
        setIsSpeaking(false);
        setMood('idle');
      },
      getFallbackGreeting()
    );
  };

  const handleLanguageChange = (newLang: Language) => {
    sounds.playClick();
    onSelectLanguage(newLang);
    const text = getGreetingText(newLang);
    setSubtitle(text);
    setIsSpeaking(true);
    setMood('happy');
    setHasSpokenOnce(true);

    voiceService.speak(
      text,
      newLang,
      () => {
        setIsSpeaking(false);
        setMood('idle');
      },
      getFallbackGreeting()
    );
  };

  const toggleSound = () => {
    const newState = !soundMuted;
    setSoundMuted(newState);
    sounds.setSoundEnabled(!newState);
    if (newState) {
      voiceService.stop();
      setIsSpeaking(false);
      setMood('idle');
    }
  };

  return (
    <div className={`relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-3 sm:p-6 overflow-hidden select-none ${
      isFullscreen ? 'h-screen overflow-hidden' : ''
    }`}>
      {/* Top Bar with Prominent Fullscreen Robo Face Option */}
      <header className="w-full max-w-4xl flex items-center justify-between z-20 gap-2">
        <div className="flex items-center gap-2">
          {/* Prominent Fullscreen Option Button */}
          <button
            onClick={toggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all border ${
              isFullscreen
                ? 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse'
            }`}
            title="Use screen as physical Robo Face"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden xs:inline sm:inline">
              {isFullscreen ? 'Exit Full Screen' : 'Full Screen (Robo Face Mode)'}
            </span>
          </button>

          {/* Screen Rotate Button for Tablet Robot Mount */}
          {onRotate && (
            <button
              onClick={() => {
                sounds.playClick();
                onRotate();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-95"
              title="Rotate screen orientation (0°, 90°, 180°, 270°) for physical robot mounting"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Rotate ({rotation}°)</span>
            </button>
          )}

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse"
              title="Install App as PWA on Home Screen"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Install App</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector chips */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'hi'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => handleLanguageChange('hinglish')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'hinglish'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hinglish
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                language === 'en'
                  ? 'bg-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title={soundMuted ? 'Unmute' : 'Mute'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdmin();
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400"
            title="Teacher Admin Panel"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CENTER: JUST EYES AND MOUTH (ROBO FACE) */}
      <main className="w-full flex-1 flex flex-col items-center justify-center z-10 my-auto">
        <RobotFace
          isSpeaking={isSpeaking}
          mood={mood}
          subtitle={subtitle}
          onClick={handleFaceTap}
          interactive={true}
          size={isFullscreen ? 'hero' : 'hero'}
        />

        {/* TAP PROMPT / ACTION BUTTONS */}
        <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-sm">
          {!hasSpokenOnce ? (
            <button
              onClick={handleFaceTap}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-lg tracking-wide shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:shadow-[0_0_50px_rgba(6,182,212,0.65)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 border border-cyan-300/40"
            >
              <Sparkles className="w-5 h-5 text-cyan-200 animate-spin" style={{ animationDuration: '4s' }} />
              <span>{language === 'hi' ? 'रोबोट से बात करने के लिए टैप करें' : 'TAP TO HEAR ROBOT'}</span>
            </button>
          ) : (
            <div className="w-full flex flex-col gap-2.5 animate-fade-in">
              <button
                onClick={() => {
                  sounds.playRobotGreet();
                  voiceService.stop();
                  onStart();
                }}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-lg tracking-wide shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] transition-all transform active:scale-95 flex items-center justify-center gap-3 border border-cyan-300/40"
              >
                <span>{language === 'hi' ? 'हाँ! परिणाम देखें' : 'YES! CHECK RESULT'}</span>
                <ArrowRight className="w-5 h-5 text-cyan-200" />
              </button>

              <button
                onClick={handleFaceTap}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language === 'hi' ? 'दोबारा सुनें' : 'Hear greeting again'}</span>
              </button>
            </div>
          )}

          {/* Quick test student links */}
          {onQuickSelectStudent && (
            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Quick Test:</span>
              <button
                onClick={() => onQuickSelectStudent('Naman Sharma', '2')}
                className="text-cyan-400 hover:underline"
              >
                Naman Sharma (2-A)
              </button>
              <span>•</span>
              <button
                onClick={() => onQuickSelectStudent('Utkarsh Singh Bhadouriya', '4')}
                className="text-amber-400 hover:underline"
              >
                Utkarsh (4-B)
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Subtle footer */}
      <footer className="w-full text-center text-[11px] text-slate-600 z-10 pb-2">
        {language === 'hi'
          ? 'बोलने के लिए आंखों या मुंह पर टैप करें • फुल स्क्रीन पर रोबो फेस की तरह इस्तेमाल करें'
          : 'Tap eyes & mouth to speak • Use Full Screen for physical Robo Face mounting'}
      </footer>
    </div>
  );
};
