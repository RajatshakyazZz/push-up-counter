'use client';

import React from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sliders,
  HelpCircle,
  Video,
  Flame,
  Award,
} from 'lucide-react';
import { PushUpSettings, WorkoutStats } from '@/types/fitness';
import { CameraDevice } from '@/hooks/usePoseDetector';

interface NavbarProps {
  settings: PushUpSettings;
  stats: WorkoutStats;
  cameras: CameraDevice[];
  selectedCameraId: string;
  onCameraChange: (deviceId: string) => void;
  onToggleSound: () => void;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenSummary: () => void;
}

export function Navbar({
  settings,
  stats,
  cameras,
  selectedCameraId,
  onCameraChange,
  onToggleSound,
  onToggleVoice,
  onOpenSettings,
  onOpenGuide,
  onOpenSummary,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-lime-400 rounded-xl flex items-center justify-center shadow-lg shadow-lime-400/20">
            <Activity className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                FORM<span className="text-lime-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 bg-lime-400/10 text-lime-400 rounded-md text-[10px] font-bold uppercase tracking-wider border border-lime-400/20">
                POSE ENGINE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block font-medium">
              Real-time MediaPipe Push-Up Tracker
            </p>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="hidden md:flex items-center gap-3">
          {/* Active Engine Pill */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-300">
              Engine Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 border border-zinc-800 text-xs text-zinc-300">
            <Flame className="h-3.5 w-3.5 text-lime-400" />
            <span className="text-zinc-400">Target:</span>
            <span className="font-bold text-white font-mono">{settings.targetReps} reps</span>
          </div>

          {stats.totalReps > 0 && (
            <button
              id="navbar-summary-trigger"
              onClick={onOpenSummary}
              className="flex items-center gap-1.5 rounded-full bg-lime-400/10 px-3 py-1.5 border border-lime-400/30 text-xs text-lime-300 hover:bg-lime-400/20 transition-colors"
            >
              <Award className="h-3.5 w-3.5 text-lime-400" />
              <span>Score:</span>
              <span className="font-bold text-white font-mono">{stats.totalReps}</span>
            </button>
          )}

          {/* Camera switcher if multiple available */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 border border-zinc-800 text-xs text-zinc-300">
              <Video className="h-3.5 w-3.5 text-lime-400" />
              <select
                aria-label="Select Video Camera"
                value={selectedCameraId}
                onChange={(e) => onCameraChange(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer max-w-[120px] truncate"
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId} className="bg-zinc-900 text-white">
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={onToggleSound}
            title={settings.soundEffects ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              settings.soundEffects
                ? 'border-lime-400/40 bg-zinc-900 text-lime-400 hover:bg-zinc-850'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
            }`}
          >
            {settings.soundEffects ? (
              <Volume2 className="h-4 w-4 text-lime-400" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Voice Coach Toggle */}
          <button
            id="voice-toggle-btn"
            onClick={onToggleVoice}
            title={settings.voiceAnnounce ? 'Mute Voice Coach' : 'Enable Voice Coach'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
              settings.voiceAnnounce
                ? 'border-lime-400/40 bg-zinc-900 text-lime-400 hover:bg-zinc-850'
                : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:bg-zinc-850 hover:text-zinc-300'
            }`}
          >
            {settings.voiceAnnounce ? (
              <Mic className="h-4 w-4 text-lime-400" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </button>

          {/* Form Guide */}
          <button
            id="open-guide-btn"
            onClick={onOpenGuide}
            title="Form Guide & Tips"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Settings */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            title="Workout Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Sliders className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

