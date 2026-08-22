'use client';

import React, { useState, useEffect } from 'react';
import { Timer, Lock, RefreshCw } from 'lucide-react';
import { UnlockSession, ProtectedApp } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface ActiveTimersCardProps {
  sessions: UnlockSession[];
  protectedApps: ProtectedApp[];
  onRelock: (packageName: string) => void;
  onExtend: (app: ProtectedApp) => void;
}

export function ActiveTimersCard({
  sessions,
  protectedApps,
  onRelock,
  onExtend,
}: ActiveTimersCardProps) {
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-xs shadow-emerald-500/5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            Active App Unlocks ({sessions.length})
          </h2>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Earned Access
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sessions.map((session) => {
          const app = protectedApps.find((a) => a.packageName === session.packageName);
          const totalMs = session.durationMinutes * 60 * 1000;
          const remainingMs = Math.max(0, session.expiresAt - currentTime);
          const remainingSeconds = Math.floor(remainingMs / 1000);

          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          const progressPercent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

          const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

          return (
            <div
              key={session.packageName}
              className="relative p-4 rounded-2xl bg-gray-50 border border-gray-200/70 overflow-hidden flex flex-col justify-between"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <AppIcon
                    iconName={app?.iconName || 'shield'}
                    name={session.appName}
                    color={app?.color}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                      {session.appName}
                    </h3>
                    <div className="text-[11px] text-gray-500">
                      Earned with {session.repsCompleted} push-ups
                    </div>
                  </div>
                </div>

                {/* Time Remaining Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-emerald-300 shadow-xs">
                  <Timer className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-xs font-mono font-black text-emerald-700">
                    {formattedTime}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 text-xs">
                <button
                  onClick={() => {
                    triggerHaptic('click');
                    if (app) onExtend(app);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Extend (+Pushups)</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('lock');
                    onRelock(session.packageName);
                  }}
                  className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
