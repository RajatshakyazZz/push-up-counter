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
- **Landmark Smoothing**: Raw 33 3D landmarks pass through `LandmarkSmoother` using Exponential Moving Average (EMA, $\alpha = 0.65$) to eliminate frame jitter and camera sensor noise.
- **Privacy Assurance**: Camera frames flow directly from `navigator.mediaDevices.getUserMedia` into WebAssembly memory buffers. Zero frames or landmark coordinates are uploaded to external servers.

### B. Multi-Angle Spatial Posture Gate (`lib/pose-math.ts:validatePushUpPosture`)
Distinguishes genuine push-up positions from standing upright, sitting, or random arm movements across all camera angles:
1. **Front-Facing Floor View (Phone placed on floor in front of user)**:
   - Recognizes supporting hands planted wide on the ground ($y_{\text{wrist}} \ge 0.35$ and $\text{wristSpan} \ge 0.12$ or $\ge 0.40 \times \text{shoulderSpan}$).
   - Wide upper-body span in foreground ($\text{shoulderSpan} \ge 0.08$).
   - Graceful fallback to knees/hips if ankles are obscured in floor shadows.
2. **Side Profile View**:
   - Validates horizontal torso angle ($\text{torsoAngleWithHorizontal} \le 60^\circ$, or $\le 68^\circ$ for incline).
3. **Elevated / Incline & Knee Variants**:
   - Full support for elevated surfaces (hands on bed/chair/couch) and knee push-ups.
4. **Strict False Movement Rejection (Standing / Sitting / Arm Waving)**:
   - Rejects standing upright (torso angle $> 70^\circ$, vertical height ratio $> 2.85$, narrow wrist span or hands in air).
   - Rejects sitting on a chair/bed and flailing arms ($y_{\text{wrist}} < y_{\text{shoulder}} - 0.08$).

### C. Color-Coded Interactive Skeleton Renderer (`lib/skeleton-renderer.ts`)
- **Vibrant Electric Green (`#22c55e` / `#a3e635`)**:
  - Rendered when user is in a valid push-up plank position.
  - **Stays 100% Green** throughout descent (down) and ascent (up) cycles.
- **Bright Warning Red (`#ef4444`)**:
  - Rendered when user is in an invalid pose (standing, sitting, waving hands, or wrong angle).
  - Rep counting is strictly blocked while in red state.

### D. Multi-Frame Debounced Finite State Machine (`hooks/usePushUpTracker.ts`)
```
[IDLE / WAITING] 
       │ (Plank held for 4 frames)
       ▼
[READY / PLANK LOCKED] (Auto-starts workout & timer, announces "Ready!")
       │ (Elbow angle < 138°)
       ▼
[GOING_DOWN] (Chest lowers towards floor)
       │ (Elbow angle <= 92° for 2 frames)
       ▼
[DOWN / TARGET DEPTH] (Depth confirmed: reachedBottomRef = true, plays down cue)
       │ (Elbow angle > 104°)
       ▼
[GOING_UP] (Pushing up to lockout)
       │ (Elbow angle >= 142° for 2 frames + ROM >= 30° + Duration >= 500ms)
       ▼
[REP COMPLETED] (+1 Rep, Rep Chime, Voice Coach announcement, streak updated)
       │ (250ms cooldown buffer)
       ▼
[READY] (Cycle repeats)
```

### E. Hands-Free Auto-Start
- When the user steps into the camera view on the workout tab and assumes a valid push-up plank, the system:
  1. Detects `isPositionValid === true`.
  2. Confirms stability for 4 consecutive frames (~130ms).
  3. Sets `stats.isActive = true` and `isPaused = false` automatically.
  4. Starts the elapsed workout timer.
  5. Speaks voice prompt: *"Ready — start your push-up!"*

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

### B. Native Android Roadmap (Capacitor + Kotlin)
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
