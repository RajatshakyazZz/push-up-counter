# PushLock AI — Project Context & Architecture

## Overview
**PushLock AI** is an Android-first digital wellbeing and productivity application that locks distracting apps (such as Instagram, YouTube, Snapchat, TikTok, Reddit, and mobile games) until the user earns screen time by performing verified push-ups detected locally by AI computer vision.

- **Motto**: "Train → Earn → Unlock → Focus."
- **Platform Architecture**: Android Native (Capacitor / Kotlin UsageStats & System Alert Window) + Web PWA Preview.
- **Vision Engine**: MediaPipe Pose estimation running 100% locally in-browser / on-device at 60 FPS with zero server costs (₹0 API budget).

---

## Core Features
1. **App Locker (`lib/native-bridge/androidAppLocker.ts`)**:
   - Per-app configurable push-up targets (e.g. 20 push-ups) and unlock durations (e.g. 15 minutes).
   - Real-time active unlock session countdown timers with auto-relock when time expires.
   - Demo apps for Web Preview with full simulation + clean native Android bridge integration.

2. **AI Push-Up Counter & Form Engine**:
   - Finite state machine with anti-false-positive filtering (`isPlankOrientation`, `rom >= 35°`, minimum rep duration).
   - Audio feedback, countdown buffer (5s), depth gauge, plank alignment checks, and voice announcements.

3. **Light-Mode Android Design System**:
   - Primary Background: `#F7F8FA`
   - Surfaces & Cards: `#FFFFFF` with `#E5E7EB` borders
   - Primary Accent: `#16A34A` (Android Emerald Green)
   - Bottom navigation bar with Android Material 3 tactile aesthetic.

4. **Screen Navigation**:
   - **Home (Dashboard)**: Daily focus score, active unlock countdowns, quick unlock launch, recent activity.
   - **Apps (Locker)**: List of protected apps, category filters, push-up target sliders, unlock time selectors, and instant test lock triggers.
   - **Workout (Push-Ups)**: Full-screen AI push-up counter with MediaPipe vision, live HUD, and form feedback.
   - **History**: Workout session history, rep breakdown, and unlocked app logs.
   - **Settings & Android Guide**: Android native permissions guide (`PACKAGE_USAGE_STATS`, `SYSTEM_ALERT_WINDOW`), push-up angle calibrations, strict lock modes, and privacy guarantees.

---

## Android Native Bridge Interface
- `getInstalledApps()`
- `getProtectedApps()`
- `protectApp(packageName, targetReps, unlockMinutes)`
- `unprotectApp(packageName)`
- `unlockApp(packageName, durationMinutes, repsCompleted)`
- `getRemainingUnlockTime(packageName)`
- `checkUsageAccessPermission()`
- `openUsageAccessSettings()`
- `triggerHaptic(type)`
