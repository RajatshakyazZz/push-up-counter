# PushLock AI — Project Context & Documentation

## 1. Overview
**PushLock AI** is an Android-first digital wellbeing and habit-building application that locks addictive or distracting applications (such as Instagram, YouTube, Snapchat, TikTok, Reddit, and mobile games) until the user earns screen time by completing verified push-ups tracked in real-time by AI computer vision.

- **Motto**: *"Train → Earn → Unlock → Focus."*
- **Platform Architecture**: Android Native (Capacitor + Kotlin Foreground Service / Accessibility Bridge with `PACKAGE_USAGE_STATS` and `SYSTEM_ALERT_WINDOW`) + Next.js 15 App Router Web PWA.
- **Vision Engine**: `@mediapipe/tasks-vision` PoseLandmarker running 100% locally on-device via WebAssembly and WebGL/GPU acceleration at 30–60 FPS (zero server dependencies, zero recurring cloud costs, 100% privacy-safe).

---

## 2. Computer Vision & Push-Up Biomechanics Engine

### A. Real-Time Detection Pipeline (`hooks/usePoseDetector.ts`, `lib/pose-math.ts`)
- **Pose Estimation**: `@mediapipe/tasks-vision` loads `pose_landmarker_lite.task` model locally via GPU delegate in `VIDEO` mode.
- **One Euro Filter**: Uses `OneEuroFilter` (minCutoff = 1.0, beta = 0.03, dCutoff = 1.0) on all 33 3D landmarks ($x, y, z$) to achieve zero jitter/shake when holding steady while maintaining instant zero-latency tracking during rapid push-ups.
- **60 FPS Ref-Based Loop**: Video frame processing and canvas rendering draw straight from mutable refs (`landmarksRef`, `analysisRef`) on every `requestAnimationFrame` at 60 FPS. React state updates are throttled to 10 Hz, eliminating UI re-render bottlenecks and jumping performance from 2–4 FPS to 30–60 FPS.

### B. Strict Multi-Angle Spatial Posture Gate (`lib/pose-math.ts:validatePushUpPosture`)
Guarantees the skeleton turns GREEN only in genuine push-up positions and remains strictly RED for standing upright, sitting, or hand waving:
1. **Dual-Hand Floor Support Requirement**:
   - Both hands must be supporting on the floor below shoulders ($y_{\text{lWrist}} \ge y_{\text{lShoulder}} - 0.08$ and $y_{\text{rWrist}} \ge y_{\text{rShoulder}} - 0.08$).
   - Both wrists must be near the floor level ($y_{\text{wrist}} \ge 0.35$).
   - Hand Symmetry check ($|y_{\text{lWrist}} - y_{\text{rWrist}}| \le 0.25$) prevents one-arm standing waving or touching the face.
   - Hand Span check ($\text{wristSpan} \ge 0.20$ or $\ge 0.50 \times \text{shoulderSpan}$).
   - Hand raised near the face triggers **INSTANT RED REJECTION**.
2. **Front-Facing Floor View (Phone placed on floor in front of user)**:
   - Recognizes supporting hands planted wide on the ground with wide upper-body span in foreground ($\text{shoulderSpan} \ge 0.08$) and hips visible ($y_{\text{hip}} \ge y_{\text{shoulder}} - 0.05$).
   - Graceful fallback to knees/hips if ankles are obscured in floor shadows.
3. **Side Profile View**:
   - Validates horizontal torso angle ($\text{torsoAngleWithHorizontal} \le 60^\circ$, or $\le 68^\circ$ for incline).
4. **Strict False Movement Rejection (Standing Close-Up / Bicep Curls / Sitting)**:
   - Standing upright / sitting close to camera is instantly flagged as `'vertical'` and `isPositionValid = false` $\rightarrow$ **100% RED**.

### C. Color-Coded Interactive Skeleton Renderer (`lib/skeleton-renderer.ts`)
- **Vibrant Electric Green (`#22c55e` / `#a3e635`)**:
  - Rendered when user is in a valid push-up plank position.
  - **Stays 100% Green** throughout descent (down) and ascent (up) cycles.
