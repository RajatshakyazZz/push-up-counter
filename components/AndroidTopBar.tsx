'use client';

import React from 'react';
import {
  Shield,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  HelpCircle,
  Video,
  Lock,
  Sparkles,
} from 'lucide-react';
import { PushUpSettings } from '@/types/fitness';
import { CameraDevice } from '@/hooks/usePoseDetector';
import { triggerHaptic } from '@/lib/haptics';

interface AndroidTopBarProps {
  settings: PushUpSettings;
  protectedAppsCount: number;
  cameras: CameraDevice[];
  selectedCameraId: string;
  onCameraChange: (deviceId: string) => void;
  onToggleSound: () => void;
  onToggleVoice: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
}

export function AndroidTopBar({
  settings,
  protectedAppsCount,
  cameras,
  selectedCameraId,
  onCameraChange,
  onToggleSound,
  onToggleVoice,
  onOpenGuide,
  onOpenSettings,
}: AndroidTopBarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20 text-white">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-gray-900 tracking-tight">
                PushLock<span className="text-emerald-600"> AI</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-black uppercase">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Protection Chip Badge (Middle / Desktop) */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>{protectedAppsCount} Protected Apps</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Multiple camera selector if available */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-700">
              <Video className="w-3.5 h-3.5 text-gray-500" />
              <select
                aria-label="Select Camera"
                value={selectedCameraId}
                onChange={(e) => onCameraChange(e.target.value)}
                className="bg-transparent text-xs text-gray-800 outline-none cursor-pointer max-w-[100px] truncate"
              >
                {cameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId} className="bg-white text-gray-900">
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              triggerHaptic('click');
              onToggleSound();
            }}
            title={settings.soundEffects ? 'Sound Enabled' : 'Sound Muted'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              settings.soundEffects
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            {settings.soundEffects ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Voice Coach Toggle */}
          <button
            onClick={() => {
              triggerHaptic('click');
              onToggleVoice();
            }}
            title={settings.voiceAnnounce ? 'Voice Coach Enabled' : 'Voice Coach Muted'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              settings.voiceAnnounce
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            {settings.voiceAnnounce ? (
              <Mic className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
          </button>

          {/* Guide Modal */}
          <button
            onClick={() => {
              triggerHaptic('click');
              onOpenGuide();
            }}
            title="Push-Up Form Guide"
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
