'use client';

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Target,
  Dumbbell,
  Check,
} from 'lucide-react';
import { WorkoutStats, PushUpSettings } from '@/types/fitness';
import { triggerHaptic } from '@/lib/haptics';

interface WorkoutControlsProps {
  stats: WorkoutStats;
  settings: PushUpSettings;
  isCameraActive: boolean;
  isCountdownActive?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onFinishWorkout: () => void;
  onUpdateSettings: (newSettings: Partial<PushUpSettings>) => void;
}

const TARGET_PRESETS = [5, 10, 15, 20, 25, 30, 50];

export function WorkoutControls({
  stats,
  settings,
  isCountdownActive = false,
  onStart,
  onPause,
  onResume,
  onReset,
  onFinishWorkout,
  onUpdateSettings,
}: WorkoutControlsProps) {
  const target = settings.targetReps || 15;
  const progressPercent = Math.min(100, Math.round((stats.totalReps / target) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Session Progress & Controls Bento Box */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 flex flex-col gap-5 shadow-xs">
        {/* Progress Header & Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Workout Progress
            </p>
            <p className="text-xs font-bold text-gray-900 font-mono">
              {progressPercent}% Complete
            </p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60 p-[1px]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isCountdownActive ? (
            <button
              id="countdown-active-btn"
              onClick={() => {
                triggerHaptic('click');
                onStart();
              }}
              className="flex-1 min-h-[52px] bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-center gap-2.5 text-emerald-700 font-black uppercase tracking-tight text-sm animate-pulse transition-all cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Getting into position...</span>
            </button>
          ) : !stats.isActive ? (
            <button
              id="start-workout-btn"
              onClick={() => {
                triggerHaptic('click');
                onStart();
              }}
              className="flex-1 min-h-[52px] bg-emerald-600 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Workout</span>
            </button>
          ) : stats.isPaused ? (
            <button
              id="resume-workout-btn"
              onClick={() => {
                triggerHaptic('click');
                onResume();
              }}
              className="flex-1 min-h-[52px] bg-emerald-600 rounded-2xl flex items-center justify-center gap-2.5 text-white font-bold text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              id="pause-workout-btn"
              onClick={() => {
                triggerHaptic('click');
                onPause();
              }}
              className="flex-1 min-h-[52px] bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center gap-2.5 text-gray-800 font-bold text-base transition-all cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-gray-800" />
              <span>Pause</span>
            </button>
          )}

          {/* Finish & View Results (if active) */}
          {stats.isActive && stats.totalReps > 0 && (
            <button
              id="finish-workout-btn"
              onClick={() => {
                triggerHaptic('success');
                onFinishWorkout();
              }}
              className="h-[52px] px-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-all cursor-pointer"
            >
              <Flag className="h-4 w-4 text-emerald-600" />
              <span>Finish</span>
            </button>
          )}

          {/* Reset */}
          <button
            id="reset-workout-btn"
            onClick={() => {
              triggerHaptic('click');
              onReset();
            }}
            title="Reset Workout Stats"
            className="w-[52px] h-[52px] bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Target Reps Selector */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-gray-600 font-bold uppercase tracking-wider">
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              <span>Rep Target</span>
            </span>
            <span className="font-mono font-bold text-emerald-700">{settings.targetReps} reps</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TARGET_PRESETS.map((count) => {
              const isSelected = settings.targetReps === count;
              return (
                <button
                  key={count}
                  id={`target-preset-${count}`}
                  onClick={() => {
                    triggerHaptic('click');
                    onUpdateSettings({ targetReps: count });
                  }}
                  className={`flex-1 min-w-[38px] py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>

        {/* Variant Selector */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-bold uppercase tracking-wider">
            <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
            <span>Exercise Variant</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'standard', label: 'Standard' },
                { id: 'knee', label: 'Knee' },
                { id: 'incline', label: 'Incline' },
              ] as const
            ).map((variant) => {
              const isSelected = settings.pushUpVariant === variant.id;
              return (
                <button
                  key={variant.id}
                  id={`variant-${variant.id}`}
                  onClick={() => {
                    triggerHaptic('click');
                    onUpdateSettings({ pushUpVariant: variant.id });
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-black shadow-xs'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />}
                  <span>{variant.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
