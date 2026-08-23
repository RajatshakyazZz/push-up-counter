'use client';

import React, { useRef } from 'react';
import {
  Camera,
  CameraOff,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  VolumeX,
  ArrowLeft,
  Pause,
  Play,
  Check,
} from 'lucide-react';
import { PushUpPhase, FormStatus, PushUpSettings, WorkoutStats } from '@/types/fitness';
import { PoseAnalysis } from '@/lib/pose-math';
import { triggerHaptic } from '@/lib/haptics';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  isLoading: boolean;
  modelLoaded: boolean;
  cameraError: string | null;
  fps: number;
  phase: PushUpPhase;
  formStatus: FormStatus;
  feedbackMessage: string;
  analysis: PoseAnalysis | null;
  settings: PushUpSettings;
  stats?: WorkoutStats;
  unlockedAppName?: string;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleSound?: () => void;
  onBack?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onFinishWorkout?: () => void;
}

export function CameraFeed({
  videoRef,
  canvasRef,
  isCameraActive,
  isLoading,
  modelLoaded,
  cameraError,
  fps,
  phase,
  formStatus,
  feedbackMessage,
  analysis,
  settings,
  stats,
  unlockedAppName,
  onStartCamera,
  onStopCamera,
  onToggleSound,
  onBack,
  onPause,
  onResume,
  onFinishWorkout,
}: CameraFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const totalReps = stats?.totalReps ?? 0;
  const targetReps = settings.targetReps ?? 20;
  const isPaused = stats?.isPaused ?? false;
  const depth = analysis?.depthPercentage ?? 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col w-full h-full bg-black text-white overflow-hidden select-none"
    >
      {/* 1. TOP BAR */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 pt-6 sm:pt-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto">
        <button
          onClick={() => {
            triggerHaptic('click');
            if (onBack) onBack();
          }}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all active:scale-95 cursor-pointer border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            {unlockedAppName ? `Unlocking ${unlockedAppName}` : 'Push-Up Workout'}
          </span>
        </div>

        <button
          onClick={() => {
            triggerHaptic('click');
            if (onToggleSound) onToggleSound();
          }}
          className="p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all active:scale-95 cursor-pointer border border-white/10"
        >
          {settings.soundEffects ? (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-zinc-400" />
          )}
        </button>
      </div>

      {/* 2. BIG REPETITION COUNTER HUD (Visual Focus) */}
      <div className="absolute top-16 inset-x-0 z-30 flex flex-col items-center pointer-events-none px-4">
        <div className="flex flex-col items-center bg-black/60 backdrop-blur-md px-6 py-2.5 rounded-3xl border border-white/15 shadow-xl">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
            <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              {totalReps}
            </span>
            {targetReps > 0 && (
              <span className="text-xl sm:text-2xl font-bold text-zinc-400">
                / {targetReps}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400/90 mt-0.5">
            Push-ups
          </span>
        </div>
      </div>

      {/* 3. VIDEO FEED & CLEAN SKELETON CANVAS */}
      <div className="relative flex-1 w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none z-10" />

        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${
            settings.mirrorVideo ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Skeleton Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none z-10 opacity-90"
        />

        {/* Camera Inactive / Loading Placeholder */}
        {(!isCameraActive || isLoading) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center backdrop-blur-md">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                <p className="text-sm font-bold text-white">Starting Pose AI Engine...</p>
              </div>
            ) : cameraError ? (
              <div className="flex flex-col items-center space-y-3 max-w-xs">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30">
                  <CameraOff className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-white">Camera Permission Needed</p>
                <p className="text-xs text-zinc-400">{cameraError}</p>
                <button
                  onClick={onStartCamera}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Enable Camera
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3 max-w-xs">
                <div className="p-4 rounded-3xl bg-zinc-900 text-emerald-400 border border-zinc-800 shadow-inner">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="text-base font-bold text-white">Ready for Push-ups</p>
                <p className="text-xs text-zinc-400">Position your phone in front of you so your full body is visible.</p>
                <button
                  onClick={onStartCamera}
                  className="mt-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  Start Camera
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. SUBTLE FORM STATUS PILL (Directly above bottom bar) */}
      {isCameraActive && (
        <div className="absolute bottom-24 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
          {!analysis?.landmarksVisible ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
              <span>Step back so camera sees your body</span>
            </div>
          ) : !analysis?.isPositionValid ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-500/80 backdrop-blur-md text-xs font-bold text-white shadow-md">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {analysis?.orientation === 'vertical'
                  ? 'Get into plank position on the floor'
                  : 'Adjust posture — hands on floor'}
              </span>
            </div>
          ) : phase === 'down' ? (
            <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-emerald-500 text-white text-sm font-black uppercase tracking-wide animate-bounce shadow-lg shadow-emerald-500/50">
              ⚡ PUSH UP!
            </div>
          ) : phase === 'going_down' ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/80 backdrop-blur-md text-xs font-bold text-white">
              <span>⬇ Lower chest ({depth}%)</span>
            </div>
          ) : phase === 'going_up' ? (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-500/80 backdrop-blur-md text-xs font-bold text-white">
              <span>⬆ Push all the way up</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Plank Locked • Ready</span>
            </div>
          )}
        </div>
      )}

      {/* 5. BOTTOM WORKOUT CONTROLS */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between gap-3 pointer-events-auto">
        <button
          onClick={() => {
            triggerHaptic('click');
            if (isPaused) {
              onResume?.();
            } else {
              onPause?.();
            }
          }}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-zinc-700/80 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic('success');
            onFinishWorkout?.();
          }}
          className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Finish Session</span>
        </button>
      </div>
    </div>
  );
}
