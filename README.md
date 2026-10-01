# 🤖 AI Result Robot • School PTM Tablet Kiosk

A tablet-first, interactive kiosk web application built for school **Parent-Teacher Meetings (PTM)**. Featuring a friendly animated robot assistant, touch & voice search, verified subject-wise marks evaluation, deterministic improvement advice, natural Indian voice narration (Hindi, English, Hinglish), and automatic privacy reset.

---

## 🌟 Key Features

1. **Friendly Animated Robot Avatar (`RobotAvatar.tsx`)**
   - High-fidelity SVG/CSS robot with emotional states (`idle`, `speaking`, `thinking`, `celebration`, `encouraging`).
   - Blinking digital eyes, morphing audio vocalizer mouth, glowing antenna with status LED, and friendly sound effects.
   - Interactive touch interactions: tap the robot for soft chirps and winks.

2. **Touch & Voice Student Search (`SearchScreen.tsx`)**
   - Search across **520+ preloaded verified student records** or your school's imported Excel sheet.
   - Fast filter chips by **Class (6 to 12)** and **Section (A, B, C)**.
   - **Voice Search (Speech-to-Text)**: Parents can tap the microphone and say e.g., *"Rahul Sharma Class 9"*.
   - Disambiguation cards displaying Student ID, Roll Number, and Class to avoid name collision.

3. **Accurate Result & Performance Engine (`analysisEngine.ts`)**
   - The application—not the AI—calculates total marks, maximum marks, percentage, and grade.
   - **Configurable Performance Tiers**:
     - **90–100% (Excellent)**: Gold/Emerald badges + celebratory confetti fanfare.
     - **75–89% (Very Good)**: Cyan/Blue consistency badges.
     - **60–74% (Good)**: Practice and revision guidance.
     - **40–59% (Needs Improvement)**: Faculty intervention recommendations.
     - **Below 40% (Requires Attention)**: Remedial support guidance.
   - Identifies comparative strengths and low-scoring subjects against student & class averages.

4. **Deterministic Actionable Improvement Tips**
   - Provides concrete, school-approved tips without hallucinating marks or facts.
   - *Example (Social Science = 54)*:
     > *"Your Social Science score is 54. Give this subject some extra attention: Create timeline flashcards for History, practice map pointing for Geography, and make point-wise Civics notes."*

5. **Natural Indian Voice Engine (`voiceService.ts`)**
   - Supports **Hindi**, **Indian English**, and authentic **Hinglish** PTM narration.
   - Auto-detects Indian TTS voices (`en-IN`, `hi-IN`, Google Hindi, Rishi, Lekha, Veena) with graceful fallbacks.
   - Interactive player with Play, Pause, Replay, and 0.85x / 0.95x / 1.1x speed controls.

6. **Kiosk Inactivity Auto-Reset**
   - Configurable auto-countdown timer (default **60 seconds**).
   - Automatically resets back to the Home screen and clears sensitive student marks between parents.
   - Immediate **"Finish & Next"** button for quick turnaround.

7. **Teacher Admin & Excel Importer (`AdminModal.tsx`)**
   - Drag-and-drop parser for school Excel (`.xlsx`, `.xls`) and `.csv` files.
   - **Data Validation**:
     - Flags duplicate Student IDs.
     - Validates numeric marks and flags marks > 100.
     - Detects duplicate Name + Class + Section combinations.
     - Displays comprehensive import summary before applying.
   - Download pre-formatted Excel template (`School_PTM_Sample_Template.xlsx`).
   - Configure grade thresholds and kiosk timer in real-time.
   - Ready-to-use Supabase PostgreSQL schema for production multi-tablet sync.

8. **Printable / PDF PTM Report Card (`PrintCard.tsx`)**
   - Official CBSE-styled printable student evaluation report card with teacher/parent signature blocks.

---

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) on your tablet or browser.

### 2. Build for Production / Tablet Kiosk
```bash
npm run build
npm run preview
```

### 3. Deploy to Vercel or Netlify
```bash
# Deploy with Vercel CLI
npx vercel
```
Or connect your GitHub repository directly to Vercel/Netlify. The production build creates an optimized static bundle ready for immediate kiosk deployment.

---

## 📋 Sample Test Students

- **Rahul Sharma** • Class `9-B` • Roll `#14` (Overall: 77.2% | Mathematics: 71, Science: 82, English: 86, Hindi: 79, Social Science: 54, Computer: 91)
- **Ananya Verma** • Class `10-A` • Roll `#3` (Overall: 94.3% | Confetti Celebration)
- **Vihaan Gupta** • Class `8-A` • Roll `#19` (Overall: 56.0% | Needs Improvement guidance)
