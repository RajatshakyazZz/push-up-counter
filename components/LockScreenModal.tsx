'use client';

import React from 'react';
import {
  Lock,
  Dumbbell,
  Timer,
  X,
  Sparkles,
  Play,
} from 'lucide-react';
import { ProtectedApp } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface LockScreenModalProps {
  isOpen: boolean;
  app: ProtectedApp | null;
  onClose: () => void;
  onStartUnlockWorkout: (app: ProtectedApp) => void;
}

export function LockScreenModal({
  isOpen,
  app,
  onClose,
  onStartUnlockWorkout,
}: LockScreenModalProps) {
  const iconDataUri = React.useMemo(() => {
    if (app?.iconDataUri) return app.iconDataUri;
    if (typeof window !== 'undefined' && app?.packageName) {
      try {
        const cachedRaw = localStorage.getItem('pushlock_installed_apps_cache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const found = cached.find((a: { packageName: string; iconDataUri?: string }) => a.packageName === app.packageName);
          if (found?.iconDataUri) return found.iconDataUri;
        }
      } catch {}
    }
    return undefined;
  }, [app]);

  if (!isOpen || !app) return null;

  const handleStartWorkout = () => {
    triggerHaptic('click');
    onStartUnlockWorkout(app);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-8 text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Stay Focused / Close"
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
              iconDataUri={iconDataUri}
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
          {app.name} is Locked
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto mb-6 leading-relaxed">
          Do push-ups to earn screen time. Each push-up you do gives you <span className="font-bold text-emerald-600">1 minute</span> of unlocked app access.
        </p>

        {/* Push-up Goal & Time Bento Card */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 mb-6 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rate</div>
              <div className="text-base font-black text-emerald-700">
                1 Push-up
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reward</div>
              <div className="text-base font-black text-blue-700">
                = 1 Min Access
              </div>
            </div>
          </div>
        </div>

        {/* AI Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 mb-6">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Real-time MediaPipe AI verifies form • Do as many reps as you want</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            id="start-unlock-pushups-btn"
            onClick={handleStartWorkout}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Start Push-ups to Unlock</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Stay Focused / Close
          </button>
        </div>
      </div>
    </div>
  );
}
