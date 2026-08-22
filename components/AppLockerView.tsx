'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  Sliders,
  Play,
  Lock,
  Unlock,
  Dumbbell,
  Timer,
  Check,
  Settings2,
  Info,
  AlertTriangle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ProtectedApp, InstalledApp, UnlockSession } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface AppLockerViewProps {
  protectedApps: ProtectedApp[];
  installedApps: InstalledApp[];
  activeSessions: UnlockSession[];
  isProtectionEnabled: boolean;
  onOpenConsentModal: () => void;
  onToggleProtection: (packageName: string, isProtected: boolean) => void;
  onOpenLockModal: (app: ProtectedApp) => void;
  onEditApp: (app: ProtectedApp) => void;
  onAddNewApp: () => void;
  onProtectInstalledApp: (installedApp: InstalledApp) => void;
}

export function AppLockerView({
  protectedApps,
  installedApps,
  activeSessions,
  isProtectionEnabled,
  onOpenConsentModal,
  onToggleProtection,
  onOpenLockModal,
  onEditApp,
  onAddNewApp,
  onProtectInstalledApp,
}: AppLockerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'protected' | 'all'>('protected');

  // Merge installed apps with protected configuration
  const allInstalledMap = new Map<string, InstalledApp>();
  installedApps.forEach((app) => allInstalledMap.set(app.packageName, app));

  const displayApps = (viewMode === 'protected' ? protectedApps : (
    installedApps.length > 0 ? installedApps.map((inst) => {
      const existing = protectedApps.find((p) => p.packageName === inst.packageName);
      if (existing) return existing;
      return {
        id: `installed-${inst.packageName}`,
        packageName: inst.packageName,
        name: inst.name,
        category: inst.category,
        iconName: inst.iconName,
        color: inst.color,
        iconDataUri: inst.iconDataUri,
        targetReps: 20,
        unlockMinutes: 15,
        isProtected: false,
        timesUnlockedToday: 0,
        totalUnlocks: 0,
        lastUnlockedAt: null,
      } as ProtectedApp;
    }) : protectedApps
  )).filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'social', label: 'Social' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'gaming', label: 'Games' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-24">
      {/* Accessibility Service Status Banner */}
      {!isProtectionEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                App Protection is Inactive
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Enable Android Accessibility Service so PushLock can intercept locked apps.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('click');
              onOpenConsentModal();
            }}
            className="self-stretch sm:self-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <span>Enable Protection</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              App Locker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              {protectedApps.filter((a) => a.isProtected).length} Locked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Choose installed Android apps that require verified push-ups to unlock
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              triggerHaptic('click');
              onAddNewApp();
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add App</span>
          </button>
        </div>
      </div>

      {/* View Mode Toggle & Search */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          {/* View Mode Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => {
                triggerHaptic('click');
                setViewMode('protected');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'protected'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Protected ({protectedApps.filter((a) => a.isProtected).length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('click');
                setViewMode('all');
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Installed Apps {installedApps.length > 0 ? `(${installedApps.length})` : ''}
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps by name or package..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic('click');
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Apps List */}
      <div className="space-y-2.5">
        {displayApps.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center text-gray-500">
            <p className="font-semibold text-sm">No apps found matching your search</p>
          </div>
        ) : (
          displayApps.map((app) => {
            const isCurrentlyUnlocked = activeSessions.some(
              (s) => s.packageName === app.packageName
            );
            const installedInfo = allInstalledMap.get(app.packageName);
            const iconUri = app.iconDataUri || installedInfo?.iconDataUri;

            return (
              <div
                key={app.packageName}
                className={`bg-white rounded-3xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  app.isProtected
                    ? 'border-gray-200/90'
                    : 'border-gray-200/50 opacity-75 bg-gray-50/50'
                }`}
              >
                {/* Left App Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <AppIcon
                    iconName={app.iconName}
                    name={app.name}
                    color={app.color}
                    iconDataUri={iconUri}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {app.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider">
                        {app.category}
                      </span>
                      {isCurrentlyUnlocked && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase flex items-center gap-1">
                          <Unlock className="w-2.5 h-2.5" />
                          Unlocked
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2.5 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Dumbbell className="w-3.5 h-3.5" />
                        {app.targetReps} reps
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-blue-700 font-semibold">
                        <Timer className="w-3.5 h-3.5" />
                        {app.unlockMinutes}m access
                      </span>
                      {app.timesUnlockedToday > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{app.timesUnlockedToday}x today</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Test Lock Simulator Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('click');
                      onOpenLockModal(app);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Simulate opening this app"
                  >
                    <Play className="w-3 h-3 fill-gray-700" />
                    <span>Test Lock</span>
                  </button>

                  {/* Configure App Button */}
                  <button
                    onClick={() => {
                      triggerHaptic('click');
                      onEditApp(app);
                    }}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Edit Push-Up Target and Duration"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>

                  {/* Toggle Protection Switch */}
                  <label className="relative inline-flex items-center cursor-pointer ml-1">
                    <input
                      type="checkbox"
                      checked={app.isProtected}
                      onChange={(e) => onToggleProtection(app.packageName, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Android System Note */}
      <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200/80 text-gray-600 text-xs flex items-center gap-3">
        <Info className="w-5 h-5 text-gray-500 shrink-0" />
        <p>
          PushLock AI monitors foreground app switches via Android&apos;s <span className="font-semibold text-gray-800">Accessibility Service</span> to immediately enforce your workout targets without battery drain.
        </p>
      </div>
    </div>
  );
}
