'use client';

import React from 'react';
import {
  Shield,
  Dumbbell,
  Timer,
  Flame,
  Lock,
  Unlock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { ProtectedApp, UnlockSession, WorkoutSessionLog } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { ActiveTimersCard } from '@/components/ActiveTimersCard';
import { triggerHaptic } from '@/lib/haptics';

interface HomeDashboardProps {
  protectedApps: ProtectedApp[];
  activeSessions: UnlockSession[];
  workoutHistory: WorkoutSessionLog[];
  onNavigateToTab: (tab: 'home' | 'apps' | 'workout' | 'history' | 'settings' | 'time') => void;
  onRelockApp: (packageName: string) => void;
  onExtendApp: (app: ProtectedApp) => void;
}

export function HomeDashboard({
  protectedApps,
  activeSessions,
  workoutHistory,
  onNavigateToTab,
  onRelockApp,
  onExtendApp,
}: HomeDashboardProps) {
  // Calculate today's real metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = workoutHistory.filter((log) => log.date === todayStr);
  const totalRepsToday = todayLogs.reduce((sum, log) => sum + log.reps, 0);
  const totalCaloriesToday = todayLogs.reduce((sum, log) => sum + log.caloriesBurned, 0);

  const activeProtectedApps = protectedApps.filter((a) => a.isProtected);
  const totalEarnedMins = activeProtectedApps.reduce(
    (sum, a) => sum + (a.timesUnlockedToday || 0) * (a.unlockMinutes || 15),
    0
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-emerald-600/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none transform translate-x-8" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Digital Wellbeing & Fitness</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Earn Screen Time with Exercise
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mb-5 leading-relaxed">
            Distracting apps are locked by default. Complete AI-verified push-ups to earn screen time access and build lasting discipline.
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
              <span>Start Push-Up Workout</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('click');
                onNavigateToTab('apps');
              }}
              className="px-4 py-3 rounded-2xl bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center gap-1.5 border border-emerald-400/30 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>Manage Protected Apps ({activeProtectedApps.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Unlocked Timers */}
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
              {activeProtectedApps.length}
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

      {/* Protected Apps Overview */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-gray-900">
              Protected Apps
            </h2>
            <p className="text-xs text-gray-500">
              Apps currently protected by PushLock AI
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('click');
              onNavigateToTab('apps');
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Manage Apps</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeProtectedApps.length === 0 ? (
          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/70 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-gray-800">No protected apps yet</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Select your distracting apps (Instagram, YouTube, etc.) to start earning screen time with push-ups.
            </p>
            <button
              onClick={() => {
                triggerHaptic('click');
                onNavigateToTab('apps');
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Protect an App
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activeProtectedApps.slice(0, 4).map((app) => {
              const isUnlocked = activeSessions.some((s) => s.packageName === app.packageName);

              return (
                <div
                  key={app.packageName}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                    isUnlocked
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-gray-50/80 border-gray-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <AppIcon
                      iconName={app.iconName}
                      name={app.name}
                      color={app.color}
                      iconDataUri={app.iconDataUri}
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
                    <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">
                      {app.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {app.targetReps} reps • {app.unlockMinutes}m
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isUnlocked ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity Log */}
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
          {workoutHistory.length === 0 ? (
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200/70 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-800">No push-up sessions logged yet today</p>
              <p className="text-xs text-gray-500 mt-0.5">Start a push-up workout to earn screen time and unlock protected apps!</p>
              <button
                onClick={() => {
                  triggerHaptic('click');
                  onNavigateToTab('workout');
                }}
                className="mt-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Start First Workout
              </button>
            </div>
          ) : (
            workoutHistory.slice(0, 3).map((log) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
