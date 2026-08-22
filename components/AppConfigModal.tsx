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
  const [isProtected, setIsProtected] = useState(app?.isProtected ?? true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    triggerHaptic('click');
    const updated: ProtectedApp = {
      ...app,
      targetReps: 0,
      rewardSecondsPerRep: 60,
      unlockMinutes: 1,
      isProtected,
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
              {app.isProtected ? 'Push-Up Lock Active' : 'Protect with Push-Ups'}
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

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Core Unlock Rule Bento Box */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              PushLock Unlock Rule
            </span>
          </div>
          <div className="text-base font-black text-emerald-800">
            1 Push-up = 1 Minute Screen Time
          </div>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            When this app is locked, opening it prompts you for push-ups. However many verified push-ups you do, that is exactly how many minutes the app stays unlocked!
          </p>
        </div>

        {/* Protection Switch */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className={`w-5 h-5 ${isProtected ? 'text-emerald-600' : 'text-gray-400'}`} />
            <div>
              <div className="text-xs font-bold text-gray-800">App Lock Protection</div>
              <div className="text-[11px] text-gray-500">
                {isProtected ? 'Active — app requires push-ups to open' : 'Disabled — app opens normally'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isProtected}
            onChange={(e) => {
              triggerHaptic('click');
              setIsProtected(e.target.checked);
            }}
            className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
          />
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
            <span>Save Protection Settings</span>
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
