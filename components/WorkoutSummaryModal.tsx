'use client';

import React from 'react';
import {
  Trophy,
  X,
  Timer,
  Gauge,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Share2,
  Check,
  Unlock,
} from 'lucide-react';
import { WorkoutStats, RepRecord, PushUpSettings, ProtectedApp } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  stats: WorkoutStats;
  repRecords: RepRecord[];
  settings: PushUpSettings;
  unlockedApp?: ProtectedApp | null;
  onClose: () => void;
  onRestart: () => void;
  onOpenApp?: (app: ProtectedApp) => void;
}

export function WorkoutSummaryModal({
  isOpen,
  stats,
  repRecords,
  settings,
  unlockedApp,
  onClose,
  onRestart,
  onOpenApp,
}: WorkoutSummaryModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    triggerHaptic('click');
    const appStr = unlockedApp ? ` to unlock ${unlockedApp.name}` : '';
    const text = `💪 Just crushed ${stats.totalReps} AI-verified push-ups in ${formatTime(
      stats.elapsedSeconds
    )}${appStr} on PushLock AI! 🔥`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isGoalAchieved = stats.totalReps >= settings.targetReps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header with celebration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Trophy className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {unlockedApp ? `${unlockedApp.name} Unlocked!` : 'Workout Complete!'}
                </h3>
                {isGoalAchieved && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>Goal Hit</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {unlockedApp
                  ? `Access granted for ${unlockedApp.unlockMinutes} minutes`
                  : 'AI biomechanical movement analysis'}
              </p>
            </div>
          </div>

          <button
            id="close-summary-modal-btn"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unlocked App Announcement Banner (if unlock workout) */}
        {unlockedApp && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <AppIcon
              iconName={unlockedApp.iconName}
              name={unlockedApp.name}
              color={unlockedApp.color}
              size="md"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Unlock className="w-3.5 h-3.5" />
                <span>Screen Time Unlocked</span>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {unlockedApp.name} is now accessible for {unlockedApp.unlockMinutes} minutes
              </p>
            </div>
          </div>
        )}

        {/* Hero Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200/80 text-center">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Total Reps</div>
            <div className="text-2xl font-black font-mono text-emerald-600 mt-0.5">
              {stats.totalReps}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200/80 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
              <Timer className="h-3 w-3 text-gray-400" />
              <span>Time</span>
            </div>
            <div className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {formatTime(stats.elapsedSeconds)}
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200/80 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
              <Gauge className="h-3 w-3 text-gray-400" />
              <span>Avg Pace</span>
            </div>
            <div className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {stats.avgPaceRpm}{' '}
              <span className="text-[10px] font-normal text-gray-500">RPM</span>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200/80 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Accuracy</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
              {stats.avgFormScore}%
            </div>
          </div>
        </div>

        {/* Biomechanical Quality Stats */}
        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Form Performance Details
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-gray-500">Avg Depth Angle</span>
              <span className="font-mono font-bold text-gray-900">{stats.avgDepthAngle}°</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-gray-500">Best Streak</span>
              <span className="font-mono font-bold text-emerald-600">{stats.bestStreak} reps</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-gray-500">Estimated Calories</span>
              <span className="font-mono font-bold text-gray-900">{stats.caloriesBurned} kcal</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-gray-500">Incomplete Reps</span>
              <span className="font-mono font-bold text-amber-600">{stats.invalidAttempts}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {unlockedApp && onOpenApp && (
            <button
              onClick={() => {
                triggerHaptic('success');
                onOpenApp(unlockedApp);
              }}
              className="w-full min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-sm font-black uppercase text-white hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
            >
              <Unlock className="h-4 w-4" />
              <span>Open {unlockedApp.name} Now</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              id="summary-restart-btn"
              onClick={() => {
                triggerHaptic('click');
                onRestart();
              }}
              className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-200 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start New Workout</span>
            </button>

            <button
              id="summary-share-btn"
              onClick={handleShare}
              className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl bg-gray-100 border border-gray-200 px-5 text-xs font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
