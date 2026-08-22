'use client';

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Lock,
  ExternalLink,
  X,
  CheckCircle2,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface AccessibilityConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnable: () => void;
}

export function AccessibilityConsentModal({
  isOpen,
  onClose,
  onConfirmEnable,
}: AccessibilityConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-7 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic('click');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">
              Enable App Protection
            </h2>
            <p className="text-xs text-gray-500">
              Android Accessibility Service Permission
            </p>
          </div>
        </div>

        {/* Core Disclosure Text */}
        <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-200/80 mb-5 leading-relaxed">
          <p className="font-semibold text-gray-800">
            PushLock AI uses Android&apos;s Accessibility Service solely to detect when one of the apps you choose to protect is opened in the foreground.
          </p>
          <p>
            This allows PushLock to immediately present your push-up workout goal before granting temporary screen time.
          </p>

          <div className="pt-2 border-t border-gray-200/70 space-y-1.5 font-medium">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Only inspects app package names you choose to lock</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <EyeOff className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero access to window content, text, passwords, or messages</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% on-device processing with zero data uploaded</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              triggerHaptic('success');
              onConfirmEnable();
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>I Understand & Want to Enable</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('click');
              onClose();
            }}
            className="w-full py-2.5 px-4 text-gray-500 hover:text-gray-800 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Not Now / Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
