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
} from 'lucide-react';
import { ProtectedApp, AppCategory, UnlockSession } from '@/types/fitness';
import { AppIcon } from '@/components/AppIcon';
import { triggerHaptic } from '@/lib/haptics';

interface AppLockerViewProps {
  protectedApps: ProtectedApp[];
  activeSessions: UnlockSession[];
  onToggleProtection: (packageName: string, isProtected: boolean) => void;
  onOpenLockModal: (app: ProtectedApp) => void;
  onEditApp: (app: ProtectedApp) => void;
  onAddNewApp: () => void;
}

export function AppLockerView({
  protectedApps,
  activeSessions,
  onToggleProtection,
  onOpenLockModal,
  onEditApp,
  onAddNewApp,
}: AppLockerViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredApps = protectedApps.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All Apps' },
    { id: 'social', label: 'Social' },
    { id: 'entertainment', label: 'Entertainment' },
    { id: 'gaming', label: 'Games' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Protected Apps
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              {protectedApps.filter((a) => a.isProtected).length} Locked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Choose which distracting apps require verified push-ups to unlock
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('click');
            onAddNewApp();
          }}
          className="self-start sm:self-auto px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom App</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search protected apps..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('click');
                setSelectedCategory(cat.id);
              }}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apps List */}
      <div className="space-y-3">
        {filteredApps.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center text-gray-500">
            <p className="font-semibold text-sm">No apps found matching your search</p>
          </div>
        ) : (
          filteredApps.map((app) => {
            const isCurrentlyUnlocked = activeSessions.some(
              (s) => s.packageName === app.packageName
            );

            return (
              <div
                key={app.id}
                className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  app.isProtected
                    ? 'border-gray-200/90'
                    : 'border-gray-200/50 opacity-70 bg-gray-50/50'
                }`}
              >
                {/* Left App Details */}
                <div className="flex items-center gap-3.5">
                  <AppIcon
                    iconName={app.iconName}
                    name={app.name}
                    color={app.color}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
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
                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Dumbbell className="w-3.5 h-3.5" />
                        {app.targetReps} push-ups
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-blue-700 font-semibold">
                        <Timer className="w-3.5 h-3.5" />
                        {app.unlockMinutes} mins access
                      </span>
                      {app.timesUnlockedToday > 0 && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>Unlocked {app.timesUnlockedToday}x today</span>
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
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Simulate opening this app"
                  >
                    <Play className="w-3.5 h-3.5 fill-gray-700" />
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
          PushLock uses Android&apos;s <span className="font-semibold text-gray-800">Usage Access</span> and <span className="font-semibold text-gray-800">System Alert Window</span> permissions to intercept app launches instantly without draining your battery.
        </p>
      </div>
    </div>
  );
}
