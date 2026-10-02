import React, { useState, useEffect, useRef } from 'react';
import type { StudentRecord, Language } from '../types';
import { RobotFace } from './RobotFace';
import { sounds } from '../services/soundEffects';
import { voiceService } from '../services/voiceService';
import { speechRecognitionService } from '../services/speechRecognitionService';
import { mergeSpokenText, parseVoiceInput, findStudentByVoice } from '../services/voiceParser';
import {
  Mic,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Search,
  Keyboard,
  AlertCircle,
  Maximize2,
  Minimize2,
  Download,
  X
} from 'lucide-react';

interface VoiceAssistantScreenProps {
  students: StudentRecord[];
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onSelectStudent: (student: StudentRecord) => void;
  onBack: () => void;
  initialQuery?: string;
  onRotate?: () => void;
  rotation?: number;
}

export const SearchScreen: React.FC<VoiceAssistantScreenProps> = ({
  students,
  language,
  onSelectLanguage,
  onSelectStudent,
  onBack,
  initialQuery = '',
  onRotate,
  rotation = 0,
}) => {
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState(initialQuery);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingName, setThinkingName] = useState('');
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);

  // Data Not Present states
  const [dataNotFound, setDataNotFound] = useState(false);
  const [failedQuery, setFailedQuery] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
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

  // Voice stream refs
  const debounceSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guidanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const latestTranscriptRef = useRef<string>('');
  const hasProcessedQueryRef = useRef<boolean>(false);

  const [guidanceTip, setGuidanceTip] = useState<string | null>(null);
  const [detectedCriteria, setDetectedCriteria] = useState<{
    name?: string;
    studentClass?: string;
    section?: string;
    rollNo?: number;
  }>({});

  // Fullscreen state listener for tablet
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

  // Spoken prompt scripts
  const getPromptText = (lang: Language = language) => {
    switch (lang) {
      case 'hi':
        return 'अपना नाम, कक्षा, और सेक्शन बताएं।';
      case 'hinglish':
        return 'Apna name, class, aur section bataiye.';
      case 'en':
      default:
        return 'Tell me your name, class, and section.';
    }
  };

  const getFallbackPrompt = (lang: Language = language) => {
    return lang === 'hi' ? 'अपना नाम, कक्षा, और सेक्शन बताएं।' : 'Tell me your name, class, and section.';
  };

  // Switch language anytime (English <-> Hindi)
  const handleLanguageSwitch = (newLang: Language) => {
    if (newLang === language) return;
    sounds.playClick();
    onSelectLanguage(newLang);
    voiceService.stop();
    speechRecognitionService.stopListening();
    setIsListening(false);
    isListeningRef.current = false;
    hasProcessedQueryRef.current = false;
    accumulatedTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    setSpokenTranscript('');
    setDetectedCriteria({});
    setDataNotFound(false);
    setNotFoundMsg(null);
    setGuidanceTip(null);

    const prompt = getPromptText(newLang);
    setIsSpeakingPrompt(true);
    voiceService.speak(
      prompt,
      newLang,
      () => {
        setIsSpeakingPrompt(false);
        setTimeout(() => {
          startListeningVoice(newLang);
        }, 300);
      },
      getFallbackPrompt(newLang)
    );
  };

  // Start listening to mic: waits until Name, Class, and Section (or Roll No) are present
  const startListeningVoice = (langOverride?: Language) => {
    const activeLang = langOverride || language;
    voiceService.stop();
    setIsSpeakingPrompt(false);
    sounds.playSearchChirp();
    setDataNotFound(false);
    setNotFoundMsg(null);
    setGuidanceTip(null);
    setSpokenTranscript('');
    accumulatedTranscriptRef.current = '';
    latestTranscriptRef.current = '';
    hasProcessedQueryRef.current = false;
    isListeningRef.current = true;
    setDetectedCriteria({});

    if (debounceSearchTimerRef.current) {
      clearTimeout(debounceSearchTimerRef.current);
      debounceSearchTimerRef.current = null;
    }
    if (guidanceTimerRef.current) {
      clearTimeout(guidanceTimerRef.current);
      guidanceTimerRef.current = null;
    }

    if (!speechRecognitionService.isSupported()) {
      setNotFoundMsg(
        activeLang === 'hi'
          ? 'इस ब्राउज़र में माइक्रोफ़ोन समर्थित नहीं है। कीबोर्ड का उपयोग करें।'
          : 'Microphone not supported on this browser. Use manual input.'
      );
      return;
    }

    setIsListening(true);
    listenStream(activeLang);
  };

  const listenStream = (activeLang: Language = language) => {
    speechRecognitionService.startListening(
      (fullTranscript, _isFinal) => {
        const cleanChunk = fullTranscript.trim();
        if (!cleanChunk) return;

        // Intelligent merge with accumulated transcript across pauses on tablet
        const combined = mergeSpokenText(accumulatedTranscriptRef.current, cleanChunk);
        latestTranscriptRef.current = combined;
        setSpokenTranscript(combined);

        // Parse criteria
        const parsed = parseVoiceInput(combined);
        const hasName = Boolean(parsed.name && parsed.name.trim().length >= 2);
        const hasClass = Boolean(parsed.studentClass);
        const hasSection = Boolean(parsed.section);
        const hasRoll = Boolean(parsed.rollNo);

        setDetectedCriteria({
          name: parsed.name,
          studentClass: parsed.studentClass,
          section: parsed.section,
          rollNo: parsed.rollNo,
        });

        const isComplete = (hasName && hasClass && hasSection) || hasRoll;

        if (isComplete) {
          // ALL CRITERIA PRESENT!
          setGuidanceTip(null);
          if (guidanceTimerRef.current) {
            clearTimeout(guidanceTimerRef.current);
            guidanceTimerRef.current = null;
          }

          // Debounce 650ms to allow user to finish the word, then automatically search!
          if (debounceSearchTimerRef.current) {
            clearTimeout(debounceSearchTimerRef.current);
          }
          debounceSearchTimerRef.current = setTimeout(() => {
            if (!hasProcessedQueryRef.current) {
              hasProcessedQueryRef.current = true;
              isListeningRef.current = false;
              speechRecognitionService.stopListening();
              setIsListening(false);
              handleVoiceQueryProcessed(combined);
            }
          }, 650);
        } else {
          // STILL WAITING for Name, Class, or Section: DO NOT TRIGGER SEARCH!
          if (debounceSearchTimerRef.current) {
            clearTimeout(debounceSearchTimerRef.current);
            debounceSearchTimerRef.current = null;
          }

          // Helpful guidance if paused
          if (guidanceTimerRef.current) {
            clearTimeout(guidanceTimerRef.current);
          }
          guidanceTimerRef.current = setTimeout(() => {
            if (isListeningRef.current && !hasProcessedQueryRef.current) {
              if (hasName && !hasClass && !hasSection) {
                setGuidanceTip(
                  activeLang === 'hi'
                    ? `नाम: "${parsed.name}"। कृपया कक्षा और सेक्शन भी बताएं...`
                    : `Name: "${parsed.name}". Please also say Class and Section...`
                );
              } else if (hasName && hasClass && !hasSection) {
                setGuidanceTip(
                  activeLang === 'hi'
                    ? `कक्षा ${parsed.studentClass} मिल गई। कृपया सेक्शन बोलें (A, B या C)...`
                    : `Class ${parsed.studentClass} received. Please also say Section (A, B or C)...`
                );
              } else if (!hasName && (hasClass || hasSection)) {
                setGuidanceTip(
                  activeLang === 'hi'
                    ? 'कृपया छात्र का नाम भी बताएं...'
                    : 'Please also say the student name...'
                );
              }
            }
          }, 2200);
        }
      },
      (error) => {
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          setIsListening(false);
          isListeningRef.current = false;
          setNotFoundMsg(
            activeLang === 'hi'
              ? 'माइक्रोफ़ोन की अनुमति चाहिए। स्क्रीन पर टैप करके अनुमति दें।'
              : 'Microphone permission required. Tap the screen to allow microphone.'
          );
          return;
        }

        // If criteria incomplete, continue listening seamlessly without dropping accumulated transcript
        if (isListeningRef.current && !hasProcessedQueryRef.current) {
          setTimeout(() => {
            if (isListeningRef.current && !hasProcessedQueryRef.current) {
              listenStream(activeLang);
            }
          }, 250);
          return;
        }
        setIsListening(false);
        isListeningRef.current = false;
      },
      activeLang === 'hi' ? 'hi-IN' : 'en-IN',
      (finalText) => {
        // If mic stream ended on tablet pause, save words into accumulated buffer and keep listening!
        if (isListeningRef.current && !hasProcessedQueryRef.current) {
          const currentText = mergeSpokenText(accumulatedTranscriptRef.current, finalText || latestTranscriptRef.current);
          accumulatedTranscriptRef.current = currentText;
          latestTranscriptRef.current = currentText;

          const parsed = parseVoiceInput(currentText);
          const isComplete = (parsed.name && parsed.studentClass && parsed.section) || parsed.rollNo;

          if (isComplete) {
            hasProcessedQueryRef.current = true;
            isListeningRef.current = false;
            setIsListening(false);
            handleVoiceQueryProcessed(currentText);
          } else {
            setTimeout(() => {
              if (isListeningRef.current && !hasProcessedQueryRef.current) {
                listenStream(activeLang);
              }
            }, 100);
          }
        }
      }
    );
  };

  // Cleanup on screen unmount
  useEffect(() => {
    return () => {
      if (debounceSearchTimerRef.current) clearTimeout(debounceSearchTimerRef.current);
      if (guidanceTimerRef.current) clearTimeout(guidanceTimerRef.current);
      isListeningRef.current = false;
      voiceService.stop();
      speechRecognitionService.stopListening();
    };
  }, []);

  // When screen loads, robot speaks prompt then opens mic
  useEffect(() => {
    const prompt = getPromptText();
    setIsSpeakingPrompt(true);

    let hasStarted = false;
    const safeStart = () => {
      if (!hasStarted && !hasProcessedQueryRef.current) {
        hasStarted = true;
        setIsSpeakingPrompt(false);
        startListeningVoice();
      }
    };

    voiceService.speak(
      prompt,
      language,
      () => {
        setTimeout(safeStart, 200);
      },
      getFallbackPrompt()
    );

    const safetyTimer = setTimeout(safeStart, 3200);

    return () => clearTimeout(safetyTimer);
  }, []);

  // Process the spoken text -> Thinking animation -> Results
  const handleVoiceQueryProcessed = (text: string) => {
    if (!text.trim()) return;

    sounds.playSearchChirp();
    const query = parseVoiceInput(text);
    const { student } = findStudentByVoice(query, students);

    const displayName = query.name
      ? `${query.name}${query.studentClass ? ' (Class ' + query.studentClass + (query.section ? '-' + query.section : '') + ')' : ''}`
      : text;
    setThinkingName(displayName);
    setIsThinking(true);
    setDataNotFound(false);
    setNotFoundMsg(null);
    setGuidanceTip(null);

    // Run thinking animation for 1.3 seconds
    setTimeout(() => {
      setIsThinking(false);

      if (student) {
        // MATCH FOUND: Show result!
        onSelectStudent(student);
      } else {
        // MATCH NOT FOUND: Said result not found!
        sounds.playClick();
        setDataNotFound(true);
        setFailedQuery(displayName);

        const isMissingClassOrSec = !query.rollNo && (!query.studentClass || !query.section);
        let notFoundSpoken = '';
        if (isMissingClassOrSec) {
          notFoundSpoken = language === 'hi'
            ? 'रिजल्ट नहीं मिला। कृपया छात्र का नाम, कक्षा और सेक्शन तीनों बताएं।'
            : 'Result not found. Please provide student Name, Class, and Section.';
        } else {
          notFoundSpoken = language === 'hi'
            ? 'रिजल्ट नहीं मिला। इस कक्षा और सेक्शन में यह रिकॉर्ड मौजूद नहीं है।'
            : 'Result not found. No matching record found for this student in the specified class and section.';
        }

        voiceService.speak(notFoundSpoken, language, undefined, 'Result not found. Record nahi mila.');
      }
    }, 1300);
  };

  // Manual typing search handler
  const handleManualSearch = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;
    setDataNotFound(false);
    setNotFoundMsg(null);
    setSpokenTranscript(text);
    setShowManualInput(false);
    handleVoiceQueryProcessed(text);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black text-white flex flex-col justify-between items-center select-none overflow-hidden relative">
      {/* TOP FLOATING OVERLAY: Back, Language, Fullscreen & Controls */}
      <header className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
        {/* Back Button */}
        <button
          onClick={() => {
            sounds.playClick();
            voiceService.stop();
            speechRecognitionService.stopListening();
            onBack();
          }}
          className="pointer-events-auto flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-black/80 hover:bg-neutral-900 border border-white/30 text-white backdrop-blur-md transition-all text-xs sm:text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span>{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
        </button>

        {/* Right Floating Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Parent Language Switcher: English Primary & Hindi */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/80 border border-white/30 backdrop-blur-md shadow-[0_0_25px_rgba(255,255,255,0.1)]">
            <button
              onClick={() => handleLanguageSwitch('en')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                language === 'en'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.9)] scale-105'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
            <button
              onClick={() => handleLanguageSwitch('hi')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                language === 'hi'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.9)] scale-105'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <span>🇮🇳</span>
              <span>हिंदी</span>
            </button>
          </div>

          {/* Screen Rotate Button for Tablet Robot Mount */}
          {onRotate && (
            <button
              onClick={() => {
                sounds.playClick();
                onRotate();
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 backdrop-blur-md transition-all text-xs font-bold active:scale-95 shadow-md flex items-center gap-1.5"
              title="Rotate screen orientation (0°, 90°, 180°, 270°) for physical robot mounting"
            >
              <RotateCw className="w-4 h-4 text-indigo-400" />
              <span>{rotation}°</span>
            </button>
          )}

          {/* Fullscreen Button for Tablet */}
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-black/80 hover:bg-neutral-900 border border-white/30 text-white backdrop-blur-md transition-all text-xs font-bold active:scale-95 shadow-md flex items-center gap-1"
            title="Toggle Tablet Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Keyboard input button */}
          <button
            onClick={() => setShowManualInput(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-black/80 hover:bg-neutral-900 border border-white/30 text-white backdrop-blur-md transition-all text-xs font-bold active:scale-95 shadow-md flex items-center gap-1"
            title="Type Student Details"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse text-xs font-bold active:scale-95"
              title="Install App as PWA on Home Screen"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Install</span>
            </button>
          )}
        </div>
      </header>

      {/* FULLSCREEN ROBOT FACE: COVERS THE COMPLETE TABLET SCREEN */}
      <main
        onClick={() => {
          if (!isThinking) {
            sounds.playClick();
            voiceService.stop();
            setIsSpeakingPrompt(false);
            startListeningVoice();
          }
        }}
        className="w-full h-full flex-1 flex flex-col items-center justify-center bg-black cursor-pointer"
      >
        <RobotFace
          mood={
            isThinking
              ? 'thinking'
              : isSpeakingPrompt
              ? 'speaking'
              : isListening
              ? 'curious'
              : dataNotFound
              ? 'not_found'
              : 'idle'
          }
          isSpeaking={isSpeakingPrompt}
          size="hero"
          subtitle={
            isThinking
              ? language === 'hi'
                ? `खोज जारी है... "${thinkingName}" का परिणाम देखा जा रहा है...`
                : `Searching records for "${thinkingName}"...`
              : isSpeakingPrompt
              ? getPromptText()
              : undefined
          }
          className="w-full h-full"
        />
      </main>

      {/* BOTTOM FLOATING OVERLAY: Sleek Live Voice Indicator & Non-Intrusive Guidance */}
      <footer className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-none flex flex-col items-center gap-2 z-30">
        {dataNotFound ? (
          /* Result Not Found Floating Card (Does NOT squish the face!) */
          <div className="pointer-events-auto p-4 sm:p-5 rounded-3xl bg-black/95 border-2 border-white shadow-[0_0_50px_rgba(255,255,255,0.4)] backdrop-blur-lg flex flex-col items-center text-center gap-2 animate-bounce-short max-w-md w-full">
            <div className="flex items-center gap-2 text-white">
              <AlertCircle className="w-5 h-5 text-white animate-pulse" />
              <span className="text-sm sm:text-base font-black uppercase tracking-wider">
                {language === 'hi' ? 'रिजल्ट नहीं मिला' : 'RESULT NOT FOUND'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-medium">
              {language === 'hi'
                ? `"${failedQuery}" का कोई रिकॉर्ड नहीं मिला।`
                : `No record found for "${failedQuery}".`}
            </p>
            <div className="flex items-center gap-2 mt-1 w-full">
              <button
                onClick={() => {
                  sounds.playClick();
                  setDataNotFound(false);
                  startListeningVoice();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_0_20px_#fff] active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-black" />
                <span>{language === 'hi' ? 'दोबारा बोलें' : 'TAP TO TRY AGAIN'}</span>
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="py-2.5 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Keyboard className="w-4 h-4 text-white" />
                <span>{language === 'hi' ? 'टाइप' : 'Type'}</span>
              </button>
            </div>
          </div>
        ) : isListening ? (
          /* Live Speech Recognition Pill */
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-black/85 border border-white/40 shadow-[0_0_35px_rgba(255,255,255,0.25)] backdrop-blur-md text-white text-xs sm:text-sm font-semibold max-w-lg text-center">
              <span className="w-3 h-3 rounded-full bg-white animate-ping shadow-[0_0_12px_#fff]" />
              <Mic className="w-4 h-4 text-white" />
              <span>
                {spokenTranscript
                  ? `"${spokenTranscript}"`
                  : language === 'hi'
                  ? 'सुन रहा हूँ: नाम, कक्षा और सेक्शन बोलें...'
                  : 'Listening: Say Name, Class & Section...'}
              </span>
            </div>

            {/* Criteria Badges */}
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span
                className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                  detectedCriteria.name ? 'bg-white text-black border-white' : 'bg-black/60 text-neutral-500 border-neutral-800'
                }`}
              >
                {detectedCriteria.name ? `✓ ${detectedCriteria.name}` : (language === 'hi' ? 'नाम ?' : 'Name ?')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                  detectedCriteria.studentClass ? 'bg-white text-black border-white' : 'bg-black/60 text-neutral-500 border-neutral-800'
                }`}
              >
                {detectedCriteria.studentClass ? `✓ Class ${detectedCriteria.studentClass}` : (language === 'hi' ? 'कक्षा ?' : 'Class ?')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-lg border transition-all ${
                  detectedCriteria.section ? 'bg-white text-black border-white' : 'bg-black/60 text-neutral-500 border-neutral-800'
                }`}
              >
                {detectedCriteria.section ? `✓ Sec ${detectedCriteria.section}` : (language === 'hi' ? 'सेक्शन ?' : 'Sec ?')}
              </span>
            </div>

            {/* Subtle Guidance Hint if paused */}
            {guidanceTip && (
              <div className="px-4 py-1 rounded-full bg-black/90 border border-white/50 text-white text-xs font-medium shadow-md animate-pulse">
                💬 {guidanceTip}
              </div>
            )}
          </div>
        ) : !isSpeakingPrompt && !isThinking ? (
          /* Mic Idle Tap to Speak Pill */
          <button
            onClick={() => startListeningVoice()}
            className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.7)] active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4 text-black animate-bounce" />
            <span>{language === 'hi' ? 'बोलने के लिए टैप करें' : 'TAP SCREEN TO SPEAK'}</span>
          </button>
        ) : null}

        {notFoundMsg && (
          <div className="pointer-events-auto px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold backdrop-blur-sm">
            {notFoundMsg}
          </div>
        )}
      </footer>

      {/* MANUAL SEARCH MODAL (If parent/teacher prefers to type) */}
      {showManualInput && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-neutral-950 border-2 border-white shadow-[0_0_50px_rgba(255,255,255,0.3)] flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                {language === 'hi' ? 'छात्र खोजें' : 'SEARCH STUDENT'}
              </h3>
              <button
                onClick={() => setShowManualInput(false)}
                className="p-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              {language === 'hi'
                ? 'छात्र का नाम, कक्षा और सेक्शन लिखें या 4-अंकों का रोल नंबर (उदा. "Naman 4 A" या "9960"):'
                : 'Enter student Name, Class, and Section, or 4-digit Roll Number (e.g. "Naman 4 A" or "9960"): '}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput.trim()) {
                    handleManualSearch(manualInput.trim());
                  }
                }}
                placeholder={language === 'hi' ? 'उदा. Naman 4 A, या 9960...' : 'e.g. Naman 4 A, or 9960...'}
                className="flex-1 px-4 py-3 rounded-2xl bg-black border border-neutral-700 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-white"
              />
              <button
                onClick={() => {
                  if (manualInput.trim()) handleManualSearch(manualInput.trim());
                }}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Search className="w-4 h-4 text-black" />
                <span>{language === 'hi' ? 'खोजें' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
