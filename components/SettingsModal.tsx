'use client';

import React from 'react';
import {
  X,
  Volume2,
  Mic,
  ShieldAlert,
  RotateCcw,
  Timer,
  Settings,
} from 'lucide-react';
import { PushUpSettings } from '@/types/fitness';
import { DEFAULT_SETTINGS } from '@/hooks/usePushUpTracker';
import { triggerHaptic } from '@/lib/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  settings: PushUpSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<PushUpSettings>) => void;
}

export function SettingsModal({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleResetDefaults = () => {
    triggerHaptic('click');
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">Workout Preferences</h3>
              <p className="text-xs text-gray-500">Audio cues, buffer timers, and strict mode</p>
            </div>
          </div>

          <button
            id="close-settings-modal-btn"
            onClick={() => {
              triggerHaptic('click');
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section: Controls & Audio */}
        <div className="space-y-3">

          {/* Voice Coach */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Mic className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Voice Coach</div>
                <div className="text-[11px] text-gray-500">Speaks verified rep counts</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceAnnounce}
              onChange={(e) => onUpdateSettings({ voiceAnnounce: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          {/* Sound FX */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Sound Effects</div>
                <div className="text-[11px] text-gray-500">Acoustic chimes on rep completion</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          {/* Strict Form Gate */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Strict Form Mode</div>
                <div className="text-[11px] text-gray-500">Reject reps if spine sags or bends</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.strictMode}
              onChange={(e) => onUpdateSettings({ strictMode: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            id="reset-defaults-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            id="save-settings-btn"
            onClick={() => {
              triggerHaptic('click');
              onClose();
            }}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black uppercase text-white hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
