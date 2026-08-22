'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Dumbbell,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Smartphone,
  Eye,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sliders,
  Check,
  Server,
  Zap,
  RotateCcw,
  Trash2,
  Bug,
  ShieldCheck,
} from 'lucide-react';
import { PushUpSettings, AppProtectionSettings } from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

interface SettingsViewProps {
  settings: PushUpSettings;
  protectionSettings: AppProtectionSettings;
  isProtectionEnabled?: boolean;
  onOpenConsentModal?: () => void;
  onUpdateSettings: (newSettings: Partial<PushUpSettings>) => void;
  onUpdateProtectionSettings: (newSettings: Partial<AppProtectionSettings>) => void;
  onResetAllData?: () => void;
}

export function SettingsView({
  settings,
  protectionSettings,
  isProtectionEnabled = false,
  onOpenConsentModal,
  onUpdateSettings,
  onUpdateProtectionSettings,
  onResetAllData,
}: SettingsViewProps) {
  const [resetSuccess, setResetSuccess] = useState(false);
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
          Settings & Android Bridge
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Configure AI pose estimation, app lock rules, and Android permissions
        </p>
      </div>

      {/* Push-Up Detection Calibration Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Dumbbell className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-black text-gray-900">
            Push-Up AI Calibration
          </h2>
        </div>

        {/* Down Depth Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Chest Depth (Bottom Elbow Angle)</span>
            <span className="text-emerald-700 font-mono">{settings.downAngleThreshold}°</span>
          </div>
          <p className="text-xs text-gray-500">
            Lower angle requires deeper chest-to-floor descent (90° recommended).
          </p>
          <input
            type="range"
            min="75"
            max="110"
            step="1"
            value={settings.downAngleThreshold}
            onChange={(e) => onUpdateSettings({ downAngleThreshold: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Up Lockout Threshold */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Top Lockout (Arm Extension)</span>
            <span className="text-emerald-700 font-mono">{settings.upAngleThreshold}°</span>
          </div>
          <p className="text-xs text-gray-500">
            Angle required at the top of rep to confirm complete arm lockout.
          </p>
          <input
            type="range"
            min="140"
            max="165"
            step="1"
            value={settings.upAngleThreshold}
            onChange={(e) => onUpdateSettings({ upAngleThreshold: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        {/* Pre-Workout Countdown Buffer */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Pre-Workout Countdown Buffer</span>
            <span className="text-emerald-700 font-mono">
              {settings.countdownSeconds > 0 ? `${settings.countdownSeconds}s` : 'Off'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Buffer time to place phone on floor and get into plank position before workout begins.
          </p>
          <div className="flex gap-2">
            {[0, 3, 5, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  triggerHaptic('click');
                  onUpdateSettings({ countdownSeconds: sec });
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.countdownSeconds === sec
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {sec === 0 ? 'No Buffer' : `${sec}s Buffer`}
              </button>
            ))}
          </div>
        </div>

        {/* Audio & Voice Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Voice Coach</div>
                <div className="text-[11px] text-gray-500">Real-time speech cues</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.voiceAnnounce}
              onChange={(e) => onUpdateSettings({ voiceAnnounce: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Sound Chimes</div>
                <div className="text-[11px] text-gray-500">Rep & lockout tones</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bug className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Developer Debug HUD</div>
                <div className="text-[11px] text-gray-500">Live angle & posture telemetry</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.debugMode}
              onChange={(e) => onUpdateSettings({ debugMode: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Strict Form Gate</div>
                <div className="text-[11px] text-gray-500">Require perfect spine alignment</div>
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
      </div>

      {/* App Protection Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-black text-gray-900">
            App Lock Protection Rules
          </h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-gray-900">Strict Lock Mode</div>
              <div className="text-xs text-gray-500">
                Immediately block app if workout is cancelled or incomplete
              </div>
            </div>
            <input
              type="checkbox"
              checked={protectionSettings.strictLockMode}
              onChange={(e) =>
                onUpdateProtectionSettings({ strictLockMode: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div>
              <div className="text-sm font-bold text-gray-900">Auto-Relock on Screen Off</div>
              <div className="text-xs text-gray-500">
                Automatically reset timers and lock apps when phone screen is turned off
              </div>
            </div>
            <input
              type="checkbox"
              checked={protectionSettings.autoRelockOnScreenOff}
              onChange={(e) =>
                onUpdateProtectionSettings({ autoRelockOnScreenOff: e.target.checked })
              }
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Android Permissions Checklist & Bridge Details */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Smartphone className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-black text-gray-900">
            Android Native Permissions Diagnostic
          </h2>
        </div>

        <div className="space-y-2.5">
          {/* 1. Accessibility Service */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              {isProtectionEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Accessibility App Protection Service
                </div>
                <div className="text-[11px] text-gray-500">
                  Detects when protected apps are opened in foreground (0ms latency, 0 window content reading)
                </div>
              </div>
            </div>
            {isProtectionEnabled ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                Active
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('click');
                  if (onOpenConsentModal) onOpenConsentModal();
                }}
                className="text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0"
              >
                Enable
              </button>
            )}
          </div>

          {/* 2. Camera Permission */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Camera (android.permission.CAMERA)
                </div>
                <div className="text-[11px] text-gray-500">
                  High-speed 60fps local GPU MediaPipe pose estimation
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              Ready
            </span>
          </div>

          {/* 3. Launcher App Inventory Visibility */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Launcher Package Visibility (CATEGORY_LAUNCHER)
                </div>
                <div className="text-[11px] text-gray-500">
                  Queries user-installed launchable apps without broad permissions
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* ₹0 API Cost & Privacy Guarantee Card */}
      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>₹0 Cloud Cost & 100% On-Device Privacy</span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          PushLock AI runs MediaPipe Pose vision models directly on your device. Video frames are processed in-memory and are never recorded, uploaded, or transmitted to any external servers. Zero recurring cloud costs.
        </p>
      </div>

      {/* Data Management & Reset Storage Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Trash2 className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-black text-gray-900">
            Storage & Data Management
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Reset All Data & App Stats</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Clears workout logs, active timers, and resets all app counters to 0.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onResetAllData) {
                onResetAllData();
                setResetSuccess(true);
                setTimeout(() => setResetSuccess(false), 2500);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent font-bold text-xs text-gray-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            {resetSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Data Cleared!</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reset All Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
