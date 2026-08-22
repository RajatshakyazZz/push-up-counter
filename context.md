# PushLock AI — Project Context & Documentation

## Overview
**PushLock AI** is an Android-first digital wellbeing and habit-building application that locks addictive or distracting applications (such as Instagram, YouTube, Snapchat, TikTok, Reddit, and mobile games) until the user earns screen time by completing verified push-ups tracked in real-time by AI computer vision.

- **Motto**: *"Train → Earn → Unlock → Focus."*
- **Platform Architecture**: Android Native (Capacitor / Kotlin Bridge with `PACKAGE_USAGE_STATS` and `SYSTEM_ALERT_WINDOW`) + Next.js App Router Web PWA.
- **Vision Engine**: MediaPipe Pose estimation running 100% locally on-device at 60 FPS (zero server dependencies, zero recurring cloud costs, 100% privacy-safe).

---

## Key Features & Architecture

### 1. AI Push-Up Vision Counter & Biomechanics Analysis
- **Pose Detection**: Uses MediaPipe Pose landmark detection (`@mediapipe/pose` + `@mediapipe/camera_utils`) running directly in browser WebGL / Android WebView.
- **Finite State Machine**:
  - `IDLE` → `READY` → `DESCENDING` → `BOTTOM` → `ASCENDING` → `COMPLETED`
  - **Horizontal Plank Verification**: Validates body slope and hip-to-shoulder alignment (`isPlankOrientation`) so vertical movements, bowing, or head bobs are not counted.
  - **Range of Motion (ROM)**: Requires ≥ 35° elbow angle deflection and minimum bottom depth before a rep counts.
  - **Anti-Bounce Filter**: Minimal repetition duration check (≥ 350ms) to filter out jitter and noisy video artifacts.
- **Visual Skeleton & HUD Overlays**:
  - High-visibility top-corner rep counter and phase indicators.
  - Angle arcs at elbows, shoulders, and hips.
  - Color-coded posture lines (Emerald Green for proper form, Amber/Red for hip sag or incomplete depth).
- **Audio & Haptic Feedback**: Web Audio synthesized sound cues, browser speech synthesis voice announcements, and device vibration haptics.
- **Pre-Workout Countdown**: Configurable 5-second buffer timer allowing users to set their phone down and get into the starting plank position before tracking begins.

### 2. Android App Locker (`lib/native-bridge/androidAppLocker.ts`)
- **App Protection Management**:
  - Toggle protection on/off per app.
  - Configurable required push-ups (5 to 60 reps).
  - Configurable unlock access durations (5 to 60 minutes).
- **Unlock Session Timer**:
  - Live countdown timers showing remaining unlocked time.
  - Progress bar of time remaining.
  - Quick actions to extend unlock time with more push-ups or lock immediately.
- **Zero-Storage Dummy Data**: Starts with clean zero metrics and stores only authentic user-completed workouts in local storage / Android SharedPreferences.

### 3. Android Material 3 Design System
- **Theme**: Crisp, high-contrast light mode UI optimized for outdoor workouts and high-glare environments.
- **Palette**:
  - Background: `#F7F8FA`
  - Card Surfaces: `#FFFFFF` with `#E5E7EB` borders
  - Primary Accent: `#16A34A` (Android Emerald Green)
  - Secondary Accent: `#2563EB` (Cobalt Blue)
- **Navigation**:
  - **Home**: Daily summary, quick unlock card, active unlock timers, and recent activity.
  - **Apps**: Locker management, app search, category filters, and app unlock requirements editor.
  - **Workout**: Live AI push-up counter with MediaPipe vision feed, form score, and workout controls.
  - **History**: Historical logs of verified workouts, calories burned, and unlocked apps.
  - **Settings**: Angle calibration thresholds, voice/sound toggles, Android permissions guide, and data reset.

---

## Tech Stack
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide React Icons + Canvas 2D Skeleton Rendering
- **AI / Computer Vision**: Google MediaPipe Pose (`@mediapipe/pose`)
- **Native Android Layer**: Capacitor / Kotlin Bridge with UsageStatsManager and Overlay Permissions

---

## Project Structure
```
├── app/
│   ├── globals.css           # Tailwind v4 theme and global styles
│   ├── layout.tsx            # Root HTML layout with viewport settings
│   └── page.tsx              # Main controller & navigation tab manager
├── components/
│   ├── ActiveTimersCard.tsx   # Active unlocked app session countdowns
│   ├── AndroidBottomNav.tsx   # Android-style bottom tab bar
│   ├── AndroidTopBar.tsx     # Android top app bar with camera & audio switches
│   ├── AppConfigModal.tsx     # Modal to add/edit push-up requirements per app
│   ├── AppIcon.tsx            # Dynamic icon renderer for apps
│   ├── AppLockerView.tsx      # App locker list & configuration view
│   ├── CameraFeed.tsx         # Video stream & skeleton canvas renderer
│   ├── ExerciseGuideModal.tsx # Biomechanics push-up form instruction guide
│   ├── FormFeedbackCard.tsx   # Real-time posture & form feedback
│   ├── HistoryView.tsx        # Workout history & unlock records
│   ├── HomeDashboard.tsx      # Primary overview dashboard
│   ├── LockScreenModal.tsx    # Android overlay lock screen simulation
│   ├── PreWorkoutCountdown.tsx# Pre-workout ready timer buffer
│   ├── RepStatsCard.tsx       # Live rep count, pace, and calorie metrics
│   ├── SettingsModal.tsx      # Quick settings modal
│   ├── SettingsView.tsx       # Calibration & native Android permissions
│   ├── WorkoutControls.tsx    # Start, pause, resume, reset controls
│   └── WorkoutSummaryModal.tsx# Post-workout celebration & stats breakdown
├── hooks/
│   ├── usePoseDetector.ts     # MediaPipe Pose loader & video frame loop
│   └── usePushUpTracker.ts    # Biomechanics math & push-up state machine
├── lib/
│   ├── audio.ts               # Web Audio synth sound effects & TTS voice
│   ├── haptics.ts             # Device vibration feedback bridge
│   ├── pose-math.ts           # 3D vector angle & posture alignment math
│   ├── skeleton-renderer.ts   # 60 FPS HTML5 canvas skeleton drawer
│   └── native-bridge/
│       └── androidAppLocker.ts# Android native interface & local storage
├── types/
│   └── fitness.ts             # TypeScript definitions for apps, reps, and logs
├── context.md                 # Complete project context and documentation
└── package.json               # Dependencies and scripts
```

---

## Getting Started

### 1. Installation
```bash
bun install # or npm install
```

### 2. Running Locally
```bash
bun dev # or npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Grant camera access when prompted to start AI push-up counting.

### 3. Production Build
```bash
bun run build # or npm run build
```
