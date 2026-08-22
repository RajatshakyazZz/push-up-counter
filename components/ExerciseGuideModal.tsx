'use client';

import React from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface ExerciseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExerciseGuideModal({ isOpen, onClose }: ExerciseGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-gray-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 tracking-tight">AI Setup & Form Guide</h3>
              <p className="text-xs text-gray-500">Biomechanical rules for 100% accurate rep counts</p>
            </div>
          </div>

          <button
            id="close-guide-modal-btn"
            onClick={() => {
              triggerHaptic('click');
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Camera Placement Tip */}
        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Camera className="h-4 w-4" />
            <span>1. Phone Placement on Floor</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Prop your phone against a water bottle or wall at <strong className="text-gray-900">floor level</strong>, roughly{' '}
            <strong className="text-gray-900">5 to 7 feet away</strong>.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-start gap-2 rounded-xl bg-white border border-gray-200 p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-gray-700 text-[11px]">
                <strong className="text-gray-900">Side profile (45°–90°)</strong> allows the AI to track elbow flexion & plank alignment.
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-white border border-gray-200 p-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-gray-700 text-[11px]">
                Avoid direct head-on angles where limbs overlap with your torso.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Biomechanics: The 3 Rules of a Rep */}
        <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Crosshair className="h-4 w-4" />
            <span>2. Repetition Phases</span>
          </div>

          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                1
              </span>
              <div>
                <strong className="text-gray-900">Top Lockout:</strong> Start with arms extended in a plank. Back and hips must stay aligned.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                2
              </span>
              <div>
                <strong className="text-gray-900">Chest Depth (≤92°):</strong> Lower until chest is close to floor. The audio chimes at bottom depth.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold">
                3
              </span>
              <div>
                <strong className="text-gray-900">Push to Full Extension:</strong> Push back up until arms lockout. Rep counter automatically registers.
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-1">
          <button
            id="guide-got-it-btn"
            onClick={() => {
              triggerHaptic('click');
              onClose();
            }}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 text-xs font-black uppercase text-white hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-emerald-600/20"
          >
            Got It, Let&apos;s Workout!
          </button>
        </div>
      </div>
    </div>
  );
}
