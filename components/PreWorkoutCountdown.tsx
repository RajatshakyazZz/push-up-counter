'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { playCountdownTick, speakCoachFeedback } from '@/lib/audio';
import { PushUpSettings } from '@/types/fitness';

interface PreWorkoutCountdownProps {
  isOpen: boolean;
  durationSeconds?: number;
  isPoseDetected: boolean;
  settings: PushUpSettings;
  onComplete: () => void;
  onCancel: () => void;
  onUpdateDuration?: (seconds: number) => void;
}

export function PreWorkoutCountdown({
  isOpen,
  durationSeconds = 5,
  isPoseDetected,
  settings,
  onComplete,
  onCancel,
  onUpdateDuration,
}: PreWorkoutCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const [isGo, setIsGo] = useState<boolean>(false);

  // Initialize and run countdown when open
  useEffect(() => {
    if (!isOpen) return;

    // Reset countdown states at start of timer
    const startSec = durationSeconds;
    let currentSec = startSec;

    // Initial voice cue
    if (settings.voiceAnnounce) {
      speakCoachFeedback('Get ready into position', true);
    }
    if (settings.soundEffects) {
      playCountdownTick(false);
    }

    const timer = setInterval(() => {
      currentSec -= 1;

      if (currentSec > 0) {
        setSecondsRemaining(currentSec);
        if (settings.soundEffects) {
          playCountdownTick(false);
        }
        if (settings.voiceAnnounce && currentSec <= 3) {
          speakCoachFeedback(`${currentSec}`, true);
        }
      } else if (currentSec === 0) {
        setSecondsRemaining(0);
        setIsGo(true);
        if (settings.soundEffects) {
          playCountdownTick(true);
        }
        if (settings.voiceAnnounce) {
          speakCoachFeedback('Go!', true);
        }

        // Brief delay on GO before starting workout tracking
        setTimeout(() => {
          onComplete();
        }, 550);

        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isOpen, durationSeconds, onComplete, settings.soundEffects, settings.voiceAnnounce]);

  if (!isOpen) return null;

  // Calculate progress percentage
  const total = Math.max(1, durationSeconds);
  const progressFraction = Math.max(0, secondsRemaining) / total;
  const strokeDashoffset = 283 * (1 - progressFraction); // 2 * PI * 45 ≈ 282.74

  return (
    <div
      id="preworkout-countdown-overlay"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 text-center animate-in fade-in duration-200 select-none"
    >
      {/* Top Banner & Cancel Button */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-lime-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-lime-400">
            Pre-Workout Buffer
          </span>
        </div>

        <button
          id="cancel-countdown-btn"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg"
          title="Cancel and return"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Countdown Visual Hub */}
      <div className="relative flex flex-col items-center justify-center my-auto max-w-sm w-full space-y-4">
        {/* Animated Radial Ring & Big Counter */}
        <div className="relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48">
          {/* Background Glow */}
          <div className="absolute inset-0 rounded-full bg-lime-400/10 blur-2xl animate-pulse pointer-events-none" />

          {/* SVG Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-zinc-800/80"
            />
            {/* Animated Active Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={283}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="text-lime-400 transition-all duration-1000 ease-linear shadow-lg"
            />
          </svg>

          {/* Center Dynamic Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="popLayout">
              {isGo ? (
                <motion.div
                  key="go-label"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.15, opacity: 1 }}
                  exit={{ scale: 1.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-lime-400 font-mono drop-shadow-[0_0_25px_rgba(163,230,53,0.6)]">
                    GO!
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key={`sec-${secondsRemaining}`}
                  initial={{ scale: 0.6, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.25, opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                    {secondsRemaining}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Posture & Position Guide Cue */}
        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-1.5">
            <span>Get Into Plank Position</span>
            <Sparkles className="h-4 w-4 text-lime-400" />
          </h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Align wrists under shoulders, lock your arms straight, and brace your core.
          </p>
        </div>

        {/* Camera Pose Readiness Indicator */}
        <div className="w-full">
          {isPoseDetected ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-400/15 border border-lime-400/40 text-lime-400 text-xs font-bold shadow-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-400" />
              <span>Full Body Detected • Ready!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 animate-pulse" />
              <span>Step back so camera sees your full body</span>
            </div>
          )}
        </div>

        {/* Quick Buffer Duration Switcher */}
        {onUpdateDuration && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase text-zinc-500 mr-1 flex items-center gap-1">
              <Timer className="h-3 w-3" /> Buffer:
            </span>
            {[3, 5, 10].map((sec) => (
              <button
                key={sec}
                id={`countdown-duration-${sec}s`}
                onClick={() => {
                  onUpdateDuration(sec);
                  setSecondsRemaining(sec);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  durationSeconds === sec
                    ? 'bg-lime-400 text-black border border-lime-400'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions: Skip Buffer Button */}
      <div className="mt-auto pt-4 w-full max-w-xs flex items-center gap-3 pointer-events-auto">
        <button
          id="skip-countdown-btn"
          onClick={onComplete}
          className="w-full min-h-[46px] rounded-2xl bg-zinc-800 border border-zinc-700 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-zinc-700 active:scale-98 transition-all cursor-pointer shadow-lg"
        >
          <Play className="h-3.5 w-3.5 fill-current text-lime-400" />
          <span>I&apos;m In Position (Skip)</span>
        </button>
      </div>
    </div>
  );
}