- **Bright Warning Red (`#ef4444`)**:
  - Rendered when user is in an invalid pose (standing, sitting, waving hands, or wrong angle).
  - Rep counting is strictly blocked while in red state.
- **Smooth Color Transition**: Smooth RGB interpolation over ~150ms eliminates visual snapping or flicker.

### D. High-Speed Push-Up Repetition Tracker (`hooks/usePushUpTracker.ts`)
- **2-State Hysteresis Push-Up State Machine**:
  - `DOWN_ANGLE = 95°` (instant bottom depth registration).
  - `UP_ANGLE = 142°` (instant top lockout registration).
  - `minRepDurationMs = 280ms` (captures fast athletic reps without dropping).
  - `REP_COOLDOWN_MS = 120ms` (instant readiness for next repetition).
  - Range of motion $\text{ROM} \ge 26^\circ$.
  - Posture Invalid Freeze: Momentary 1-frame posture noise does not wipe in-flight reps.
- **Voice Coach Count-Only Mode**:
  - During workout push-ups, the voice assistant speaks **ONLY the rep numbers** ("1", "2", "3", ...).
  - Intermediate chatter is muted from audio so the coach never interrupts the flow.
  - Triggers `navigator.vibrate(50)` on each completed rep on supported devices.

### E. Hands-Free Auto-Start
- When the user steps into the camera view on the workout tab and assumes a valid push-up plank:
  1. Detects `isPositionValid === true`.
  2. Confirms stability for 3 consecutive frames (~100ms).
  3. Sets `stats.isActive = true` and `isPaused = false` automatically.
  4. Starts the elapsed workout timer.

---

## 3. App Locker & Native Android Bridge Architecture

### A. Web PWA Simulation Layer (`lib/native-bridge/androidAppLocker.ts`)
- Manages protected app configurations, rep goals, and unlock durations in browser `localStorage`.
- Storage Keys:
  - `pushlock_protected_apps`: List of configured apps and rep targets.
  - `pushlock_unlock_sessions`: Active temporary unlock sessions with expiration timestamps.
  - `pushlock_workout_history`: Completed workout logs.
  - `pushlock_protection_settings`: Global protection settings.
  - `pushlock_settings`: Pose detection thresholds and audio/voice toggles.

### B. Native Android Platform (Capacitor 8.5.0)
- **Framework**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` v8.5.0.
- **Config**: `capacitor.config.ts` (appId: `com.pushlock.ai`, appName: `PushLock AI`, webDir: `out`).
- **Static Export**: Next.js 15 configured with `output: 'export'` and `images.unoptimized: true` generating standalone assets into `out/` and synced to `android/app/src/main/assets/public`.
- **Native Android Structure**: Android Gradle project initialized in `/android` targeting Android SDK with full Capacitor webview bridge.

### C. Native Android Roadmap (Next Steps)
- **Plugin Bridge**: `@CapacitorPlugin(name = "PushLockAppLocker") class PushLockPlugin : Plugin()`.
- **Foreground App Monitoring**:
  - `AccessibilityService` (`AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED`) for 0ms latency app launch interception.
  - `UsageStatsManager` with a background `ForegroundService` as backup.
- **System Overlay**:
  - `WindowManager` with `TYPE_APPLICATION_OVERLAY` or high-priority fullscreen lock activity.
- **Permissions**:
  - `android.permission.CAMERA`
  - `android.permission.SYSTEM_ALERT_WINDOW`
  - `android.permission.PACKAGE_USAGE_STATS`
  - `android.permission.BIND_ACCESSIBILITY_SERVICE`
  - `android.permission.FOREGROUND_SERVICE`
  - `android.permission.RECEIVE_BOOT_COMPLETED`
  - `android.permission.QUERY_ALL_PACKAGES`

---

## 4. Design System & UI Components

- **Theme**: High-contrast Material 3 light mode optimized for outdoor workouts.
- **Color Palette**:
  - Background: `#F7F8FA`
  - Card Surfaces: `#FFFFFF` with `#E5E7EB` border
  - Neon Accent / Active HUD: `#22C55E` / `#A3E635` (Lime / Emerald)
  - Secondary Accent: `#2563EB` (Cobalt Blue)
  - Warning / Blocker: `#EF4444` (Coral Red)

