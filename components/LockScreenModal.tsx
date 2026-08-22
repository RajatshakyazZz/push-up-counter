'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Dumbbell,
  Timer,
  X,
  Sparkles,
  Flame,
  ShieldAlert,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { ProtectedApp } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface LockScreenModalProps {
  isOpen: boolean;
  app: ProtectedApp | null;
  onClose: () => void;
  onStartUnlockWorkout: (app: ProtectedApp) => void;
  onInstantUnlockTest?: (app: ProtectedApp) => void;
}

export function LockScreenModal({
  isOpen,
  app,
  onClose,
  onStartUnlockWorkout,
  onInstantUnlockTest,
}: LockScreenModalProps) {
  if (!isOpen || !app) return null;

  const handleStartWorkout = () => {
    triggerHaptic('click');
    onStartUnlockWorkout(app);
  };

  const handleInstantUnlock = () => {
    triggerHaptic('success');
    if (onInstantUnlockTest) {
      onInstantUnlockTest(app);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Close / Stay Focused"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Shield Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>App Locked by PushLock</span>
          </div>
        </div>

        {/* App Icon Large */}
        <div className="flex justify-center mb-3">
          <div className="relative">
            <AppIcon
              iconName={app.iconName}
              name={app.name}
              color={app.color}
              iconDataUri={app.iconDataUri}
              size="xl"
              className="shadow-xl ring-4 ring-gray-50"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-red-500 rounded-full text-white shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* App Title & Subtitle */}
        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
          {app.name}
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
          Earn your screen time. Complete verified push-ups to unlock this app.
        </p>

        {/* Push-up Goal & Time Bento Card */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase">Target</div>
              <div className="text-lg font-black text-gray-900">
                {app.targetReps} <span className="text-xs font-normal text-gray-500">Reps</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase">Unlock For</div>
              <div className="text-lg font-black text-gray-900">
                {app.unlockMinutes} <span className="text-xs font-normal text-gray-500">Mins</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>MediaPipe AI validates chest depth & plank form</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="start-unlock-pushups-btn"
            onClick={handleStartWorkout}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Start {app.targetReps} Push-ups to Unlock</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm font-semibold transition-colors cursor-pointer"
          >
            Stay Focused / Close
          </button>
        </div>

        {/* Developer / Demo Instant Test Trigger */}
        {onInstantUnlockTest && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={handleInstantUnlock}
              className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Simulate instant push-up completion (Demo Test)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
