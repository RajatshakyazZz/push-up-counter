'use client';

import React from 'react';
import {
  Home,
  Shield,
  Dumbbell,
  History,
  Settings,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

export type ActiveTab = 'home' | 'apps' | 'workout' | 'history' | 'settings';

interface AndroidBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeUnlocksCount?: number;
}

export function AndroidBottomNav({
  activeTab,
  onSelectTab,
  activeUnlocksCount = 0,
}: AndroidBottomNavProps) {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'apps' as ActiveTab, label: 'Apps', icon: Shield },
    { id: 'workout' as ActiveTab, label: 'Push-Ups', icon: Dumbbell, isCenter: true },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      id="android-bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-lg shadow-gray-900/5 px-2 py-1.5 safe-area-pb"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  triggerHaptic('click');
                  onSelectTab(tab.id);
                }}
                className="relative -top-4 flex flex-col items-center group cursor-pointer"
                title="AI Push-Up Counter"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-105 shadow-emerald-600/30'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  <Dumbbell className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive ? 'text-emerald-700 font-black' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => {
                triggerHaptic('click');
                onSelectTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />
                {tab.id === 'apps' && activeUnlocksCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 ${
                  isActive ? 'font-black text-emerald-700' : 'font-semibold text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
