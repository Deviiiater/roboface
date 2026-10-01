import React, { useState } from 'react';
import { sounds } from '../services/soundEffects';

export type RobotMood = 'idle' | 'speaking' | 'thinking' | 'celebration' | 'encouraging';

interface RobotAvatarProps {
  mood?: RobotMood;
  isSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showSpeechBubble?: boolean;
  subtitleText?: string;
  onTap?: () => void;
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  mood = 'idle',
  isSpeaking = false,
  size = 'hero',
  className = '',
  showSpeechBubble = false,
  subtitleText = '',
  onTap,
}) => {
  const [isWinking, setIsWinking] = useState(false);

  const handleClick = () => {
    sounds.playClick();
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 900);
    onTap?.();
  };

  // Dimensions based on size
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    hero: 'w-56 h-56 sm:w-64 sm:h-64',
  };

  // Status LED color
  const ledGlowColor = {
    idle: 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]',
    speaking: 'bg-emerald-400 shadow-[0_0_16px_#34d399] animate-pulse',
    thinking: 'bg-purple-400 shadow-[0_0_14px_#c084fc] animate-ping',
    celebration: 'bg-amber-400 shadow-[0_0_20px_#fbbf24] animate-bounce',
    encouraging: 'bg-sky-400 shadow-[0_0_14px_#38bdf8]',
  }[isSpeaking ? 'speaking' : mood];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Speech Bubble / Subtitles when speaking */}
      {showSpeechBubble && subtitleText && (
        <div className="absolute -top-16 sm:-top-20 z-20 max-w-sm sm:max-w-md px-4 py-2 bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md rounded-2xl shadow-xl text-center">
          <p className="text-xs sm:text-sm font-medium text-cyan-200 line-clamp-2">
            💬 {subtitleText}
          </p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rotate-45 border-r border-b border-cyan-500/40"></div>
        </div>
      )}

      {/* Main Robot Avatar SVG */}
      <div
        onClick={handleClick}
        className={`${sizeMap[size]} relative cursor-pointer transition-transform duration-300 active:scale-95 animate-float group`}
        title="Tap robot for friendly chirp"
      >
        {/* Ambient Backlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 rounded-full blur-2xl -z-10 group-hover:from-cyan-400/30 group-hover:to-purple-500/30 transition-all duration-500"></div>

        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="robotBodyGrad" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e293b" />
              <stop offset="0.5" stopColor="#0f172a" />
              <stop offset="1" stopColor="#020617" />
            </linearGradient>

            <linearGradient id="robotScreenGrad" x1="40" y1="60" x2="160" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#030712" />
              <stop offset="1" stopColor="#0b1329" />
            </linearGradient>

            <linearGradient id="borderGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38bdf8" />
              <stop offset="0.5" stopColor="#818cf8" />
              <stop offset="1" stopColor="#c084fc" />
            </linearGradient>

            <linearGradient id="earGlow" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#38bdf8" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ears / Side Antennas */}
          <rect x="18" y="75" width="14" height="42" rx="7" fill="url(#earGlow)" className="group-hover:brightness-125 transition-all" />
          <rect x="168" y="75" width="14" height="42" rx="7" fill="url(#earGlow)" className="group-hover:brightness-125 transition-all" />

          {/* Top Antenna Pole */}
          <line x1="100" y1="38" x2="100" y2="15" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          {/* Top Antenna Bulb / LED */}
          <circle
            cx="100"
            cy="15"
            r="10"
            fill={mood === 'celebration' ? '#fbbf24' : isSpeaking ? '#34d399' : mood === 'thinking' ? '#c084fc' : '#38bdf8'}
            filter="url(#neonGlow)"
          />
          <circle cx="100" cy="15" r="4" fill="#ffffff" />

          {/* Robot Head Body */}
          <rect
            x="32"
            y="38"
            width="136"
            height="118"
            rx="32"
            fill="url(#robotBodyGrad)"
            stroke="url(#borderGrad)"
            strokeWidth="3.5"
          />

          {/* Digital Visor / Glass Screen */}
          <rect
            x="44"
            y="52"
            width="112"
            height="90"
            rx="20"
            fill="url(#robotScreenGrad)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Subtle screen scanlines */}
          <line x1="48" y1="68" x2="152" y2="68" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
          <line x1="48" y1="84" x2="152" y2="84" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
          <line x1="48" y1="100" x2="152" y2="100" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
          <line x1="48" y1="116" x2="152" y2="116" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
          <line x1="48" y1="132" x2="152" y2="132" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />

          {/* EYES */}
          {mood === 'celebration' || isWinking ? (
            /* Joyful celebration curved eyes ^ ^ */
            <g filter="url(#neonGlow)">
              <path d="M64 88 C68 76, 82 76, 86 88" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
              {isWinking ? (
                <circle cx="125" cy="85" r="10" fill="#38bdf8" />
              ) : (
                <path d="M114 88 C118 76, 132 76, 136 88" stroke="#38bdf8" strokeWidth="5.5" strokeLinecap="round" />
              )}
            </g>
          ) : mood === 'thinking' ? (
            /* Thinking / Scanning eyes */
            <g filter="url(#neonGlow)">
              <circle cx="75" cy="84" r="12" fill="#c084fc" />
              <circle cx="78" cy="81" r="4" fill="#ffffff" />
              <circle cx="125" cy="84" r="12" fill="#c084fc" />
              <circle cx="128" cy="81" r="4" fill="#ffffff" />
            </g>
          ) : (
            /* Normal animated blinking glowing cyan eyes */
            <g className="animate-eye-blink origin-center" filter="url(#neonGlow)">
              <circle cx="72" cy="84" r="11" fill="#38bdf8" />
              <circle cx="76" cy="80" r="4" fill="#ffffff" />
              <circle cx="128" cy="84" r="11" fill="#38bdf8" />
              <circle cx="132" cy="80" r="4" fill="#ffffff" />
            </g>
          )}

          {/* Cute Rosy Cheeks */}
          <circle cx="56" cy="100" r="6" fill="#f43f5e" opacity="0.3" filter="url(#neonGlow)" />
          <circle cx="144" cy="100" r="6" fill="#f43f5e" opacity="0.3" filter="url(#neonGlow)" />

          {/* MOUTH / EQUALIZER VOCALIZER */}
          {isSpeaking ? (
            /* Dynamic animated voice equalizer mouth bars */
            <g filter="url(#neonGlow)">
              <rect x="76" y="112" width="5" height="16" rx="2.5" fill="#34d399" className="animate-pulse" />
              <rect x="85" y="108" width="5" height="24" rx="2.5" fill="#38bdf8" className="animate-bounce" />
              <rect x="94" y="105" width="5" height="30" rx="2.5" fill="#a855f7" className="animate-pulse" />
              <rect x="103" y="108" width="5" height="24" rx="2.5" fill="#38bdf8" className="animate-bounce" />
              <rect x="112" y="112" width="5" height="16" rx="2.5" fill="#34d399" className="animate-pulse" />
            </g>
          ) : mood === 'celebration' ? (
            /* Big joyous open mouth */
            <path
              d="M80 114 Q100 134 120 114 Z"
              fill="#fbbf24"
              stroke="#f59e0b"
              strokeWidth="2"
              filter="url(#neonGlow)"
            />
          ) : (
            /* Friendly gentle digital smile */
            <path
              d="M80 116 Q100 128 120 116"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonGlow)"
            />
          )}

          {/* Collar / Chest Accent */}
          <path d="M80 160 L120 160 L110 178 L90 178 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        </svg>

        {/* Small Live Status Badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-[10px] font-semibold text-slate-300 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full ${ledGlowColor}`} />
          <span>{isSpeaking ? 'Speaking...' : mood === 'thinking' ? 'Searching...' : 'PTM Assistant'}</span>
        </div>
      </div>
    </div>
  );
};
