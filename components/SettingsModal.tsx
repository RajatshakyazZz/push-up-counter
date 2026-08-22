'use client';

import React from 'react';
import {
  X,
  Sliders,
  Volume2,
  Mic,
  Eye,
  ShieldAlert,
  RotateCcw,
  Timer,
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
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">Push-Up Calibration</h3>
              <p className="text-xs text-gray-500">Biomechanical angle limits & HUD controls</p>
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

        {/* Section 1: Angle Calibration */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Biomechanical Thresholds
          </h4>

          {/* Up (Lockout) Angle */}
          <div className="space-y-2 rounded-2xl bg-gray-50 border border-gray-200/80 p-4">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-800">Top Position (Arm Lockout)</span>
              <span className="font-mono font-bold text-emerald-700">
                {settings.upAngleThreshold}°
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Elbow angle required to trigger start and completion of each rep (recommended: 152°).
            </p>
            <input
              type="range"
              min="140"
              max="170"
              step="1"
              value={settings.upAngleThreshold}
              onChange={(e) =>
                onUpdateSettings({ upAngleThreshold: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
            />
          </div>

          {/* Down (Depth) Angle */}
          <div className="space-y-2 rounded-2xl bg-gray-50 border border-gray-200/80 p-4">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-gray-800">Bottom Position (Target Depth)</span>
              <span className="font-mono font-bold text-emerald-700">
                {settings.downAngleThreshold}°
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Maximum elbow angle allowed for a valid chest-to-floor depth (recommended: 92°).
            </p>
            <input
              type="range"
              min="75"
              max="105"
              step="1"
              value={settings.downAngleThreshold}
              onChange={(e) =>
                onUpdateSettings({ downAngleThreshold: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
            />
          </div>
        </div>

        {/* Section 2: HUD & Feedback Toggles */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Audio & HUD Overlays
          </h4>

          <div className="space-y-2">
            {/* Countdown Buffer Timer */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Timer className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-gray-900">Pre-Workout Buffer</div>
                    <div className="text-[11px] text-gray-500">Delay to get into plank position</div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {settings.countdownSeconds === 0 ? 'Instant' : `${settings.countdownSeconds}s`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { value: 0, label: 'Off' },
                  { value: 3, label: '3 sec' },
                  { value: 5, label: '5 sec' },
                  { value: 10, label: '10 sec' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    id={`settings-countdown-${opt.value}`}
                    onClick={() => {
                      triggerHaptic('click');
                      onUpdateSettings({ countdownSeconds: opt.value });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      (settings.countdownSeconds ?? 5) === opt.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Announcement */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Mic className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Voice Coach</div>
                  <div className="text-[11px] text-gray-500">Speaks rep counts and coaching cues</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.voiceAnnounce}
                onChange={(e) => onUpdateSettings({ voiceAnnounce: e.target.checked })}
                className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>

            {/* Sound FX */}
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Sound Effects</div>
                  <div className="text-[11px] text-gray-500">Acoustic chimes on depth and lockout</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="h-4 w-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>
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
