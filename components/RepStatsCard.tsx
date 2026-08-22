'use client';

import React from 'react';
import { Timer, Flame, Gauge, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { WorkoutStats, PushUpSettings } from '@/types/fitness';

interface RepStatsCardProps {
  stats: WorkoutStats;
  settings: PushUpSettings;
  phase: string;
}

export function RepStatsCard({ stats, settings }: RepStatsCardProps) {
  // Format elapsed time to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const target = settings.targetReps || 15;
  const progressPercent = Math.min(100, Math.round((stats.totalReps / target) * 100));

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Reps Bento Box */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
            Completed Reps
          </p>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800">
            {progressPercent}% TARGET
          </span>
        </div>

        {/* Big Bento Rep Numbers */}
        <div className="my-3 flex items-baseline gap-2">
          <span
            id="hero-rep-count"
            className="text-6xl sm:text-7xl font-black text-emerald-600 leading-none tracking-tight font-mono"
          >
            {stats.totalReps}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-gray-400 font-mono">
            / {target}
          </span>
        </div>

        {/* Bottom Sub-stats Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/70 px-3 py-2 rounded-xl">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">Valid Reps</div>
              <div className="text-sm font-black text-gray-900 font-mono">{stats.totalReps}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/70 px-3 py-2 rounded-xl">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase">No-Reps</div>
              <div className="text-sm font-black text-gray-900 font-mono">{stats.invalidAttempts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Bento Mini Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Timer Bento */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex flex-col justify-center items-center gap-0.5 shadow-xs text-center">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Timer className="h-3 w-3 text-gray-400" />
            <span>Timer</span>
          </div>
          <span className="text-lg sm:text-xl font-mono font-bold text-gray-900">
            {formatTime(stats.elapsedSeconds)}
          </span>
        </div>

        {/* Accuracy / Form Score Bento */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex flex-col justify-center items-center gap-0.5 shadow-xs text-center">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Zap className="h-3 w-3 text-emerald-600" />
            <span>Accuracy</span>
          </div>
          <span className="text-lg sm:text-xl font-mono font-bold text-emerald-600">
            {stats.avgFormScore}%
          </span>
        </div>

        {/* Pace RPM Bento */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex flex-col justify-center items-center gap-0.5 shadow-xs text-center">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Gauge className="h-3 w-3 text-gray-400" />
            <span>Pace</span>
          </div>
          <span className="text-lg sm:text-xl font-mono font-bold text-gray-900">
            {stats.avgPaceRpm}{' '}
            <span className="text-[10px] font-normal text-gray-500">RPM</span>
          </span>
        </div>

        {/* Calories Bento */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 flex flex-col justify-center items-center gap-0.5 shadow-xs text-center">
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            <Flame className="h-3 w-3 text-orange-500" />
            <span>Est. Burn</span>
          </div>
          <span className="text-lg sm:text-xl font-mono font-bold text-gray-900">
            {stats.caloriesBurned}{' '}
            <span className="text-[10px] font-normal text-gray-500">kcal</span>
          </span>
        </div>
      </div>
    </div>
  );
}
