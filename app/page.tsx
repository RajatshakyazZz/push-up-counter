'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AndroidTopBar } from '@/components/AndroidTopBar';
import { AndroidBottomNav, ActiveTab } from '@/components/AndroidBottomNav';
import { HomeDashboard } from '@/components/HomeDashboard';
import { AppLockerView } from '@/components/AppLockerView';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { TimeManagementView } from '@/components/TimeManagementView';
import { CameraFeed } from '@/components/CameraFeed';
import { LockScreenModal } from '@/components/LockScreenModal';
import { AppConfigModal } from '@/components/AppConfigModal';
import { WorkoutSummaryModal } from '@/components/WorkoutSummaryModal';
import { ExerciseGuideModal } from '@/components/ExerciseGuideModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AccessibilityConsentModal } from '@/components/AccessibilityConsentModal';
import { ProtectionSetupView } from '@/components/ProtectionSetupView';

import { usePoseDetector } from '@/hooks/usePoseDetector';
import { usePushUpTracker } from '@/hooks/usePushUpTracker';
import { PoseAnalysis } from '@/lib/pose-math';
import { androidAppLocker } from '@/lib/native-bridge/androidAppLocker';
import {
  ProtectedApp,
  InstalledApp,
  UnlockSession,
  WorkoutSessionLog,
  AppProtectionSettings,
} from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

