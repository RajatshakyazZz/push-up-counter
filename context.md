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

### B. Native Android Platform (Capacitor 8.5.0 + Kotlin)
- **Framework**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` v8.5.0.
- **Config**: `capacitor.config.ts` (appId: `com.pushlock.ai`, appName: `PushLock AI`, webDir: `out`).
- **Static Export**: Next.js 15 configured with `output: 'export'` and `images.unoptimized: true` generating standalone assets into `out/` and synced to `android/app/src/main/assets/public`.
- **Native Android Structure**: Android Gradle project initialized in `/android` targeting Android SDK 36, Java 21 LTS, and Kotlin 2.0.21.
- **App Inventory (`AppInventoryManager.kt`)**: Real installed application discovery using `Intent.ACTION_MAIN` and `Intent.CATEGORY_LAUNCHER` with downsampled 96x96 Base64 LRU icon caching.
- **Native Storage (`NativeAppProtectionStore.kt`)**: SharedPreferences-backed single source of truth for protection configurations and absolute `unlockUntil` timestamps.
- **Foreground Detection (`PushLockAccessibilityService.kt`)**: Zero-latency `TYPE_WINDOW_STATE_CHANGED` interception with `canRetrieveWindowContent="false"` and `isAccessibilityTool="false"`.
- **Continuous Foreground Re-lock**: Uses scheduled Handler timers so protected apps re-lock immediately upon `unlockUntil` expiry even if the user never leaves the application.
- **Native Bridge Plugin (`PushLockAppLockerPlugin.kt`)**: Exposes methods and live `appLockTriggered` event listeners directly to React.
- **Camera Permission**: Configured `<uses-permission android:name="android.permission.CAMERA" />` in `android/app/src/main/AndroidManifest.xml`.
- **Debug APK Location**: `android/app/build/outputs/apk/debug/app-debug.apk` (4.5 MB).

### C. Permissions & Privacy Safeguards
- **Permissions**:
  - `android.permission.CAMERA` (For MediaPipe local on-device pose estimation)
  - `android.permission.BIND_ACCESSIBILITY_SERVICE` (For PushLock AI foreground app protection)
  - `android.permission.SYSTEM_ALERT_WINDOW` (For displaying lock screen over protected apps)
  - `android.permission.POST_NOTIFICATIONS` (For live status bar countdown updates)
  - `android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` (To prevent background kill by OEM battery managers)
  - `android.permission.REORDER_TASKS` (For smooth task switching)
- **Privacy Guarantees**:
  - `canRetrieveWindowContent="false"`: PushLock AI cannot read text, passwords, messages, or screen contents.
  - Affirmative consent disclosure modal required before directing user to Android Accessibility Settings.
  - Zero cloud dependencies — 100% on-device local execution.

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
1. **Home (`components/HomeDashboard.tsx`)**: Real daily rep count, active session countdowns, and real recent workout logs.
2. **Apps (`components/AppLockerView.tsx`)**: Real installed launcher apps from `PackageManager`, protect/unprotect buttons, and configuration sheets.
3. **Workout (`app/page.tsx:workout`, `components/CameraFeed.tsx`)**: Ultra-clean portrait-optimized camera feed, bold HUD counter (`12 / 20`), subtle skeleton, instant camera start without pre-workout delay, concise live coach feedback pill, pause/resume, and finish buttons.
4. **Time Management (`components/TimeManagementView.tsx`)**: Push-up reward engine configuring screen time earned per rep (`15s`, `30s`, `1m`, `2m`, `3m`, `5m`) with live mathematical preview.
5. **History (`components/HistoryView.tsx`)**: Real historical logs of verified workouts, accuracy scores, and unlocked apps.
6. **Settings (`components/SettingsView.tsx`)**: Voice coach toggles, sound effects, strict form mode, screen-off relock, and live Android native permissions diagnostics.

---

## 5. File Structure
```
├── android/                     # Native Android Capacitor Project
│   ├── app/
│   │   ├── build.gradle         # Application gradle build file (appId: com.pushlock.ai)
│   │   ├── build/outputs/apk/debug/app-debug.apk # Generated Debug APK (4.4 MB)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Permissions (CAMERA, SYSTEM_ALERT_WINDOW, BIND_ACCESSIBILITY_SERVICE, POST_NOTIFICATIONS, REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
│   │       ├── java/com/pushlock/ai/
│   │       │   ├── MainActivity.java # Main Activity & lock intent dispatcher
│   │       │   ├── inventory/AppInventoryManager.kt # Real launcher app query & Base64 LRU cache
│   │       │   ├── notification/PushLockNotificationManager.kt # Status bar live countdown & expiry alerts
│   │       │   ├── plugin/PushLockAppLockerPlugin.kt # Capacitor plugin bridge & permission checks
│   │       │   ├── service/PushLockAccessibilityService.kt # Foreground app interception & active screen-time deduction ticker
│   │       │   └── storage/NativeAppProtectionStore.kt # Persistent SharedPreferences single source of truth
│   │       └── assets/public/   # Synced Next.js production build assets
│   ├── build.gradle             # Root gradle build configuration
│   └── variables.gradle         # Android SDK & library versions
├── app/
│   ├── globals.css              # Tailwind v4 theme & custom utilities
│   ├── layout.tsx               # Root HTML layout & viewport metadata
│   └── page.tsx                 # Main controller, permission gate & navigation tab manager
├── components/
│   ├── AccessibilityConsentModal.tsx # Affirmative user disclosure modal before opening settings
│   ├── ActiveTimersCard.tsx     # Active unlocked app session countdowns
│   ├── AndroidBottomNav.tsx     # Bottom navigation bar
│   ├── AndroidTopBar.tsx        # Top app bar with camera & audio switches
│   ├── AppConfigModal.tsx       # Modal to configure push-up target and reward rate per app
│   ├── AppIcon.tsx              # Dynamic SVG & native Base64 icon renderer
│   ├── AppLockerView.tsx        # Real installed apps catalogue & protection manager
│   ├── CameraFeed.tsx           # Clean portrait workout camera feed with giant HUD counter
│   ├── ExerciseGuideModal.tsx   # Biomechanics push-up form instruction guide
│   ├── FormFeedbackCard.tsx     # Real-time posture & form feedback
│   ├── HistoryView.tsx          # Workout history & unlock records
│   ├── HomeDashboard.tsx        # Primary overview dashboard with real metrics
│   ├── LockScreenModal.tsx      # Android overlay lock screen experience
│   ├── ProtectionSetupView.tsx  # First-launch Android permission onboarding & live diagnostic
│   ├── SettingsModal.tsx        # Quick preferences modal
│   ├── SettingsView.tsx         # Preferences & live Android permissions diagnostic
│   ├── TimeManagementView.tsx   # Reward per push-up configuration screen
│   └── WorkoutSummaryModal.tsx  # Post-workout celebration, stats breakdown, & Open App CTA
├── hooks/
│   ├── usePoseDetector.ts       # MediaPipe Pose loader & video frame loop
│   └── usePushUpTracker.ts      # Biomechanics state machine & rep counter (Untouched!)
├── lib/
│   ├── audio.ts                 # Web Audio synth sound effects & TTS speech synthesis
│   ├── haptics.ts               # Device vibration feedback bridge
│   ├── pose-math.ts             # 3D vector angle, posture gates, & landmark smoother (Untouched!)
│   ├── skeleton-renderer.ts     # 60 FPS HTML5 canvas skeleton drawer (Green/Red)
│   └── native-bridge/
│       └── androidAppLocker.ts  # Android native interface & SharedPreferences bridge
├── types/
│   └── fitness.ts               # TypeScript interfaces for apps, reps, and sessions
├── capacitor.config.ts          # Capacitor App configuration
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

# Sync web assets to Capacitor Android project
npm run cap:sync

# Open Android project in Android Studio
npm run cap:open

# Build Android Debug APK via CLI
cd android && export JAVA_HOME="$HOME/jdk-21/Contents/Home" && ./gradlew assembleDebug

# Install Debug APK to connected Android device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
