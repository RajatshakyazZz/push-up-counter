'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Layers,
  Accessibility,
  Zap,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import { PermissionCheckResult } from '@/types/fitness';
import { androidAppLocker } from '@/lib/native-bridge/androidAppLocker';
import { triggerHaptic } from '@/lib/haptics';

interface ProtectionSetupViewProps {
  onCompleteSetup: () => void;
}

export function ProtectionSetupView({ onCompleteSetup }: ProtectionSetupViewProps) {
  const [permissions, setPermissions] = useState<PermissionCheckResult>({
    camera: false,
    overlay: false,
    accessibility: false,
    isOemRequiringAutoStart: false,
    manufacturer: 'Android',
    allRequiredGranted: false,
  });
  const [isChecking, setIsChecking] = useState(true);

  const refreshPermissions = async () => {
    setIsChecking(true);
    try {
      const res = await androidAppLocker.checkAllPermissions();
      setPermissions(res);
    } catch (e) {
      console.error('Failed to check permissions:', e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    refreshPermissions();

    const handleFocus = () => {
      refreshPermissions();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(refreshPermissions, 2500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleRequestCamera = async () => {
    triggerHaptic('click');
    await androidAppLocker.requestCameraPermission();
    await refreshPermissions();
  };

  const handleRequestOverlay = async () => {
    triggerHaptic('click');
    await androidAppLocker.requestOverlayPermission();
  };

  const handleOpenAccessibility = async () => {
    triggerHaptic('click');
    await androidAppLocker.openProtectionSettings();
  };

  const handleOpenAutoStart = async () => {
    triggerHaptic('click');
    await androidAppLocker.openAutoStartSettings();
  };

  const handleContinue = () => {
    triggerHaptic('success');
    androidAppLocker.setOnboardingCompleted(true);
    onCompleteSetup();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      {/* Top Header Card */}
      <div className="space-y-4 pt-4 sm:pt-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Lock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
                Setup Protection
              </span>
              <Sparkles className="w-3 h-3 text-emerald-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Welcome to PushLock AI
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          To protect your apps and unlock them with exercise, PushLock requires standard Android device permissions. All processing is 100% on-device.
        </p>
      </div>

      {/* Permission Checklist */}
      <div className="space-y-3 my-6">
        {/* 1. Camera Permission */}
        <div className={`p-4 rounded-3xl border transition-all ${
          permissions.camera
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                permissions.camera ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">1. Camera</h3>
                  {permissions.camera && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required for real-time AI push-up counter
                </p>
              </div>
            </div>

            {permissions.camera ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                Enabled ✓
              </span>
            ) : (
              <button
                onClick={handleRequestCamera}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all active:scale-95"
              >
                Allow
              </button>
            )}
          </div>
        </div>

        {/* 2. Display Over Other Apps (Overlay) */}
        <div className={`p-4 rounded-3xl border transition-all ${
          permissions.overlay
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                permissions.overlay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">2. Display Over Other Apps</h3>
                  {permissions.overlay && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Required to show the lock screen over protected apps
                </p>
              </div>
            </div>

            {permissions.overlay ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                Enabled ✓
              </span>
            ) : (
              <button
                onClick={handleRequestOverlay}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>Allow</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Accessibility Service (Foreground App Protection) */}
        <div className={`p-4 rounded-3xl border transition-all ${
          permissions.accessibility
            ? 'bg-emerald-50/60 border-emerald-200'
            : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                permissions.accessibility ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
              }`}>
                <Accessibility className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">3. Accessibility App Protection</h3>
                  {permissions.accessibility && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Detects when protected apps open (0 window content access)
                </p>
              </div>
            </div>

            {permissions.accessibility ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl shrink-0">
                Enabled ✓
              </span>
            ) : (
              <button
                onClick={handleOpenAccessibility}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all active:scale-95 flex items-center gap-1"
              >
                <span>Enable</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 4. Background / AutoStart (Manufacturer Specific) */}
        <div className="p-4 rounded-3xl border bg-white border-gray-200 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-gray-100 text-gray-700 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">4. Background & AutoStart</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {permissions.isOemRequiringAutoStart
                    ? `Required on ${permissions.manufacturer} to prevent system kill`
                    : 'Your device does not require a separate AutoStart setting'}
                </p>
              </div>
            </div>

            {permissions.isOemRequiringAutoStart ? (
              <button
                onClick={handleOpenAutoStart}
                className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold shadow-xs cursor-pointer shrink-0 transition-all flex items-center gap-1"
              >
                <span>Configure</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl shrink-0">
                Ready ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Card */}
      <div className="space-y-3 pb-4">
        {permissions.allRequiredGranted ? (
          <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>All Required Permissions Ready! Protection Active ✓</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Complete permissions above to activate live app protection</span>
          </div>
        )}

        <button
          onClick={handleContinue}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
            permissions.allRequiredGranted
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 active:scale-[0.98]'
              : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-900/20 active:scale-[0.98]'
          }`}
        >
          <span>{permissions.allRequiredGranted ? 'Start Using PushLock AI' : 'Continue to Dashboard'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
