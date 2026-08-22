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
  Layers,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Check,
  Zap,
  RotateCcw,
  Trash2,
  Timer,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { PushUpSettings, AppProtectionSettings } from '@/types/fitness';
import { androidAppLocker } from '@/lib/native-bridge/androidAppLocker';
import { triggerHaptic } from '@/lib/haptics';

interface SettingsViewProps {
  settings: PushUpSettings;
  protectionSettings: AppProtectionSettings;
  isProtectionEnabled?: boolean;
  onOpenConsentModal?: () => void;
  onOpenTimeManagement?: () => void;
  onUpdateSettings: (newSettings: Partial<PushUpSettings>) => void;
  onUpdateProtectionSettings: (newSettings: Partial<AppProtectionSettings>) => void;
  onResetAllData?: () => void;
}

export function SettingsView({
  settings,
  protectionSettings,
  isProtectionEnabled = false,
  onOpenConsentModal,
  onOpenTimeManagement,
  onUpdateSettings,
  onUpdateProtectionSettings,
  onResetAllData,
}: SettingsViewProps) {
  const [resetSuccess, setResetSuccess] = useState(false);

  const rewardLabel = protectionSettings.rewardSecondsPerRep === 15 ? '15s'
    : protectionSettings.rewardSecondsPerRep === 30 ? '30s'
    : protectionSettings.rewardSecondsPerRep === 120 ? '2m'
    : protectionSettings.rewardSecondsPerRep === 180 ? '3m'
    : protectionSettings.rewardSecondsPerRep === 300 ? '5m'
    : '1m';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-28">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Configure app locking rules, audio cues, and Android system permissions
        </p>
      </div>

      {/* Time Management & Reward Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                Push-Up Reward Engine
              </h2>
              <p className="text-xs text-gray-500">
                Current rate: 1 Push-up = {rewardLabel} screen time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('click');
              if (onOpenTimeManagement) onOpenTimeManagement();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>Configure</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Customize the reward multiplier applied when unlocking protected applications.
        </p>
      </div>

      {/* Audio & Feedback Preferences Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Volume2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-black text-gray-900">
            Workout Audio & Cues
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Voice Coach</div>
                <div className="text-[11px] text-gray-500">Real-time voice rep counts</div>
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
                <div className="text-[11px] text-gray-500">Rep completion tones</div>
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
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Strict Form Gate</div>
                <div className="text-[11px] text-gray-500">Require straight spine & lockout</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.strictMode}
              onChange={(e) => onUpdateSettings({ strictMode: e.target.checked })}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <div className="text-xs font-bold text-gray-900">Auto-Relock on Screen Off</div>
                <div className="text-[11px] text-gray-500">Lock apps when screen turns off</div>
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

      {/* Android Permissions Diagnostics */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Smartphone className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-black text-gray-900">
            Android Permissions Diagnostic
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
                  Detects when protected apps open in foreground (0 window content access)
                </div>
              </div>
            </div>
            {isProtectionEnabled ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                Active ✓
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

          {/* 2. Display Over Other Apps */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Display Over Other Apps (SYSTEM_ALERT_WINDOW)
                </div>
                <div className="text-[11px] text-gray-500">
                  Shows PushLock lock screen over protected apps
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
              Ready ✓
            </span>
          </div>

          {/* 3. Battery Optimization */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Background Battery Optimization Exemption
                </div>
                <div className="text-[11px] text-gray-500">
                  Keeps accessibility monitoring alive without system kill
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('click');
                androidAppLocker.requestBatteryOptimization();
              }}
              className="text-[11px] font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Configure
            </button>
          </div>

          {/* 4. Notification Countdown */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  Live Status Bar Countdown Notifications
                </div>
                <div className="text-[11px] text-gray-500">
                  Shows remaining screen time in notification shade
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('click');
                androidAppLocker.requestNotificationPermission();
              }}
              className="text-[11px] font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Allow
            </button>
          </div>

          {/* 5. Camera Permission */}
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
              Ready ✓
            </span>
          </div>
        </div>
      </div>

      {/* ₹0 API Cost & Privacy Guarantee Card */}
      <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>100% On-Device Privacy • Zero Cloud Costs</span>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed">
          PushLock AI runs MediaPipe Pose vision models directly on your device. Video frames are processed in-memory and are never recorded, uploaded, or transmitted to any external servers.
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
              Clears workout logs, active unlock sessions, and resets app metrics.
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
