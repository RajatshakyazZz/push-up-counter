'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Camera,
  CameraOff,
  Maximize,
  Minimize,
  FlipHorizontal,
  Loader2,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { PushUpPhase, FormStatus, PushUpSettings, WorkoutStats } from '@/types/fitness';
import { PoseAnalysis } from '@/lib/pose-math';
import { PreWorkoutCountdown } from '@/components/PreWorkoutCountdown';
import { Flame, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  cameraAspect?: '9:16' | '16:9';
  isCountdownActive?: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleMirror: () => void;
  onToggleAspectRatio?: (aspect: '9:16' | '16:9') => void;
  onCountdownComplete?: () => void;
  onCountdownCancel?: () => void;
  onUpdateCountdownDuration?: (seconds: number) => void;
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
  cameraAspect = '9:16',
  isCountdownActive = false,
  onStartCamera,
  onStopCamera,
  onToggleMirror,
  onToggleAspectRatio,
  onCountdownComplete,
  onCountdownCancel,
  onUpdateCountdownDuration,
}: CameraFeedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle handler with 9:16 ratio switch
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    
    // Switch to 9:16 portrait aspect ratio for full-body view
    if (onToggleAspectRatio) {
      onToggleAspectRatio('9:16');
    }

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {
          // Fallback to simulated fullscreen in iframes/mobile
          setIsFullscreen((prev) => !prev);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {
          setIsFullscreen(false);
        });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const depth = analysis?.depthPercentage ?? 0;
  const isDepthTargetReached = depth >= 90;

  const is916 = cameraAspect === '9:16';

  const toggleAspect = () => {
    if (onToggleAspectRatio) {
      onToggleAspectRatio(is916 ? '16:9' : '9:16');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col w-full overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-black p-2 sm:p-4 flex items-center justify-center'
          : 'rounded-[2rem] border border-zinc-800 bg-zinc-900 p-2 sm:p-3 shadow-2xl group'
      }`}
    >
      {/* Inner Video & Canvas Bento Container */}
      <div
        className={`relative w-full overflow-hidden flex items-center justify-center border border-zinc-800/60 bg-zinc-950 transition-all duration-300 ${
          isFullscreen
            ? 'h-full max-h-screen aspect-[9/16] w-auto max-w-full rounded-2xl shadow-2xl'
            : is916
            ? 'aspect-[9/16] max-h-[75vh] sm:max-h-[80vh] w-full max-w-sm sm:max-w-md mx-auto rounded-[1.5rem]'
            : 'aspect-video sm:aspect-[16/10] lg:aspect-video w-full rounded-[1.5rem]'
        }`}
      >
        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none z-10" />

        {/* Hidden / Actual Video Element */}
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
          className="absolute inset-0 h-full w-full object-cover pointer-events-none z-10"
        />

        {/* Camera Inactive / Loading Placeholder */}
        {(!isCameraActive || isLoading) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 p-4 sm:p-6 text-center backdrop-blur-md">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/30">
                  <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Initializing Pose Engine...
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    Loading high-speed MediaPipe AI neural tracker into browser memory.
                  </p>
                </div>
              </div>
            ) : cameraError ? (
              <div className="flex flex-col items-center space-y-4 max-w-md px-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                  <CameraOff className="h-7 w-7" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="text-base font-bold text-white">Camera Access Notice</h3>
                  <p className="text-xs text-zinc-400">{cameraError}</p>
                </div>
                <button
                  id="retry-camera-btn"
                  onClick={onStartCamera}
                  className="mt-2 inline-flex items-center space-x-2 rounded-xl bg-lime-400 px-5 py-2.5 text-xs font-black uppercase text-black hover:bg-lime-300 transition-colors cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Retry Camera</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 max-w-sm px-3">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-zinc-900 border border-zinc-800 text-zinc-400 shadow-inner">
                  <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-lime-400" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">Camera Feed Ready</h3>
                  <p className="text-xs text-zinc-400">
                    Enable webcam for 9:16 full-body pose tracking and automatic rep counting.
                  </p>
                </div>
                <button
                  id="start-camera-cta-btn"
                  onClick={onStartCamera}
                  className="mt-2 inline-flex items-center space-x-2 rounded-2xl bg-lime-400 px-6 py-3.5 text-sm font-black uppercase tracking-tight text-black shadow-lg shadow-lime-400/20 hover:bg-lime-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="h-4 w-4 stroke-[2.5]" />
                  <span>Enable Camera</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Real-time Bento HUD Elements (Visible when camera is active) */}
        {isCameraActive && (
          <>
            {/* Top Left Badges */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-white/10 text-zinc-200">
                {fps > 0 ? `${fps} FPS` : '60 FPS'}
              </span>
              {analysis?.landmarksVisible ? (
                <span className="px-2.5 py-1 bg-lime-400 text-black rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-lime-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  Full Body
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                  Scanning...
                </span>
              )}
            </div>

            {/* Top Right Controls & Aspect Ratio Toggle */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 pointer-events-auto">
              {/* 9:16 vs 16:9 Aspect Ratio Pill Switcher */}
              <button
                id="aspect-ratio-toggle-btn"
                onClick={toggleAspect}
                title={is916 ? 'Switch to 16:9 Widescreen' : 'Switch to 9:16 Full Body Portrait'}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-bold text-lime-400 border border-lime-400/40 hover:bg-black/90 transition-all cursor-pointer shadow-md"
              >
                {is916 ? (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-lime-400" />
                    <span className="hidden xs:inline sm:inline">9:16 BODY</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-3.5 w-3.5 text-zinc-300" />
                    <span className="hidden xs:inline sm:inline">16:9 WIDE</span>
                  </>
                )}
              </button>

              {/* Mirror toggle */}
              <button
                id="camera-mirror-toggle"
                onClick={onToggleMirror}
                title="Mirror Video"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/80 border border-white/10 transition-colors cursor-pointer"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </button>

              {/* Fullscreen toggle (auto 9:16 mode) */}
              <button
                id="camera-fullscreen-toggle"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 9:16 Camera'}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white hover:bg-black/80 border border-white/10 transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize className="h-3.5 w-3.5 text-lime-400" />
                ) : (
                  <Maximize className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Turn off camera */}
              <button
                id="camera-stop-btn"
                onClick={onStopCamera}
                title="Turn off Camera"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 backdrop-blur-md text-red-400 hover:text-red-300 hover:bg-red-950/80 border border-red-500/30 transition-colors cursor-pointer"
              >
                <CameraOff className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Side Depth Meter Gauge (Left overlay) */}
            <div className="absolute left-3 sm:left-4 top-14 bottom-16 sm:bottom-20 z-20 flex flex-col items-center justify-between w-7 sm:w-8 pointer-events-none">
              <div className="flex flex-col items-center h-full w-full py-2 px-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-md">
                <span className="text-[7px] sm:text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">
                  Depth
                </span>
                
                {/* Vertical Bar Container */}
                <div className="relative flex-1 w-1.5 sm:w-2 my-1.5 sm:my-2 rounded-full bg-zinc-800/80 overflow-hidden flex flex-col justify-end">
                  {/* Target 90deg threshold indicator line */}
                  <div
                    className="absolute inset-x-0 top-[10%] h-[2px] bg-lime-400 z-10 shadow-sm shadow-lime-400"
                    title="Target Depth (90°)"
                  />
                  {/* Fill Level */}
                  <div
                    className={`w-full transition-all duration-75 rounded-full ${
                      isDepthTargetReached
                        ? 'bg-lime-400 shadow-sm shadow-lime-400'
                        : 'bg-zinc-400'
                    }`}
                    style={{ height: `${depth}%` }}
                  />
                </div>

                <span
                  className={`text-[8px] sm:text-[9px] font-mono font-bold ${
                    isDepthTargetReached ? 'text-lime-400' : 'text-zinc-400'
                  }`}
                >
                  {depth}%
                </span>
              </div>
            </div>

            {/* Real-time Angle Diagnostics Box (Top Right overlay) */}
            {settings.showAngles && analysis && analysis.landmarksVisible && (
              <div className="absolute right-3 sm:right-4 top-14 z-20 flex flex-col space-y-1.5 pointer-events-none">
                <div className="rounded-xl bg-black/75 border border-white/10 p-1.5 sm:p-2 text-right backdrop-blur-md min-w-[75px] sm:min-w-[90px]">
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    Elbow
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-black font-mono ${
                      analysis.elbowAngle <= settings.downAngleThreshold
                        ? 'text-lime-400'
                        : 'text-white'
                    }`}
                  >
                    {Math.round(analysis.elbowAngle)}°
                  </div>
                </div>

                <div className="rounded-xl bg-black/75 border border-white/10 p-1.5 sm:p-2 text-right backdrop-blur-md min-w-[75px] sm:min-w-[90px]">
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                    Plank
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-black font-mono ${
                      analysis.isBodyStraight ? 'text-lime-400' : 'text-amber-400'
                    }`}
                  >
                    {Math.round(analysis.bodyAngle)}°
                  </div>
                </div>
              </div>
            )}

            {/* In-Camera Floating Rep Counter HUD Badge (Ultra-Visible on Mobile while doing Pushups) */}
            <div className="absolute top-12 sm:top-14 inset-x-0 z-20 flex flex-col items-center pointer-events-none px-4">
              <div className="flex items-center gap-2 sm:gap-3 bg-zinc-950/85 border-2 border-lime-400/60 shadow-xl shadow-black/80 rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 py-1.5 sm:py-2.5 backdrop-blur-xl transition-all duration-150">
                {/* Giant Rep Number */}
                <div className="flex items-baseline gap-1">
                  <span
                    id="camera-hud-reps-count"
                    className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-lime-400 drop-shadow-[0_0_12px_rgba(163,230,53,0.4)]"
                  >
                    {stats?.totalReps ?? 0}
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {settings.targetReps > 0 ? `/ ${settings.targetReps} GOAL` : 'REPS'}
                  </span>
                </div>

                {/* Vertical Divider */}
                <div className="h-6 sm:h-8 w-px bg-zinc-700/80" />

                {/* Dynamic Live Phase Pill */}
                <div className="flex items-center gap-1.5">
                  {!analysis?.isPlankOrientation && analysis?.landmarksVisible ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                      <AlertTriangle className="h-3 w-3" />
                      Get in Plank
                    </span>
                  ) : phase === 'down' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-lime-400 text-black font-black text-[10px] sm:text-xs uppercase tracking-tight animate-bounce shadow-md shadow-lime-400/50">
                      ⚡ PUSH UP!
                    </span>
                  ) : phase === 'going_down' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                      ⬇ Lower ({depth}%)
                    </span>
                  ) : phase === 'going_up' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                      ⬆ Lock Out
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                      Ready
                    </span>
                  )}

                  {/* Streak Badge if > 1 */}
                  {(stats?.currentStreak ?? 0) > 1 && (
                    <span className="hidden xs:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] sm:text-[10px] font-bold">
                      <Flame className="h-2.5 w-2.5 fill-orange-400" />
                      {stats?.currentStreak}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Bento Overlay Bar with Live Coach Guidance */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex justify-between items-end pointer-events-none">
              <div className="max-w-[78%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                  <p className="text-zinc-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                    Live Coach
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/80 border border-white/10 backdrop-blur-md shadow-lg">
                  {formStatus === 'good_form' || formStatus === 'perfect_depth' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                    {feedbackMessage}
                  </h2>
                </div>
              </div>

              {/* Bento Equalizer Bars */}
              <div className="flex gap-1 h-6 sm:h-7 items-end">
                <div className={`w-1 rounded-full ${analysis?.landmarksVisible ? 'bg-lime-400 h-1/2 animate-pulse' : 'bg-zinc-700 h-1/3'}`} />
                <div className={`w-1 rounded-full ${analysis?.landmarksVisible ? 'bg-lime-400 h-3/4 animate-bounce' : 'bg-zinc-700 h-1/4'}`} />
                <div className={`w-1 rounded-full ${isDepthTargetReached ? 'bg-lime-400 h-full' : 'bg-zinc-700 h-1/2'}`} />
                <div className={`w-1 rounded-full ${analysis?.landmarksVisible ? 'bg-lime-400 h-2/3 animate-pulse' : 'bg-zinc-700 h-1/3'}`} />
                <div className={`w-1 rounded-full ${analysis?.landmarksVisible ? 'bg-lime-400 h-1/2' : 'bg-zinc-700 h-1/4'}`} />
              </div>
            </div>
          </>
        )}

        {/* Pre-Workout 5-Second Buffer Countdown Overlay */}
        <PreWorkoutCountdown
          isOpen={isCountdownActive}
          durationSeconds={settings.countdownSeconds || 5}
          isPoseDetected={!!analysis?.landmarksVisible}
          settings={settings}
          onComplete={() => onCountdownComplete?.()}
          onCancel={() => onCountdownCancel?.()}
          onUpdateDuration={(sec) => onUpdateCountdownDuration?.(sec)}
        />
      </div>
    </div>
  );
}

