import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { StudentAnalysis, Language, PerformanceThresholds } from '../types';
import { HINDI_SUBJECT_NAMES, HINDI_SUBJECT_IMPROVEMENT_TIPS } from '../services/analysisEngine';
import { RobotFace } from './RobotFace';
import { voiceService } from '../services/voiceService';
import { sounds } from '../services/soundEffects';
import { PrintCard } from './PrintCard';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronLeft,
  Clock,
  TrendingUp,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ResultScreenProps {
  analysis: StudentAnalysis;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onReset: () => void;
  onBackToSearch: () => void;
  inactivityTimeoutSeconds?: number;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  analysis,
  language,
  onLanguageChange,
  onReset,
  onBackToSearch,
  inactivityTimeoutSeconds = 60,
}) => {
  const { student, percentage, grade, tier, tierGuidance, strengths, weakSubjects, subjectAnalyses, spokenText } = analysis;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [speechSpeed, setSpeechSpeed] = useState(0.95);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(inactivityTimeoutSeconds);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inactivity auto-reset timer logic
  const resetInactivityTimer = () => {
    setTimeLeft(inactivityTimeoutSeconds);
  };

  useEffect(() => {
    // Listen for any tap or interaction to reset inactivity countdown
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer expired: stop voice and reset cleanly to Home
          voiceService.stop();
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [inactivityTimeoutSeconds, onReset]);

  // Voice subscription
  useEffect(() => {
    const unsubscribe = voiceService.subscribe(state => {
      setIsSpeaking(state.isSpeaking);
      setIsPaused(state.isPaused);
      if (state.currentWord) {
        setCurrentWord(state.currentWord);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Play result speech on load + launch celebration confetti if excellent
  useEffect(() => {
    // If student scored >= 90%, fire colorful confetti!
    if (percentage >= 90) {
      sounds.playCelebration();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti fallback
      }
    } else {
      sounds.playRobotGreet();
    }

    // Auto-speak result summary in active language with fallback
    const script = spokenText[language];
    voiceService.speak(script, language, undefined, spokenText.hinglish);

    return () => {
      voiceService.stop();
    };
  }, [analysis, language]);

  // Handle Voice Language Switch
  const handleLangSwitch = (newLang: Language) => {
    sounds.playClick();
    onLanguageChange(newLang);
    const script = spokenText[newLang];
    voiceService.speak(script, newLang, undefined, spokenText.hinglish);
  };

  // Voice controls
  const handleToggleVoice = () => {
    sounds.playClick();
    if (isSpeaking) {
      if (isPaused) {
        voiceService.resume();
      } else {
        voiceService.pause();
      }
    } else {
      const script = spokenText[language];
      voiceService.speak(script, language);
    }
  };

  const handleReplayVoice = () => {
    sounds.playClick();
    const script = spokenText[language];
    voiceService.speak(script, language);
  };

  const handleSpeedToggle = () => {
    sounds.playClick();
    const nextSpeed = speechSpeed === 0.95 ? 1.1 : speechSpeed === 1.1 ? 0.85 : 0.95;
    setSpeechSpeed(nextSpeed);
    voiceService.setRate(nextSpeed);
    if (isSpeaking) {
      handleReplayVoice();
    }
  };

  const handleSpeakTipsOnly = () => {
    sounds.playClick();
    if (weakSubjects.length === 0) {
      const allGood = language === 'hi'
        ? 'आपके सभी विषयों में बहुत अच्छे अंक हैं! इसी तरह मेहनत जारी रखें।'
        : language === 'hinglish'
        ? 'Aapke saare subjects mein marks bohot acche hain! Keep it up.'
        : 'All your subject marks are very good! Keep up the brilliant consistency.';
      voiceService.speak(allGood, language);
      return;
    }

    const ws = weakSubjects[0];
    let tipScript = '';
    if (language === 'hi') {
      const subjName = HINDI_SUBJECT_NAMES[ws.subject] || ws.subject;
      const tipText = HINDI_SUBJECT_IMPROVEMENT_TIPS[ws.subject] || ws.tip;
      tipScript = `${subjName} में आपके अंक अच्छे नहीं हैं, आपका स्कोर ${ws.marks} है। आपके लिए सुधार का सुझाव: ${tipText} नियमित अभ्यास से आपके अंक अवश्य बढ़ेंगे!`;
    } else if (language === 'hinglish') {
      tipScript = `${ws.subject} mein marks acche nahi hain, score sirf ${ws.marks} hai. Iske liye improvement tip hai: ${ws.tip} Regular practice se aap bohot jaldi improve kar lenge!`;
    } else {
      tipScript = `Your marks in ${ws.subject} are not good, with a score of ${ws.marks}. Here is your improvement tip: ${ws.tip} Regular practice will help you improve!`;
    }

    voiceService.speak(tipScript, language, undefined, `${ws.subject} mein score ${ws.marks} hai. Tip: ${ws.tip}`);
  };

  // Tier color mapping
  const tierColorMap = {
    'Excellent': {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      badge: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
      border: 'border-emerald-500/40',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    },
    'Very Good': {
      bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      badge: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
      border: 'border-cyan-500/40',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    },
    'Good': {
      bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      badge: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
      border: 'border-indigo-500/40',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.25)]',
    },
    'Needs Improvement': {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      border: 'border-amber-500/40',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    },
    'Requires Attention': {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      badge: 'bg-gradient-to-r from-rose-500 to-red-600 text-white',
      border: 'border-rose-500/40',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    },
  }[tier];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {/* Top Floating Kiosk Status Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              voiceService.stop();
              onBackToSearch();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Search</span>
          </button>

          {/* Inactivity Auto-Reset Indicator */}
          <div
            onClick={resetInactivityTimer}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 cursor-pointer hover:bg-slate-800"
            title="Tap to stay on screen"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Auto Reset in {timeLeft}s</span>
          </div>
        </div>

        {/* Action Buttons: Print Card & Finish Session */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              setShowPrintModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-cyan-300 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Print Result Card</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              voiceService.stop();
              onReset();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-cyan-600/20 active:scale-95"
          >
            <span>Finish & Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Result Content */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col pt-4 gap-5">
        {/* Robot Spoken Narration Banner & Indian Voice Player */}
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <RobotFace
              mood={percentage >= 90 ? 'happy' : isSpeaking ? 'speaking' : 'idle'}
              isSpeaking={isSpeaking}
              size="md"
              className="shrink-0"
              onClick={handleToggleVoice}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Voice Assistant ({language === 'hinglish' ? 'Hinglish' : language === 'hi' ? 'Hindi' : 'Indian English'})
                </span>
                {isSpeaking && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Speaking
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 italic">
                "{spokenText[language]}"
              </p>
            </div>
          </div>

          {/* Language Switcher & Audio Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => handleLangSwitch('hinglish')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'hinglish' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hinglish
              </button>
              <button
                onClick={() => handleLangSwitch('en')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'en' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLangSwitch('hi')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  language === 'hi' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleVoice}
                className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all"
                title={isSpeaking && !isPaused ? 'Pause Voice' : 'Play Voice'}
              >
                {isSpeaking && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleReplayVoice}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all"
                title="Replay Voice Summary"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleSpeedToggle}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold font-mono transition-all"
                title="Voice Speed"
              >
                {speechSpeed}x
              </button>
            </div>
          </div>
        </div>

        {/* Student Profile & Overall Result Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Student Details & Overall Score (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Student Info Card */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800 flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Verified Student Record
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {student.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold">
                    Class {student.class} - {student.section}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">
                    Roll #{student.roll_code || student.roll_no}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono">
                    {student.student_id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {student.exam_name} • Session {student.session} • Attendance: {student.attendance_percentage}%
                </p>
              </div>
            </div>

            {/* Scorecard Hero Tile */}
            <div className={`glass-card ${tierColorMap.glow} p-6 rounded-3xl border ${tierColorMap.border} flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Overall Aggregate
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${tierColorMap.badge}`}>
                  {tier}
                </span>
              </div>

              <div className="my-4 flex items-baseline justify-between">
                <div>
                  <div className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                    {percentage}<span className="text-3xl font-semibold text-cyan-400">%</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Total: {analysis.totalMarks} / {analysis.totalMaxMarks} Marks
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase">Grade</div>
                  <div className="text-3xl font-black text-white">{grade}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-white block mb-0.5">Faculty Assessment:</span>
                {tierGuidance}
              </div>
            </div>

            {/* Strengths & Focus Summary Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Strengths</span>
                </div>
                <div className="space-y-1">
                  {strengths.map(s => (
                    <div key={s.subject} className="text-xs text-slate-200 font-semibold flex justify-between">
                      <span>{s.subject}</span>
                      <span className="text-emerald-400">{s.marks}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Needs Attention</span>
                </div>
                <div className="space-y-1">
                  {weakSubjects.length > 0 ? (
                    weakSubjects.map(w => (
                      <div key={w.subject} className="text-xs text-slate-200 font-semibold flex justify-between">
                        <span>{w.subject}</span>
                        <span className="text-amber-400">{w.marks}%</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No low subjects</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Subject-Wise Marks & Improvement Tips (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Subject Marks Table / Cards */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  Subject-Wise Performance
                </h4>
                <span className="text-xs text-slate-400">Class Average Baseline: 70%</span>
              </div>

              <div className="space-y-3">
                {subjectAnalyses.map(subj => {
                  const isLow = subj.needsAttention;
                  const isTop = subj.isStrength;

                  return (
                    <div
                      key={subj.subject}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                        isLow
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : isTop
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
                        <span className="text-white flex items-center gap-2">
                          {subj.subject}
                          {isTop && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Top Score
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Attention
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-xs font-normal">
                            Dev: {subj.deviationFromAverage >= 0 ? `+${subj.deviationFromAverage}%` : `${subj.deviationFromAverage}%`}
                          </span>
                          <span className="text-white font-extrabold text-sm sm:text-base">
                            {subj.marks} <span className="text-xs font-normal text-slate-400">/ {subj.maxMarks}</span>
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLow
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                              : isTop
                              ? 'bg-gradient-to-r from-emerald-400 to-cyan-500'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, subj.percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actionable Improvement Tips Box */}
            <div className="glass-card p-5 rounded-3xl border border-indigo-500/20 bg-indigo-950/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Improvement Tips for Subjects with Not Good Marks</span>
                </h4>
                <button
                  onClick={handleSpeakTipsOnly}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  title="Have robot speak the improvement tips"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak Tips</span>
                </button>
              </div>

              {weakSubjects.length > 0 ? (
                <div className="space-y-3">
                  {weakSubjects.map(ws => (
                    <div
                      key={ws.subject}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {ws.marks}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                          {ws.subject} Focus Area
                        </h5>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                          "Your {ws.subject} score is {ws.marks}. Give this subject some extra attention: {ws.tip}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Outstanding performance across all subjects! Continue current revision schedule and solve challenging olympiad or exemplar questions.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Card Modal */}
      {showPrintModal && (
        <PrintCard analysis={analysis} onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
};
