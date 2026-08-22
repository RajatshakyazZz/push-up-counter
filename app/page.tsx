'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AndroidTopBar } from '@/components/AndroidTopBar';
import { AndroidBottomNav, ActiveTab } from '@/components/AndroidBottomNav';
import { HomeDashboard } from '@/components/HomeDashboard';
import { AppLockerView } from '@/components/AppLockerView';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { CameraFeed } from '@/components/CameraFeed';
import { RepStatsCard } from '@/components/RepStatsCard';
import { FormFeedbackCard } from '@/components/FormFeedbackCard';
import { WorkoutControls } from '@/components/WorkoutControls';
import { LockScreenModal } from '@/components/LockScreenModal';
import { AppConfigModal } from '@/components/AppConfigModal';
import { WorkoutSummaryModal } from '@/components/WorkoutSummaryModal';
import { ExerciseGuideModal } from '@/components/ExerciseGuideModal';
import { SettingsModal } from '@/components/SettingsModal';

import { usePoseDetector } from '@/hooks/usePoseDetector';
import { usePushUpTracker } from '@/hooks/usePushUpTracker';
import { PoseAnalysis } from '@/lib/pose-math';
import { androidAppLocker } from '@/lib/native-bridge/androidAppLocker';
import {
  ProtectedApp,
  UnlockSession,
  WorkoutSessionLog,
  AppProtectionSettings,
} from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

