'use client';

import React from 'react';
import {
  Calendar,
  Dumbbell,
  Timer,
  Flame,
  CheckCircle2,
  Trophy,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { WorkoutSessionLog } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';

interface HistoryViewProps {
  workoutHistory: WorkoutSessionLog[];
}

export function HistoryView({ workoutHistory }: HistoryViewProps) {
  const totalPushups = workoutHistory.reduce((sum, log) => sum + log.reps, 0);
  const totalCalories = workoutHistory.reduce((sum, log) => sum + log.caloriesBurned, 0);
  const totalUnlockEvents = workoutHistory.filter((l) => l.type === 'app_unlock').length;

  const groupedLogs: { [key: string]: WorkoutSessionLog[] } = {};
  workoutHistory.forEach((log) => {
    const key = log.date;
    if (!groupedLogs[key]) groupedLogs[key] = [];
    groupedLogs[key].push(log);
  });

  const getDayHeading = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
          Workout & Unlock History
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Track all AI-verified push-up sessions and unlocked app rewards
        </p>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-emerald-800">
              {totalPushups}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
              Total Push-ups
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-blue-800">
              {totalUnlockEvents}
            </div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mt-0.5">
              Apps Unlocked
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/80 border border-orange-200/60 text-center">
            <div className="text-xl sm:text-2xl font-black text-orange-800">
              {totalCalories}
            </div>
            <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mt-0.5">
              Calories Burned
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Logs */}
      {Object.keys(groupedLogs).length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center text-gray-500">
          <p className="font-semibold text-sm">No workout sessions logged yet</p>
        </div>
      ) : (
        Object.entries(groupedLogs).map(([dateStr, logs]) => (
          <div key={dateStr} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                {getDayHeading(dateStr)}
              </h2>
              <span className="text-xs text-gray-400 font-semibold">
                ({logs.reduce((sum, l) => sum + l.reps, 0)} reps total)
              </span>
            </div>

            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    {log.unlockedAppName ? (
                      <AppIcon
                        iconName={log.unlockedAppName.toLowerCase()}
                        name={log.unlockedAppName}
                        size="md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {log.unlockedAppName
                          ? `Unlocked ${log.unlockedAppName}`
                          : 'Free Push-Up Workout'}
                      </h3>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{log.durationSeconds} seconds</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">
                          {log.formAccuracy}% form score
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-emerald-600">
                      +{log.reps} Reps
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {log.caloriesBurned} kcal
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
