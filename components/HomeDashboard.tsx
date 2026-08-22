'use client';

import React from 'react';
import {
  Shield,
  Dumbbell,
  Timer,
  Flame,
  Play,
  Lock,
  Unlock,
  Sparkles,
  ChevronRight,
  Info,
  Smartphone,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { ProtectedApp, UnlockSession, WorkoutSessionLog } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { ActiveTimersCard } from '@/components/ActiveTimersCard';
import { triggerHaptic } from '@/lib/haptics';

interface HomeDashboardProps {
  protectedApps: ProtectedApp[];
  activeSessions: UnlockSession[];
  workoutHistory: WorkoutSessionLog[];
  onOpenLockModal: (app: ProtectedApp) => void;
  onNavigateToTab: (tab: 'home' | 'apps' | 'workout' | 'history' | 'settings') => void;
  onRelockApp: (packageName: string) => void;
  onExtendApp: (app: ProtectedApp) => void;
}

export function HomeDashboard({
  protectedApps,
  activeSessions,
  workoutHistory,
  onOpenLockModal,
  onNavigateToTab,
  onRelockApp,
  onExtendApp,
}: HomeDashboardProps) {
  // Calculate today's metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = workoutHistory.filter((log) => log.date === todayStr);
  const totalRepsToday = todayLogs.reduce((sum, log) => sum + log.reps, 0);
  const totalCaloriesToday = todayLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);

  const activeAppsCount = protectedApps.filter((a) => a.isProtected).length;
  const totalEarnedMins = protectedApps.reduce(
    (sum, a) => sum + a.timesUnlockedToday * a.unlockMinutes,
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Banner / Concept Pill */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none transform translate-x-8" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Digital Wellbeing & Fitness</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Train → Earn → Unlock → Focus
          </h1>
          <p className="text-sm text-emerald-100 max-w-lg mb-5 leading-relaxed">
            Distracting apps are locked by default. Knock out verified push-ups to earn screen time and build daily discipline.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('click');
                onNavigateToTab('workout');
              }}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <span>Free Push-Up Workout</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('click');
                onNavigateToTab('apps');
              }}
              className="px-4 py-3 rounded-2xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center gap-1.5 border border-emerald-400/30 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>Manage Apps ({activeAppsCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Web Preview Info Notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900">
        <Smartphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-950">
            PushLock Android Simulation Mode (Web Preview)
          </p>
          <p className="text-amber-800 leading-normal">
            Test the complete push-up counter, locked app overlays, and unlock timers with the demo apps below. On Android devices, PushLock runs as a background service via Android UsageStats to block real apps.
          </p>
        </div>
      </div>

      {/* Active Unlocked Timers (If any app is unlocked) */}
      <ActiveTimersCard
        sessions={activeSessions}
        protectedApps={protectedApps}
        onRelock={onRelockApp}
        onExtend={onExtendApp}
      />

      {/* Today's Daily Stats Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Push-ups Today</span>
            <Dumbbell className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalRepsToday}
            </div>
            <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Verified Reps</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Screen Time Earned</span>
            <Timer className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalEarnedMins} <span className="text-xs font-normal text-gray-500">mins</span>
            </div>
            <div className="text-[11px] font-medium text-blue-600 mt-0.5">
              {todayLogs.filter((l) => l.type === 'app_unlock').length} Unlock Sessions
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Apps Protected</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {activeAppsCount} <span className="text-xs font-normal text-gray-500">/ {protectedApps.length}</span>
            </div>
            <div className="text-[11px] font-medium text-purple-600 mt-0.5">
              Strict Locker Active
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Est. Calories</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalCaloriesToday} <span className="text-xs font-normal text-gray-500">kcal</span>
            </div>
            <div className="text-[11px] font-medium text-orange-600 mt-0.5">
              Cardio & Strength
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch & Test Locker Apps Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900">
              Test App Lock Experience
            </h2>
            <p className="text-xs text-gray-500">
              Tap any app to simulate launching it and test the push-up unlock flow
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('click');
              onNavigateToTab('apps');
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>All Apps</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {protectedApps.slice(0, 4).map((app) => {
            const isUnlocked = activeSessions.some((s) => s.packageName === app.packageName);

            return (
              <button
                key={app.id}
                onClick={() => {
                  triggerHaptic('click');
                  onOpenLockModal(app);
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                  isUnlocked
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-gray-50/80 border-gray-200/90 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <AppIcon
                    iconName={app.iconName}
                    name={app.name}
                    color={app.color}
                    size="md"
                  />
                  {isUnlocked ? (
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700" title="Unlocked">
                      <Unlock className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-lg bg-red-100 text-red-600" title="Locked">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {app.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {app.targetReps} push-ups • {app.unlockMinutes}m
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${isUnlocked ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {isUnlocked ? 'Unlocked Now' : 'Test Lock'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Log Preview */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900">
              Recent Push-Up Unlocks
            </h2>
            <p className="text-xs text-gray-500">
              History of completed workouts and earned screen time
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('click');
              onNavigateToTab('history');
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Full History</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {workoutHistory.slice(0, 3).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {log.unlockedAppName
                      ? `Unlocked ${log.unlockedAppName}`
                      : 'Free Push-Up Workout'}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.durationSeconds}s session
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-black text-emerald-600">
                  +{log.reps} Reps
                </div>
                <div className="text-[11px] text-gray-500">
                  {log.caloriesBurned} kcal
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