export default function PushLockApp() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab | 'time'>('home');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() =>
    !androidAppLocker.isOnboardingCompleted()
  );

  // PushLock State from Native Bridge / Storage
  const [protectedApps, setProtectedApps] = useState<ProtectedApp[]>(() =>
    androidAppLocker.getProtectedApps()
  );
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [activeSessions, setActiveSessions] = useState<UnlockSession[]>(() =>
    androidAppLocker.getActiveUnlockSessions()
  );
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionLog[]>(() =>
    androidAppLocker.getWorkoutHistory()
  );
  const [protectionSettings, setProtectionSettings] = useState<AppProtectionSettings>(() =>
    androidAppLocker.getProtectionSettings()
  );
  const [isProtectionEnabled, setIsProtectionEnabled] = useState<boolean>(true);

  // App Locker Modals
  const [selectedAppForLock, setSelectedAppForLock] = useState<ProtectedApp | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [selectedAppForEdit, setSelectedAppForEdit] = useState<ProtectedApp | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddingNewApp, setIsAddingNewApp] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  // Active Unlocking Session State
  const [activeUnlockingApp, setActiveUnlockingApp] = useState<ProtectedApp | null>(null);

  // General Modals
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial Data & Real Native Discovery on Mount
  useEffect(() => {
    let isMounted = true;

    async function loadNativeData() {
      // 1. Fetch real installed launcher apps from Android
      try {
        const apps = await androidAppLocker.getInstalledApps();
        if (isMounted && apps?.length > 0) {
          setInstalledApps(apps);
        }
      } catch (e) {
        console.error('Failed to load installed apps:', e);
      }

      // 2. Fetch protected apps from Native Store
      try {
        const prot = await androidAppLocker.getProtectedAppsAsync();
        if (isMounted && prot?.length > 0) {
          setProtectedApps(prot);
        }
      } catch (e) {
        console.error('Failed to load protected apps:', e);
      }

      // 3. Check Accessibility Service Status
      try {
        const enabled = await androidAppLocker.isProtectionServiceEnabled();
        if (isMounted) {
          setIsProtectionEnabled(enabled);
        }
      } catch (e) {
        console.error('Failed to check protection service:', e);
      }

      // 4. Check for any pending lock trigger intent (e.g. app opened while PushLock was backgrounded)
      try {
        const pending = await androidAppLocker.checkPendingLockTrigger();
        if (isMounted && pending) {
          setSelectedAppForLock(pending);
          setIsLockModalOpen(true);
        }
      } catch (e) {
        console.error('Failed to check pending lock trigger:', e);
      }
    }

    loadNativeData();

    // 5. Subscribe to real-time Android lock triggers
    const unsubscribeLockTrigger = androidAppLocker.onLockTriggered((lockedApp) => {
      if (isMounted && lockedApp) {
        setSelectedAppForLock(lockedApp);
        setIsLockModalOpen(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeLockTrigger();
    };
  }, []);

  // Periodic active unlock session & service status sync
  useEffect(() => {
    const interval = setInterval(async () => {
      setActiveSessions(androidAppLocker.getActiveUnlockSessions());
      const enabled = await androidAppLocker.isProtectionServiceEnabled();
      setIsProtectionEnabled(enabled);
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

  // Handler: User clicks "Start Push-ups to Unlock" on the lock screen
  const handleStartUnlockWorkout = (app: ProtectedApp) => {
    setIsLockModalOpen(false);
    setActiveUnlockingApp(app);
    resetWorkout();
    setActiveTab('workout');

    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }
    startWorkout();
  };

  // Handler: Launch the unlocked app immediately from celebration modal
  const handleOpenUnlockedApp = async (app: ProtectedApp) => {
    setIsSummaryOpen(false);
    setActiveUnlockingApp(null);
    await androidAppLocker.launchApp(app.packageName);
  };

  // Handler: Relock an app
  const handleRelockApp = async (packageName: string) => {
    await androidAppLocker.lockApp(packageName);
    setActiveSessions(androidAppLocker.getActiveUnlockSessions());
  };

  // Handler: Extend app unlock with more pushups
  const handleExtendApp = (app: ProtectedApp) => {
    handleStartUnlockWorkout(app);
  };

  // Handler: Toggle Protection for an app
  const handleToggleProtection = async (packageName: string, isProtected: boolean) => {
    await androidAppLocker.toggleProtection(packageName, isProtected);
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  // Handler: Open App Configuration Modal
  const handleEditApp = (app: ProtectedApp) => {
    setSelectedAppForEdit(app);
    setIsAddingNewApp(false);
    setIsConfigModalOpen(true);
  };

  const handleProtectInstalledApp = (installedApp: InstalledApp) => {
    const rewardSec = protectionSettings.rewardSecondsPerRep || 60;
    const targetReps = 20;
    const calculatedMinutes = Math.max(1, Math.round((targetReps * rewardSec) / 60));

    setSelectedAppForEdit({
      id: `installed-${installedApp.packageName}`,
      packageName: installedApp.packageName,
      name: installedApp.name,
      category: installedApp.category,
      iconName: installedApp.iconName,
      color: installedApp.color,
      iconDataUri: installedApp.iconDataUri,
      targetReps,
      rewardSecondsPerRep: rewardSec,
      unlockMinutes: calculatedMinutes,
      isProtected: true,
      timesUnlockedToday: 0,
      totalUnlocks: 0,
      lastUnlockedAt: null,
    });
    setIsAddingNewApp(false);
    setIsConfigModalOpen(true);
  };

  const handleSaveAppConfig = async (updatedApp: ProtectedApp) => {
    await androidAppLocker.protectApp(
      updatedApp.packageName,
      updatedApp.name,
      updatedApp.targetReps,
      updatedApp.unlockMinutes,
      updatedApp.rewardSecondsPerRep || protectionSettings.rewardSecondsPerRep || 60,
      updatedApp.category,
      updatedApp.iconName,
      updatedApp.color
    );
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  const handleDeleteApp = async (packageName: string) => {
    await androidAppLocker.deleteApp(packageName);
    setProtectedApps(androidAppLocker.getProtectedApps());
  };

  // Standard Workout Controls
  const handleStartWorkout = () => {
    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }
    startWorkout();
  };

  const handleFinishWorkout = async () => {
    pauseWorkout();

    const reps = stats.totalReps;
    if (activeUnlockingApp) {
      if (reps > 0) {
        // Unlock target app for 1 minute per push-up
        await androidAppLocker.unlockApp(
          activeUnlockingApp.packageName,
          reps,
          reps,
          false
        );
        setProtectedApps(androidAppLocker.getProtectedApps());
        setActiveSessions(androidAppLocker.getActiveUnlockSessions());
        setWorkoutHistory(androidAppLocker.getWorkoutHistory());
      }
    } else if (reps > 0) {
      androidAppLocker.logWorkoutSession({
        id: `workout-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        reps: reps,
        durationSeconds: stats.elapsedSeconds,
        formAccuracy: stats.avgFormScore,
        caloriesBurned: stats.caloriesBurned,
        type: 'free_workout',
      });
      setWorkoutHistory(androidAppLocker.getWorkoutHistory());
    }

    setIsSummaryOpen(true);
  };

  const handleRestartWorkout = () => {
    setIsSummaryOpen(false);
    resetWorkout();
    if (!isCameraActive) {
      startCamera(selectedCameraId);
    }
    startWorkout();
  };

  // If first launch, show permission onboarding screen
  if (isOnboardingOpen) {
    return (
      <ProtectionSetupView
        onCompleteSetup={() => setIsOnboardingOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Android Top App Bar (Hidden during workout for full-immersion view) */}
      {activeTab !== 'workout' && (
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
      )}

      {/* Real-time Notification Bar for Active Unlocked Sessions */}
      {activeTab !== 'workout' && activeSessions.length > 0 && (
        <div className="w-full bg-emerald-800 text-white shadow-md border-b border-emerald-900 animate-in fade-in duration-200">
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="font-black uppercase tracking-wider text-emerald-300 mr-1.5">
                  Live Status:
                </span>
                <span className="font-bold text-white">
                  {activeSessions[0].appName} Unlocked
                </span>
                <span className="text-emerald-200 ml-1.5 font-mono font-bold">
                  ({Math.max(1, Math.ceil((activeSessions[0].expiresAt - Date.now()) / 60000))}m left)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const targetApp = protectedApps.find((a) => a.packageName === activeSessions[0].packageName);
                  if (targetApp) handleExtendApp(targetApp);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold cursor-pointer transition-colors"
              >
                + Push-ups
              </button>
              <button
                onClick={() => handleRelockApp(activeSessions[0].packageName)}
                className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold cursor-pointer transition-colors"
              >
                Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Screen Content */}
      <main className={`flex-1 w-full max-w-4xl mx-auto ${activeTab === 'workout' ? 'p-2 sm:p-4' : 'p-4 sm:p-6 pb-28'}`}>
        {/* Tab 1: Home Dashboard */}
        {activeTab === 'home' && (
          <HomeDashboard
            protectedApps={protectedApps}
            activeSessions={activeSessions}
            workoutHistory={workoutHistory}
            onNavigateToTab={(tab) => {
              triggerHaptic('click');
              setActiveTab(tab as ActiveTab);
            }}
            onRelockApp={handleRelockApp}
            onExtendApp={handleExtendApp}
          />
        )}

        {/* Tab 2: Apps Locker Manager */}
        {activeTab === 'apps' && (
          <AppLockerView
            protectedApps={protectedApps}
            installedApps={installedApps}
            activeSessions={activeSessions}
            isProtectionEnabled={isProtectionEnabled}
            onOpenConsentModal={() => setIsConsentModalOpen(true)}
            onToggleProtection={handleToggleProtection}
            onEditApp={handleEditApp}
            onProtectInstalledApp={handleProtectInstalledApp}
          />
        )}

        {/* Tab 3: Dedicated Push-Up Counter / Workout Camera */}
        {activeTab === 'workout' && (
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
            unlockedAppName={activeUnlockingApp ? activeUnlockingApp.name : undefined}
            onStartCamera={() => startCamera(selectedCameraId)}
            onStopCamera={stopCamera}
            onToggleSound={() => updateSettings({ soundEffects: !settings.soundEffects })}
            onBack={() => {
              stopCamera();
              setActiveTab('home');
            }}
            onPause={pauseWorkout}
            onResume={resumeWorkout}
            onFinishWorkout={handleFinishWorkout}
          />
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
            isProtectionEnabled={isProtectionEnabled}
            onOpenConsentModal={() => setIsConsentModalOpen(true)}
            onOpenTimeManagement={() => setActiveTab('time')}
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

        {/* Tab 6: Time Management Screen */}
        {activeTab === 'time' && (
          <TimeManagementView
            protectionSettings={protectionSettings}
            onUpdateProtectionSettings={(newSet) => {
              const updated = androidAppLocker.saveProtectionSettings(newSet);
              setProtectionSettings(updated);
            }}
            onBack={() => setActiveTab('settings')}
          />
        )}
      </main>

      {/* Android Bottom Navigation Bar (Hidden during workout) */}
      {activeTab !== 'workout' && (
        <AndroidBottomNav
          activeTab={activeTab === 'time' ? 'settings' : activeTab}
          onSelectTab={(tab) => {
            triggerHaptic('click');
            setActiveTab(tab);
          }}
          activeUnlocksCount={activeSessions.length}
        />
      )}

      {/* Interactive App Lock Screen Modal */}
      <LockScreenModal
        isOpen={isLockModalOpen}
        app={selectedAppForLock}
        onClose={() => setIsLockModalOpen(false)}
        onStartUnlockWorkout={handleStartUnlockWorkout}
      />

      {/* App Configuration / Protect App Modal */}
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
        onOpenApp={handleOpenUnlockedApp}
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

      {/* Affirmative Accessibility Consent Modal */}
      <AccessibilityConsentModal
        isOpen={isConsentModalOpen}
        onClose={() => setIsConsentModalOpen(false)}
        onConfirmEnable={() => {
          setIsConsentModalOpen(false);
          androidAppLocker.openProtectionSettings();
        }}
      />
    </div>
  );
}
