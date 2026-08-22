'use client';

import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  Timer,
  Save,
  Trash2,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react';
import { ProtectedApp, AppCategory } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface AppConfigModalProps {
  isOpen: boolean;
  app: ProtectedApp | null;
  isNewApp?: boolean;
  onClose: () => void;
  onSave: (app: ProtectedApp) => void;
  onDelete?: (packageName: string) => void;
}

const REPS_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];
const REWARD_OPTIONS = [
  { seconds: 15, label: '15 sec' },
  { seconds: 30, label: '30 sec' },
  { seconds: 60, label: '1 min' },
  { seconds: 120, label: '2 min' },
  { seconds: 180, label: '3 min' },
  { seconds: 300, label: '5 min' },
];

function AppConfigForm({
  app,
  isNewApp,
  onClose,
  onSave,
  onDelete,
}: {
  app: ProtectedApp | null;
  isNewApp: boolean;
  onClose: () => void;
  onSave: (app: ProtectedApp) => void;
  onDelete?: (packageName: string) => void;
}) {
  const [targetReps, setTargetReps] = useState(app?.targetReps || 20);
  const [rewardSeconds, setRewardSeconds] = useState(app?.rewardSecondsPerRep || 60);

  // Calculate total earned minutes
  const totalSeconds = targetReps * rewardSeconds;
  const calculatedMinutes = Math.max(1, Math.round(totalSeconds / 60));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    triggerHaptic('click');
    const updated: ProtectedApp = {
      ...app,
      targetReps,
      rewardSecondsPerRep: rewardSeconds,
      unlockMinutes: calculatedMinutes,
      isProtected: true,
    };
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (!app || !onDelete) return;
    triggerHaptic('click');
    onDelete(app.packageName);
    onClose();
  };

  if (!app) return null;

  return (
    <div
      className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-7"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
        <div className="flex items-center gap-3">
          <AppIcon
            iconName={app.iconName}
            name={app.name}
            color={app.color}
            iconDataUri={app.iconDataUri}
            size="md"
          />
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {app.name}
            </h2>
            <p className="text-xs text-gray-500">
              {app.isProtected ? 'Edit Push-Up Requirements' : 'Protect with Push-Ups'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            triggerHaptic('click');
            onClose();
          }}
          className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
        {/* 1. Required Push-ups */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-gray-700 uppercase">
                Required Push-ups
              </span>
            </div>
            <span className="text-base font-black text-emerald-600">
              {targetReps} reps
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {REPS_OPTIONS.map((reps) => (
              <button
                type="button"
                key={reps}
                onClick={() => {
                  triggerHaptic('click');
                  setTargetReps(reps);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  targetReps === reps
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {reps}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Reward Rate per Push-up */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-gray-700 uppercase">
                Reward per Push-up
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {REWARD_OPTIONS.find((r) => r.seconds === rewardSeconds)?.label} / rep
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {REWARD_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.seconds}
                onClick={() => {
                  triggerHaptic('click');
                  setRewardSeconds(opt.seconds);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  rewardSeconds === opt.seconds
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Mathematical Access Preview Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Total Screen Time Earned
            </div>
            <div className="text-sm text-emerald-800 mt-0.5">
              {targetReps} reps × {REWARD_OPTIONS.find((r) => r.seconds === rewardSeconds)?.label}
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700">
            = {calculatedMinutes} mins
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 mt-1">
          {app.isProtected && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-3.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              title="Remove Protection"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{app.isProtected ? 'Save Configuration' : 'Protect App'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function AppConfigModal({
  isOpen,
  app,
  isNewApp = false,
  onClose,
  onSave,
  onDelete,
}: AppConfigModalProps) {
  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <AppConfigForm
        key={app.packageName}
        app={app}
        isNewApp={isNewApp}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}
