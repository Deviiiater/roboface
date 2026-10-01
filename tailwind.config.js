/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#0f172a',
        },
        robot: {
          cyan: '#06b6d4',
          glow: '#38bdf8',
          dark: '#0f172a',
          surface: '#1e293b',
          accent: '#8b5cf6',
        }
      },
      animation: {
        'bounce-subtle': 'bounceSubtle 2s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float': 'float 3s infinite ease-in-out',
        'eye-blink': 'eyeBlink 4s infinite',
        'mouth-speak': 'mouthSpeak 0.3s infinite alternate',
        'radar': 'radar 2s linear infinite',
      },
      keyframes: {
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', filter: 'drop-shadow(0 0 15px rgba(56, 189, 248, 0.6))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 25px rgba(99, 102, 241, 0.9))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
        },
        eyeBlink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
        mouthSpeak: {
          '0%': { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1.2)' },
        }
      }
    },
  },
  plugins: [],
}
