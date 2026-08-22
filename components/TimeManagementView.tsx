'use client';

import React from 'react';
import {
  Timer,
  Dumbbell,
  Sparkles,
  Check,
  Zap,
  ArrowLeft,
  Clock,
  Flame,
  Shield,
} from 'lucide-react';
import { AppProtectionSettings } from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

interface TimeManagementViewProps {
  protectionSettings: AppProtectionSettings;
  onUpdateProtectionSettings: (newSettings: Partial<AppProtectionSettings>) => void;
  onBack: () => void;
}

const REWARD_OPTIONS = [
  { seconds: 15, label: '15 sec', subtitle: 'Strict Focus', desc: '15s per push-up' },
  { seconds: 30, label: '30 sec', subtitle: 'Moderate Discipline', desc: '30s per push-up' },
  { seconds: 60, label: '1 min', subtitle: 'Balanced (Standard)', desc: '1 min per push-up' },
  { seconds: 120, label: '2 min', subtitle: 'Generous Reward', desc: '2 min per push-up' },
  { seconds: 180, label: '3 min', subtitle: 'High Yield', desc: '3 min per push-up' },
  { seconds: 300, label: '5 min', subtitle: 'Power Bonus', desc: '5 min per push-up' },
];

export function TimeManagementView({
  protectionSettings,
  onUpdateProtectionSettings,
  onBack,
}: TimeManagementViewProps) {
  const currentReward = protectionSettings.rewardSecondsPerRep || 60;

  const handleSelectReward = (seconds: number) => {
    triggerHaptic('click');
    onUpdateProtectionSettings({ rewardSecondsPerRep: seconds });
  };

  const sampleReps = [10, 20, 30, 50];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('click');
              onBack();
            }}
            className="p-2.5 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Time Management
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                Reward Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Set how much screen time access you earn per verified push-up
            </p>
          </div>
        </div>
      </div>

      {/* Main Reward Selection Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                Push-Up Screen Time Reward
              </h2>
              <p className="text-xs text-gray-500">
                1 Push-up = {REWARD_OPTIONS.find((r) => r.seconds === currentReward)?.label || '1 min'} screen time
              </p>
            </div>
          </div>
        </div>

        {/* Reward Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REWARD_OPTIONS.map((opt) => {
            const isSelected = currentReward === opt.seconds;

            return (
              <button
                key={opt.seconds}
                onClick={() => handleSelectReward(opt.seconds)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-gray-50/80 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {opt.subtitle}
                  </span>
                  {isSelected && (
                    <span className="p-1 rounded-full bg-emerald-600 text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-lg font-black text-gray-900">
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    per push-up
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Reward Calculation Matrix Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-black text-gray-900">
            Earned Screen Time Calculator
          </h2>
        </div>

        <p className="text-xs text-gray-500">
          Based on your current rate of <span className="font-bold text-gray-800">{REWARD_OPTIONS.find((r) => r.seconds === currentReward)?.label} per rep</span>:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sampleReps.map((reps) => {
            const totalSec = reps * currentReward;
            const mins = Math.floor(totalSec / 60);
            const remainingSec = totalSec % 60;

            const timeStr = mins > 0
              ? `${mins} min${remainingSec > 0 ? ` ${remainingSec}s` : ''}`
              : `${remainingSec} sec`;

            return (
              <div key={reps} className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase">
                  {reps} Push-ups
                </div>
                <div className="text-xl font-black text-emerald-600 mt-1">
                  {timeStr}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Unlocked access
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistence Note */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
        <p>
          Your reward rate is saved in native Android storage and automatically applied to all protected apps unless customized individually.
        </p>
      </div>
    </div>
  );
}