export default function PushLockApp() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // PushLock State from Native Bridge / Storage (using lazy initializers to avoid effect setState)
  const [protectedApps, setProtectedApps] = useState<ProtectedApp[]>(() =>
    androidAppLocker.getProtectedApps()
  );
  const [activeSessions, setActiveSessions] = useState<UnlockSession[]>(() =>
    androidAppLocker.getActiveUnlockSessions()
  );
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionLog[]>(() =>
    androidAppLocker.getWorkoutHistory()
  );
  const [protectionSettings, setProtectionSettings] = useState<AppProtectionSettings>(() =>
    androidAppLocker.getProtectionSettings()
  );

  // App Locker Modals
  const [selectedAppForLock, setSelectedAppForLock] = useState<ProtectedApp | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<ProtectedApp | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddingNewApp, setIsAddingNewApp] = useState(false);

  // Active Unlocking Session State
  const [activeUnlockingApp, setActiveUnlockingApp] = useState<ProtectedApp | null>(null);

  // General Modals
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Periodic active unlock session sync
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSessions(androidAppLocker.getActiveUnlockSessions());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Workout State Tracker
  const {
    phase,
    formStatus,
    feedbackMessage,
    stats,
    repRecords,
    settings,
    debugInfo,
    handlePoseFrame,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    resetWorkout,
    updateSettings,
  } = usePushUpTracker();

  // Aspect ratio state (9:16 portrait for full-body tracking, 16:9 for widescreen)
  const [cameraAspect, setCameraAspect] = useState<'9:16' | '16:9'>('9:16');

  // Pre-workout countdown buffer state
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Callback wrapper for PoseDetector
  const onPoseFrame = useCallback(
    (analysis: PoseAnalysis) => {
      handlePoseFrame(analysis);
    },
    [handlePoseFrame]
  );

  // Real-time Pose Detector Hook
  const {
    videoRef,
    canvasRef,
    isLoading,
    modelLoaded,
    isCameraActive,
    cameraError,
    cameras,
    selectedCameraId,
    fps,
    latestAnalysis,
    startCamera,
    stopCamera,
    switchCamera,
  } = usePoseDetector(settings, phase, onPoseFrame);

  // Check for goal completion after rep count change
  const prevRepsRef = useRef(stats.totalReps);
  useEffect(() => {
    if (
      activeUnlockingApp &&
      stats.totalReps >= activeUnlockingApp.targetReps &&
      prevRepsRef.current < activeUnlockingApp.targetReps &&
      stats.isActive
    ) {
      // Complete app unlock via bridge
      androidAppLocker.unlockApp(
        activeUnlockingApp.packageName,
        activeUnlockingApp.unlockMinutes,
        stats.totalReps
      );

      // Refresh storage states
      setProtectedApps(androidAppLocker.getProtectedApps());
      setActiveSessions(androidAppLocker.getActiveUnlockSessions());
      setWorkoutHistory(androidAppLocker.getWorkoutHistory());

      // Open celebration summary modal
      pauseWorkout();
      setIsSummaryOpen(true);
    }
    prevRepsRef.current = stats.totalReps;
  }, [stats.totalReps, stats.isActive, activeUnlockingApp, pauseWorkout]);

  // Handler: Open Lock Screen simulation for an app
  const handleOpenLockModal = (app: ProtectedApp) => {
    setSelectedAppForLock(app);
    setIsLockModalOpen(true);
  };

  // Handler: User clicks "Start Push-ups to Unlock" on the lock screen
  const handleStartUnlockWorkout = (app: ProtectedApp) => {
    setIsLockModalOpen(false);
    setActiveUnlockingApp(app);
    updateSettings({ targetReps: app.targetReps });
    setActiveTab('workout');

    // Activate camera and countdown
    setCameraAspect('9:16');
    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }

    const bufferSec = settings.countdownSeconds ?? 5;
    if (bufferSec > 0) {
      setIsCountdownActive(true);
    } else {
      startWorkout();
    }
  };

  // Handler: Instant unlock test for demo purposes
  const handleInstantUnlockTest = (app: ProtectedApp) => {
    setIsLockModalOpen(false);
    androidAppLocker.unlockApp(app.packageName, app.unlockMinutes, app.targetReps);
    setProtectedApps(androidAppLocker.getProtectedApps());
    setActiveSessions(androidAppLocker.getActiveUnlockSessions());
    setWorkoutHistory(androidAppLocker.getWorkoutHistory());
  };

  // Handler: Relock an app
  const handleRelockApp = (packageName: string) => {
    androidAppLocker.lockApp(packageName);
    setActiveSessions(androidAppLocker.getActiveUnlockSessions());
  };

  // Handler: Extend app unlock with more pushups
  const handleExtendApp = (app: ProtectedApp) => {
    handleStartUnlockWorkout(app);
  };

  // Handler: Toggle Protection for an app
  const handleToggleProtection = (packageName: string, isProtected: boolean) => {
    androidAppLocker.toggleProtection(packageName, isProtected);
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  // Handler: Open App Configuration Modal
  const handleEditApp = (app: ProtectedApp) => {
    setSelectedAppForEdit(app);
    setIsAddingNewApp(false);
    setIsConfigModalOpen(true);
  };

  const handleAddNewApp = () => {
    setSelectedAppForEdit(null);
    setIsAddingNewApp(true);
    setIsConfigModalOpen(true);
  };

  const handleSaveAppConfig = (updatedApp: ProtectedApp) => {
    androidAppLocker.protectApp(
      updatedApp.packageName,
      updatedApp.name,
      updatedApp.targetReps,
      updatedApp.unlockMinutes,
      updatedApp.category,
      updatedApp.iconName,
      updatedApp.color
    );
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  const handleDeleteApp = (packageName: string) => {
    androidAppLocker.deleteApp(packageName);
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  // Standard Workout Controls
  const handleStartWorkout = () => {
    setCameraAspect('9:16');
    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }

    const bufferSec = settings.countdownSeconds ?? 5;
    if (bufferSec > 0) {
      setIsCountdownActive(true);
    } else {
      startWorkout();
    }
  };

  const handleCountdownComplete = () => {
    setIsCountdownActive(false);
    startWorkout();
  };

  const handleCountdownCancel = () => {
    setIsCountdownActive(false);
  };

  const handleFinishWorkout = () => {
    setIsCountdownActive(false);
    pauseWorkout();

    // If free workout, log to history
    if (stats.totalReps > 0) {
      androidAppLocker.logWorkoutSession({
        id: `workout-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        reps: stats.totalReps,
        durationSeconds: stats.elapsedSeconds,
        unlockedAppName: activeUnlockingApp ? activeUnlockingApp.name : undefined,
        unlockedPackageName: activeUnlockingApp ? activeUnlockingApp.packageName : undefined,
        formAccuracy: stats.avgFormScore,
        caloriesBurned: stats.caloriesBurned,
        type: activeUnlockingApp ? 'app_unlock' : 'free_workout',
      });
      setWorkoutHistory(androidAppLocker.getWorkoutHistory());
    }

    setIsSummaryOpen(true);
  };

  const handleRestartWorkout = () => {
    setIsSummaryOpen(false);
    resetWorkout();
    setCameraAspect('9:16');
    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }
    const bufferSec = settings.countdownSeconds ?? 5;
    if (bufferSec > 0) {
      setIsCountdownActive(true);
    } else {
      startWorkout();
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Android Top App Bar */}
      <AndroidTopBar
        settings={settings}
        protectedAppsCount={protectedApps.filter((a) => a.isProtected).length}
        cameras={cameras}
        selectedCameraId={selectedCameraId}
        onCameraChange={switchCamera}
        onToggleSound={() => updateSettings({ soundEffects: !settings.soundEffects })}
        onToggleVoice={() => updateSettings({ voiceAnnounce: !settings.voiceAnnounce })}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Tab Screen Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 pb-28">
        {/* Tab 1: Home Dashboard */}
        {activeTab === 'home' && (
          <HomeDashboard
            protectedApps={protectedApps}
            activeSessions={activeSessions}
            workoutHistory={workoutHistory}
            onOpenLockModal={handleOpenLockModal}
            onNavigateToTab={(tab) => {
              triggerHaptic('click');
              setActiveTab(tab);
            }}
            onRelockApp={handleRelockApp}
            onExtendApp={handleExtendApp}
          />
        )}

        {/* Tab 2: Apps Locker Manager */}
        {activeTab === 'apps' && (
          <AppLockerView
            protectedApps={protectedApps}
            activeSessions={activeSessions}
            onToggleProtection={handleToggleProtection}
            onOpenLockModal={handleOpenLockModal}
            onEditApp={handleEditApp}
            onAddNewApp={handleAddNewApp}
          />
        )}

        {/* Tab 3: Dedicated Push-Up Counter / Workout Camera */}
        {activeTab === 'workout' && (
          <div className="space-y-6 pb-24">
            {/* If currently in an app unlock session, show banner */}
            {activeUnlockingApp && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Unlocking App:
                    </span>
                    <h2 className="text-base font-black text-gray-900">
                      {activeUnlockingApp.name} ({stats.totalReps} / {activeUnlockingApp.targetReps} reps)
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveUnlockingApp(null);
                    resetWorkout();
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer"
                >
                  Cancel Unlock
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Camera & Vision Canvas Feed */}
              <section className="lg:col-span-7 flex flex-col gap-4">
                <CameraFeed
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  isCameraActive={isCameraActive}
                  isLoading={isLoading}
                  modelLoaded={modelLoaded}
                  cameraError={cameraError}
                  fps={fps}
                  phase={phase}
                  formStatus={formStatus}
                  feedbackMessage={feedbackMessage}
                  analysis={latestAnalysis}
                  settings={settings}
                  stats={stats}
                  debugInfo={debugInfo}
                  cameraAspect={cameraAspect}
                  isCountdownActive={isCountdownActive}
                  onStartCamera={() => startCamera(selectedCameraId)}
                  onStopCamera={() => {
                    setIsCountdownActive(false);
                    stopCamera();
                  }}
                  onToggleMirror={() => updateSettings({ mirrorVideo: !settings.mirrorVideo })}
                  onToggleAspectRatio={(aspect) => setCameraAspect(aspect)}
                  onToggleDebug={() => updateSettings({ debugMode: !settings.debugMode })}
                  onCountdownComplete={handleCountdownComplete}
                  onCountdownCancel={handleCountdownCancel}
                  onUpdateCountdownDuration={(sec) => updateSettings({ countdownSeconds: sec })}
                />

                <FormFeedbackCard
                  formStatus={formStatus}
                  feedbackMessage={feedbackMessage}
                  analysis={latestAnalysis}
                  settings={settings}
                  avgFormScore={stats.avgFormScore}
                />
              </section>

              {/* Right: Rep Counters & Workout Controls */}
              <section className="lg:col-span-5 flex flex-col gap-4">
                <RepStatsCard stats={stats} settings={settings} phase={phase} />

                <WorkoutControls
                  stats={stats}
                  settings={settings}
                  isCameraActive={isCameraActive}
                  isCountdownActive={isCountdownActive}
                  onStart={handleStartWorkout}
                  onPause={pauseWorkout}
                  onResume={resumeWorkout}
                  onReset={() => {
                    setIsCountdownActive(false);
                    resetWorkout();
                  }}
                  onFinishWorkout={handleFinishWorkout}
                  onUpdateSettings={updateSettings}
                />
              </section>
            </div>
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <HistoryView workoutHistory={workoutHistory} />
        )}

        {/* Tab 5: Settings & Android Bridge */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            protectionSettings={protectionSettings}
            onUpdateSettings={updateSettings}
            onUpdateProtectionSettings={(newSet) => {
              const updated = androidAppLocker.saveProtectionSettings(newSet);
              setProtectionSettings(updated);
            }}
            onResetAllData={() => {
              androidAppLocker.resetAllData();
              setProtectedApps(androidAppLocker.getProtectedApps());
              setActiveSessions(androidAppLocker.getActiveUnlockSessions());
              setWorkoutHistory(androidAppLocker.getWorkoutHistory());
            }}
          />
        )}
      </main>

      {/* Android Bottom Navigation Bar */}
      <AndroidBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          triggerHaptic('click');
          setActiveTab(tab);
        }}
        activeUnlocksCount={activeSessions.length}
      />

      {/* Interactive App Lock Screen Simulation Modal */}
      <LockScreenModal
        isOpen={isLockModalOpen}
        app={selectedAppForLock}
        onClose={() => setIsLockModalOpen(false)}
        onStartUnlockWorkout={handleStartUnlockWorkout}
        onInstantUnlockTest={handleInstantUnlockTest}
      />

      {/* App Configuration / Add App Modal */}
      <AppConfigModal
        isOpen={isConfigModalOpen}
        app={selectedAppForEdit}
        isNewApp={isAddingNewApp}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={handleSaveAppConfig}
        onDelete={handleDeleteApp}
      />

      {/* Workout Complete / App Unlocked Summary Modal */}
      <WorkoutSummaryModal
        isOpen={isSummaryOpen}
        stats={stats}
        repRecords={repRecords}
        settings={settings}
        unlockedApp={activeUnlockingApp}
        onClose={() => {
          setIsSummaryOpen(false);
          setActiveUnlockingApp(null);
        }}
        onRestart={handleRestartWorkout}
      />

      {/* Exercise Biomechanics Form Guide Modal */}
      <ExerciseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Quick Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
}
