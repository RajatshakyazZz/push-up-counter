'use client';

import React, { useState } from 'react';
import {
  X,
  Dumbbell,
  Timer,
  Save,
  Trash2,
  Lock,
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

const PRESET_REPS = [5, 10, 15, 20, 25, 30, 40, 50];
const PRESET_MINUTES = [5, 10, 15, 20, 30, 45, 60];

interface AppConfigFormProps {
  app: ProtectedApp | null;
  isNewApp: boolean;
  onClose: () => void;
  onSave: (app: ProtectedApp) => void;
  onDelete?: (packageName: string) => void;
}

function AppConfigForm({
  app,
  isNewApp,
  onClose,
  onSave,
  onDelete,
}: AppConfigFormProps) {
  const [name, setName] = useState(app?.name || '');
  const [packageName, setPackageName] = useState(app?.packageName || '');
  const [category, setCategory] = useState<AppCategory>(app?.category || 'social');
  const [targetReps, setTargetReps] = useState(app?.targetReps || 20);
  const [unlockMinutes, setUnlockMinutes] = useState(app?.unlockMinutes || 15);
  const [color] = useState(app?.color || '#16A34A');
  const [iconName] = useState(app?.iconName || 'shield');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !packageName.trim()) return;

    triggerHaptic('click');
    const updated: ProtectedApp = {
      id: app?.id || `app-${Date.now()}`,
      packageName: packageName.trim(),
      name: name.trim(),
      category,
      iconName,
      color,
      targetReps: Math.max(5, targetReps),
      unlockMinutes: Math.max(1, unlockMinutes),
      isProtected: app ? app.isProtected : true,
      timesUnlockedToday: app?.timesUnlockedToday || 0,
      totalUnlocks: app?.totalUnlocks || 0,
      lastUnlockedAt: app?.lastUnlockedAt || null,
    };
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (!app || !onDelete) return;
    if (confirm(`Remove protection for ${app.name}?`)) {
      triggerHaptic('click');
      onDelete(app.packageName);
      onClose();
    }
  };

  return (
    <div
      className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col p-6 sm:p-7"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
        <div className="flex items-center gap-3">
          <AppIcon
            iconName={iconName}
            name={name || 'App'}
            color={color}
            size="md"
          />
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {isNewApp ? 'Add Protected App' : `Configure ${name}`}
            </h2>
            <p className="text-xs text-gray-500">
              {isNewApp ? 'Set push-up cost and unlock duration' : 'Customize unlock requirements'}
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
        {/* App Name & Package if new */}
        {isNewApp && (
          <>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                App Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. X, Threads, Discord"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Android Package Name
              </label>
              <input
                type="text"
                required
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. com.twitter.android"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['social', 'entertainment', 'gaming', 'productivity', 'custom'] as AppCategory[]).map(
                  (cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        triggerHaptic('click');
                        setCategory(cat);
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                        category === cat
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* Push-up Reps Target Slider & Presets */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
          <div className="flex items-center justify-between mb-2">
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

          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={targetReps}
            onChange={(e) => setTargetReps(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-3"
          />

          <div className="flex flex-wrap gap-1.5">
            {PRESET_REPS.map((reps) => (
              <button
                type="button"
                key={reps}
                onClick={() => {
                  triggerHaptic('click');
                  setTargetReps(reps);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

        {/* Unlock Duration Slider & Presets */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-gray-700 uppercase">
                Unlock Access Duration
              </span>
            </div>
            <span className="text-base font-black text-blue-600">
              {unlockMinutes} mins
            </span>
          </div>

          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={unlockMinutes}
            onChange={(e) => setUnlockMinutes(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-3"
          />

          <div className="flex flex-wrap gap-1.5">
            {PRESET_MINUTES.map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => {
                  triggerHaptic('click');
                  setUnlockMinutes(mins);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  unlockMinutes === mins
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 mt-2">
          {!isNewApp && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-3 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              title="Remove App"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isNewApp ? 'Protect App' : 'Save Changes'}</span>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <AppConfigForm
        key={app?.packageName || 'new-app'}
        app={app}
        isNewApp={isNewApp}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    </div>
  );
}
