import React, { useEffect, useState } from 'react';

export type EyeMood = 'idle' | 'happy' | 'speaking' | 'curious' | 'thinking' | 'blink' | 'wink' | 'sad' | 'not_found';

interface RobotFaceProps {
  isSpeaking?: boolean;
  mood?: EyeMood;
  subtitle?: string;
  onClick?: () => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const RobotFace: React.FC<RobotFaceProps> = ({
  isSpeaking = false,
  mood = 'idle',
  subtitle = '',
  onClick,
  interactive = true,
  size = 'hero',
  className = '',
}) => {
  const [blink, setBlink] = useState(false);
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });
  const [thinkingStep, setThinkingStep] = useState(0);

  // Natural spontaneous blinking (disabled during thinking)
  useEffect(() => {
    if (mood === 'thinking') return;
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3500 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [mood]);

  // Wandering gaze / scanning
  useEffect(() => {
    if (mood === 'thinking') {
      const thinkInterval = setInterval(() => {
        setThinkingStep(s => (s + 1) % 4);
      }, 350);
      return () => clearInterval(thinkInterval);
    } else {
      const lookInterval = setInterval(() => {
        const x = (Math.random() - 0.5) * 14;
        const y = (Math.random() - 0.5) * 10;
        setLookOffset({ x, y });
      }, 2600);
      return () => clearInterval(lookInterval);
    }
  }, [mood]);

  const isBlinkingNow = (blink || mood === 'blink') && mood !== 'thinking';
  const isHappy = mood === 'happy';
  const isThinking = mood === 'thinking';
  const isSad = mood === 'sad' || mood === 'not_found';

  // Thinking gaze offsets
  const thinkingOffsets = [
    { x: -12, y: -14 },
    { x: 12, y: -14 },
    { x: 0, y: -16 },
    { x: -8, y: -12 },
  ];
  const activeOffset = isThinking ? thinkingOffsets[thinkingStep] : lookOffset;

  // SMALL SIZE
  if (size === 'sm') {
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center justify-center p-2 rounded-2xl bg-black border border-white/30 ${
          interactive ? 'cursor-pointer active:scale-95' : ''
        } ${className}`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            {isThinking ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-ping" />
              </>
            ) : isBlinkingNow ? (
              <>
                <div className="w-3.5 h-0.5 bg-white rounded-full shadow-[0_0_6px_#fff]" />
                <div className="w-3.5 h-0.5 bg-white rounded-full shadow-[0_0_6px_#fff]" />
              </>
            ) : isHappy ? (
              <>
                <span className="text-[10px] text-white font-bold">^</span>
                <span className="text-[10px] text-white font-bold">^</span>
              </>
            ) : (
              <>
                <div className="w-3.5 h-4 rounded-md bg-white shadow-[0_0_8px_#ffffff]" />
                <div className="w-3.5 h-4 rounded-md bg-white shadow-[0_0_8px_#ffffff]" />
              </>
            )}
          </div>
          {isSpeaking ? (
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
              <div className="w-1 h-3 bg-white rounded-full animate-pulse" />
              <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
            </div>
          ) : isThinking ? (
            <div className="w-4 h-1 bg-white rounded-full animate-pulse" />
          ) : (
            <div className="w-5 h-0.5 bg-white rounded-full shadow-[0_0_5px_#fff]" />
          )}
        </div>
      </div>
    );
  }

  // MEDIUM SIZE
  if (size === 'md') {
    return (
      <div
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center p-4 rounded-3xl bg-black border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)] ${
          interactive ? 'cursor-pointer active:scale-95' : ''
        } ${className}`}
      >
        {/* Eyes */}
        <div className="flex items-center gap-6 sm:gap-8 my-1">
          {isThinking ? (
            <>
              <div className="w-8 sm:w-10 h-10 sm:h-12 rounded-2xl bg-black border border-white p-0.5 shadow-[0_0_15px_#fff] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white animate-spin" />
              </div>
              <div className="w-8 sm:w-10 h-10 sm:h-12 rounded-2xl bg-black border border-white p-0.5 shadow-[0_0_15px_#fff] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white animate-spin" />
              </div>
            </>
          ) : isBlinkingNow ? (
            <>
              <div className="w-8 sm:w-10 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]" />
              <div className="w-8 sm:w-10 h-1 bg-white rounded-full shadow-[0_0_10px_#fff]" />
            </>
          ) : isHappy ? (
            <>
              <span className="text-2xl text-white font-bold leading-none">^</span>
              <span className="text-2xl text-white font-bold leading-none">^</span>
            </>
          ) : (
            <>
              <div className="w-8 sm:w-10 h-10 sm:h-12 rounded-2xl bg-white shadow-[0_0_15px_#fff] relative overflow-hidden flex items-start justify-end p-1">
                <div className="w-3 h-3 rounded-full bg-black/80" />
              </div>
              <div className="w-8 sm:w-10 h-10 sm:h-12 rounded-2xl bg-white shadow-[0_0_15px_#fff] relative overflow-hidden flex items-start justify-end p-1">
                <div className="w-3 h-3 rounded-full bg-black/80" />
              </div>
            </>
          )}
        </div>

        {/* Mouth */}
        <div className="mt-3 h-5 flex items-center justify-center">
          {isSpeaking ? (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" />
              <div className="w-1.5 h-5 bg-white rounded-full animate-pulse" />
              <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" />
              <div className="w-1.5 h-3 bg-white rounded-full animate-pulse" />
            </div>
          ) : isThinking ? (
            <div className="w-10 h-1 bg-white rounded-full animate-pulse" />
          ) : isHappy ? (
            <div className="w-10 h-2 border-b-2 border-white rounded-b-full shadow-[0_0_8px_#fff]" />
          ) : (
            <div className="w-8 h-1 bg-white rounded-full shadow-[0_0_8px_#fff]" />
          )}
        </div>
      </div>
    );
  }

  // HERO / FULLSCREEN: PURE BLACK BACKGROUND WITH MASSIVE GLOWING WHITE EYES & MOUTH
  return (
    <div
      onClick={onClick}
      className={`w-full h-full flex flex-col items-center justify-between select-none bg-black overflow-hidden relative ${
        interactive ? 'cursor-pointer active:scale-98 transition-transform' : ''
      } ${className}`}
    >
      {/* Subtle white ambient glow */}
      <div className="absolute inset-0 rounded-full bg-white/[0.04] blur-3xl pointer-events-none -z-10" />

      {/* Robot Screen Container: Fills complete tablet viewport */}
      <div className="w-full h-full flex-1 flex flex-col items-center justify-between py-6 sm:py-10 px-4 sm:px-12">
        {/* EYES CONTAINER: Massive eyes covering upper 58-62% of tablet screen */}
        <div className="w-full flex-1 flex items-center justify-center gap-10 sm:gap-16 md:gap-24 lg:gap-32 my-auto pt-2 sm:pt-6">
          {/* LEFT EYE */}
          <div
            className="relative transition-all duration-200 ease-out"
            style={{
              transform: `translate(${activeOffset.x * 1.5}px, ${activeOffset.y * 1.5}px)`,
            }}
          >
            {isThinking ? (
              /* Thinking pure white reticle */
              <div className="relative w-[35vw] max-w-[440px] min-w-[150px] h-[45vh] max-h-[460px] min-h-[170px] rounded-[4.5rem] sm:rounded-[6rem] bg-black border-4 border-white p-3 shadow-[0_0_80px_rgba(255,255,255,0.95)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-[4rem] sm:rounded-[5.5rem] bg-black relative flex items-center justify-center">
                  <div className="absolute inset-4 sm:inset-6 border-4 border-dashed border-white rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-white shadow-[0_0_45px_#ffffff] animate-pulse" />
                </div>
              </div>
            ) : isSad ? (
              /* Sad / Not Found pure white drooping eye */
              <svg className="w-[35vw] max-w-[440px] min-w-[150px] h-[30vh] max-h-[320px]" viewBox="0 0 100 60" fill="none">
                <path
                  d="M15 15 Q 50 42 85 15"
                  stroke="#ffffff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_35px_#ffffff]"
                />
              </svg>
            ) : isBlinkingNow ? (
              <div className="w-[35vw] max-w-[440px] min-w-[150px] h-5 sm:h-7 bg-white rounded-full shadow-[0_0_40px_#ffffff]" />
            ) : isHappy ? (
              <svg className="w-[35vw] max-w-[440px] min-w-[150px] h-[30vh] max-h-[320px]" viewBox="0 0 100 60" fill="none">
                <path
                  d="M10 50 Q 50 5 90 50"
                  stroke="#ffffff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_35px_#ffffff]"
                />
              </svg>
            ) : (
              /* Pure luminous white eye with contrast pupil gaze */
              <div className="relative w-[35vw] max-w-[440px] min-w-[150px] h-[45vh] max-h-[460px] min-h-[170px] rounded-[4.5rem] sm:rounded-[6rem] bg-white p-3 sm:p-4 shadow-[0_0_90px_rgba(255,255,255,1)] flex items-center justify-center">
                <div className="w-full h-full rounded-[4rem] sm:rounded-[5.5rem] bg-white relative overflow-hidden flex items-start justify-end p-5 sm:p-8">
                  <div className="w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24 rounded-full bg-black shadow-xl" />
                  <div className="absolute bottom-8 left-8 w-7 sm:w-10 h-7 sm:h-10 rounded-full bg-black/40" />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT EYE */}
          <div
            className="relative transition-all duration-200 ease-out"
            style={{
              transform: `translate(${activeOffset.x * 1.5}px, ${activeOffset.y * 1.5}px)`,
            }}
          >
            {isThinking ? (
              /* Thinking pure white reticle */
              <div className="relative w-[35vw] max-w-[440px] min-w-[150px] h-[45vh] max-h-[460px] min-h-[170px] rounded-[4.5rem] sm:rounded-[6rem] bg-black border-4 border-white p-3 shadow-[0_0_80px_rgba(255,255,255,0.95)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-[4rem] sm:rounded-[5.5rem] bg-black relative flex items-center justify-center">
                  <div className="absolute inset-4 sm:inset-6 border-4 border-dashed border-white rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                  <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-white shadow-[0_0_45px_#ffffff] animate-pulse" />
                </div>
              </div>
            ) : isSad ? (
              /* Sad / Not Found pure white drooping eye */
              <svg className="w-[35vw] max-w-[440px] min-w-[150px] h-[30vh] max-h-[320px]" viewBox="0 0 100 60" fill="none">
                <path
                  d="M15 15 Q 50 42 85 15"
                  stroke="#ffffff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_35px_#ffffff]"
                />
              </svg>
            ) : isBlinkingNow ? (
              <div className="w-[35vw] max-w-[440px] min-w-[150px] h-5 sm:h-7 bg-white rounded-full shadow-[0_0_40px_#ffffff]" />
            ) : isHappy ? (
              <svg className="w-[35vw] max-w-[440px] min-w-[150px] h-[30vh] max-h-[320px]" viewBox="0 0 100 60" fill="none">
                <path
                  d="M10 50 Q 50 5 90 50"
                  stroke="#ffffff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_35px_#ffffff]"
                />
              </svg>
            ) : (
              /* Pure luminous white eye with contrast pupil gaze */
              <div className="relative w-[35vw] max-w-[440px] min-w-[150px] h-[45vh] max-h-[460px] min-h-[170px] rounded-[4.5rem] sm:rounded-[6rem] bg-white p-3 sm:p-4 shadow-[0_0_90px_rgba(255,255,255,1)] flex items-center justify-center">
                <div className="w-full h-full rounded-[4rem] sm:rounded-[5.5rem] bg-white relative overflow-hidden flex items-start justify-end p-5 sm:p-8">
                  <div className="w-14 sm:w-20 md:w-24 h-14 sm:h-20 md:h-24 rounded-full bg-black shadow-xl" />
                  <div className="absolute bottom-8 left-8 w-7 sm:w-10 h-7 sm:h-10 rounded-full bg-black/40" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MOUTH CONTAINER: Massive pure white animated mouth covering lower 30-35% of tablet screen */}
        <div className="w-full my-auto pb-6 sm:pb-12 h-[26vh] min-h-[110px] max-h-[220px] flex items-center justify-center">
          {isSpeaking ? (
            /* 7-bar dynamic glowing white equalizer voice waveform */
            <div className="flex items-center gap-3 sm:gap-5 md:gap-6 px-6 py-2">
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_30px_#ffffff] animate-bounce" style={{ height: '60px', animationDuration: '0.35s' }} />
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_30px_#ffffff] animate-pulse" style={{ height: '100px', animationDuration: '0.28s' }} />
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_40px_#ffffff] animate-bounce" style={{ height: '135px', animationDuration: '0.4s' }} />
              <div className="w-5 sm:w-8 md:w-10 bg-white rounded-full shadow-[0_0_50px_#ffffff] animate-pulse" style={{ height: '160px', animationDuration: '0.25s' }} />
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_40px_#ffffff] animate-bounce" style={{ height: '135px', animationDuration: '0.38s' }} />
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_30px_#ffffff] animate-pulse" style={{ height: '100px', animationDuration: '0.32s' }} />
              <div className="w-4 sm:w-7 md:w-9 bg-white rounded-full shadow-[0_0_30px_#ffffff] animate-bounce" style={{ height: '60px', animationDuration: '0.42s' }} />
            </div>
          ) : isThinking ? (
            /* Thinking digital line */
            <div className="flex items-center gap-4 px-10 py-4 rounded-full bg-black border-2 border-white shadow-[0_0_40px_rgba(255,255,255,0.7)]">
              <span className="w-5 h-5 rounded-full bg-white animate-ping" />
              <span className="text-base sm:text-xl font-mono text-white font-black tracking-widest uppercase">
                PROCESSING...
              </span>
            </div>
          ) : isSad ? (
            /* Downturned sad mouth in pure white */
            <svg className="w-[62vw] max-w-[650px] min-w-[220px] h-20 sm:h-28" viewBox="0 0 140 40" fill="none">
              <path
                d="M15 32 Q 70 8 125 32"
                stroke="#ffffff"
                strokeWidth="13"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_35px_#ffffff]"
              />
            </svg>
          ) : isHappy ? (
            /* Wide beaming white smile */
            <svg className="w-[62vw] max-w-[650px] min-w-[220px] h-20 sm:h-28" viewBox="0 0 160 40" fill="none">
              <path
                d="M10 5 Q 80 45 150 5"
                stroke="#ffffff"
                strokeWidth="14"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_35px_#ffffff]"
              />
            </svg>
          ) : (
            /* Gentle relaxed white smile */
            <svg className="w-[55vw] max-w-[580px] min-w-[220px] h-16 sm:h-22" viewBox="0 0 140 30" fill="none">
              <path
                d="M15 10 Q 70 30 125 10"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_35px_#ffffff]"
              />
            </svg>
          )}
        </div>

        {/* Floating Subtitle if present */}
        {subtitle && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-black/90 border border-white/40 text-white text-xs sm:text-sm font-semibold shadow-[0_0_30px_rgba(255,255,255,0.25)] text-center max-w-lg pointer-events-none z-20 backdrop-blur-sm">
            💬 {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