### Navigation Tabs (`app/page.tsx`, `components/AndroidBottomNav.tsx`):
1. **Home (`components/HomeDashboard.tsx`)**: Daily rep summary, quick unlock card, active session countdowns, and recent activity.
2. **Apps (`components/AppLockerView.tsx`)**: App locker catalogue, protection toggles, rep target editor, and instant lock tests.
3. **Workout (`app/page.tsx:workout`)**: Live MediaPipe camera feed, in-camera HUD rep counter, depth gauge, form feedback, and controls.
4. **History (`components/HistoryView.tsx`)**: Historical logs of verified workouts, accuracy scores, and unlocked apps.
5. **Settings (`components/SettingsView.tsx`)**: Biomechanical angle calibration, sound/voice toggles, debug mode, and Android permissions guide.

---

## 5. File Structure
```
├── app/
│   ├── globals.css              # Tailwind v4 theme & custom utilities
│   ├── layout.tsx               # Root HTML layout & viewport metadata
│   └── page.tsx                 # Main controller & navigation tab manager
├── components/
│   ├── ActiveTimersCard.tsx     # Active unlocked app session countdowns
│   ├── AndroidBottomNav.tsx     # Bottom navigation bar
│   ├── AndroidTopBar.tsx        # Top app bar with camera & audio switches
│   ├── AppConfigModal.tsx       # Modal to add/edit push-up requirements per app
│   ├── AppIcon.tsx              # Dynamic SVG app icon renderer
│   ├── AppLockerView.tsx        # App locker management & category filter view
│   ├── CameraFeed.tsx           # Video stream & skeleton canvas renderer with HUD
│   ├── ExerciseGuideModal.tsx   # Biomechanics push-up form instruction guide
│   ├── FormFeedbackCard.tsx     # Real-time posture & form feedback
│   ├── HistoryView.tsx          # Workout history & unlock records
│   ├── HomeDashboard.tsx        # Primary overview dashboard
│   ├── LockScreenModal.tsx      # Android overlay lock screen simulation
│   ├── PreWorkoutCountdown.tsx  # Pre-workout ready timer buffer
│   ├── RepStatsCard.tsx         # Live rep count, pace, and calorie metrics
│   ├── SettingsModal.tsx        # Quick settings modal
│   ├── SettingsView.tsx         # Calibration & native Android permissions
│   ├── WorkoutControls.tsx      # Start, pause, resume, reset controls
│   └── WorkoutSummaryModal.tsx  # Post-workout celebration & stats breakdown
├── hooks/
│   ├── usePoseDetector.ts       # MediaPipe Pose loader & video frame loop
│   └── usePushUpTracker.ts      # Biomechanics state machine & rep counter
├── lib/
│   ├── audio.ts                 # Web Audio synth sound effects & TTS speech synthesis
│   ├── haptics.ts               # Device vibration feedback bridge
│   ├── pose-math.ts             # 3D vector angle, posture gates, & landmark smoother
│   ├── skeleton-renderer.ts     # 60 FPS HTML5 canvas skeleton drawer (Green/Red)
│   └── native-bridge/
│       └── androidAppLocker.ts  # Android native interface & local storage
├── types/
│   └── fitness.ts               # TypeScript interfaces for apps, reps, and sessions
├── context.md                   # Complete project context & documentation
├── next.config.ts               # Next.js build & static export config
└── package.json                 # Dependencies and npm scripts
```

---

## 6. Development & Deployment Commands

```bash
# Install dependencies
npm install

# Run locally in development mode
npm run dev

# Build production static export
npm run build
```
