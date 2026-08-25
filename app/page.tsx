'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import {
  Shield,
  Smartphone,
  Flame,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  Camera,
  Volume2,
  Clock,
  ArrowRight,
  Download,
  Github,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const APK_DOWNLOAD_URL =
  'https://github.com/RajatshakyazZz/push-up-counter/releases/latest/download/PushLock-AI.apk';

export default function LandingPage() {
  const router = useRouter();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [activeDemoTab, setActiveDemoTab] = useState<'locked' | 'tracker' | 'unlocked'>('locked');

  useEffect(() => {
    // If running natively inside Android Capacitor APK, auto-redirect directly to the app dashboard
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      setIsNativeApp(true);
      router.replace('/app');
    }
  }, [router]);

  if (isNativeApp) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Launching PushLock AI Native App...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 antialiased overflow-x-hidden">
      {/* Top Banner */}
      <div className="w-full bg-linear-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-800/40 py-2 px-4 text-center text-xs text-emerald-300/90 font-medium flex items-center justify-center gap-2">
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30">
          v2.0 Released
        </span>
        <span>Physical Exercise App Locker for Android & Web</span>
        <a
          href={APK_DOWNLOAD_URL}
          className="hidden sm:inline-flex items-center gap-1 font-bold text-white hover:text-emerald-300 underline underline-offset-2 ml-1"
        >
          Download APK <Download className="w-3 h-3" />
        </a>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090D16]/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white">PushLock</span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
                Earn Your Screen Time
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#android-app" className="hover:text-emerald-400 transition-colors">
              Android App
            </a>
            <a href="#permissions" className="hover:text-emerald-400 transition-colors">
              Permissions
            </a>
          </nav>

          {/* Nav CTA Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/app"
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Try Web App</span>
            </Link>

            <a
              href={APK_DOWNLOAD_URL}
              className="px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/25 transition-all duration-150 flex items-center gap-1.5 cursor-pointer hover:shadow-emerald-500/40 active:scale-98"
            >
              <Smartphone className="w-4 h-4 stroke-[2.2]" />
              <span className="hidden xs:inline">Download</span> APK
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-28 lg:pb-36 overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] sm:h-[500px] bg-linear-to-tr from-emerald-600/15 via-teal-500/10 to-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-500/5 blur-[90px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI-Powered Exercise App Locker</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
                Earn Your <br className="hidden sm:inline" />
                <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Screen Time.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
                Stop mindless doom-scrolling. PushLock AI locks your distracting apps and unlocks them
                <span className="font-semibold text-white"> only when you complete real, AI-verified push-ups</span>.
                1 push-up = 1 minute of earned screen time.
              </p>

              {/* Primary & Secondary Action CTAs */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <a
                  href={APK_DOWNLOAD_URL}
                  className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-150 flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer group"
                >
                  <Download className="w-5 h-5 stroke-[2.5] group-hover:translate-y-0.5 transition-transform" />
                  <span>Download for Android</span>
                </a>

                <Link
                  href="/app"
                  className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-base border border-slate-700/80 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>Try Web App</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free & Open Source
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Android 8.0+
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Offline 3D Pose AI
                </span>
              </div>
            </div>

            {/* Hero Right: Interactive Android Phone Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px]">
                {/* Outer Phone Frame */}
                <div className="relative rounded-[42px] p-3.5 bg-linear-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-emerald-950/40 border border-slate-700/60">
                  {/* Speaker Earphone Notch */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
                  </div>

                  {/* Inner Phone Screen */}
                  <div className="relative rounded-[32px] overflow-hidden bg-slate-950 border border-slate-800 flex flex-col aspect-9/18 text-slate-100">
                    {/* Status Bar */}
                    <div className="h-10 px-5 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 z-10">
                      <span>9:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">5G</span>
                        <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.5">
                          <div className="h-full w-3 bg-slate-400 rounded-2xs" />
                        </div>
                      </div>
                    </div>

                    {/* Phone App Top Bar */}
                    <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-xs font-black text-white tracking-wide">PushLock AI</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Active Locker
                        </span>
                      </div>
                    </div>

                    {/* Phone Screen Interactive Views */}
                    <div className="flex-1 p-3.5 flex flex-col justify-between overflow-hidden">
                      {/* Active Status Notification Pill */}
                      <div className="w-full bg-emerald-950/90 border border-emerald-700/60 rounded-2xl p-2.5 shadow-lg flex items-center justify-between text-xs animate-pulse">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                              Status Bar Live
                            </span>
                            <span className="font-bold text-white text-xs">
                              ⏳ Instagram: 14 min left
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-600/50">
                          Active Ticker
                        </span>
                      </div>

                      {/* Mock AI Pose Detection Camera Viewport */}
                      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex-1 my-3 flex flex-col items-center justify-center p-4">
                        {/* Glowing 3D Skeleton Graphic */}
                        <svg className="w-full h-32" viewBox="0 0 200 120" fill="none">
                          {/* Bones */}
                          <line x1="100" y1="20" x2="80" y2="35" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="100" y1="20" x2="120" y2="35" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="80" y1="35" x2="120" y2="35" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          {/* Left Arm (Deep Pushup Angle 98 deg) */}
                          <line x1="80" y1="35" x2="60" y2="55" stroke="#34C759" strokeWidth="5" strokeLinecap="round" />
                          <line x1="60" y1="55" x2="65" y2="80" stroke="#34C759" strokeWidth="5" strokeLinecap="round" />
                          {/* Right Arm */}
                          <line x1="120" y1="35" x2="140" y2="55" stroke="#34C759" strokeWidth="5" strokeLinecap="round" />
                          <line x1="140" y1="55" x2="135" y2="80" stroke="#34C759" strokeWidth="5" strokeLinecap="round" />
                          {/* Torso & Legs */}
                          <line x1="80" y1="35" x2="85" y2="85" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="120" y1="35" x2="115" y2="85" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="85" y1="85" x2="115" y2="85" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="85" y1="85" x2="70" y2="105" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
                          <line x1="115" y1="85" x2="130" y2="105" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />

                          {/* Glowing Joint Nodes */}
                          <circle cx="100" cy="20" r="4" fill="#FFFFFF" stroke="#00E5FF" strokeWidth="3" />
                          <circle cx="80" cy="35" r="4" fill="#FFFFFF" stroke="#00E5FF" strokeWidth="3" />
                          <circle cx="120" cy="35" r="4" fill="#FFFFFF" stroke="#00E5FF" strokeWidth="3" />
                          <circle cx="60" cy="55" r="5" fill="#FFFFFF" stroke="#34C759" strokeWidth="4" />
                          <circle cx="140" cy="55" r="5" fill="#FFFFFF" stroke="#34C759" strokeWidth="4" />
                          <circle cx="65" cy="80" r="3" fill="#FFFFFF" />
                          <circle cx="135" cy="80" r="3" fill="#FFFFFF" />
                        </svg>

                        {/* Overlaid Angle & Form Badges */}
                        <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-xs border border-emerald-500/40 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-300">
                          Elbow: 98° (Perfect Depth)
                        </div>
                        <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300">
                          Spine: 168° (Straight)
                        </div>

                        {/* Rep Counter Banner inside Mockup */}
                        <div className="w-full bg-slate-950/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between mt-auto">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Reps Counted</div>
                            <div className="text-2xl font-black text-emerald-400">12 <span className="text-xs text-slate-400">/ 15</span></div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Earned Time</div>
                            <div className="text-sm font-extrabold text-teal-300">+12 Minutes</div>
                          </div>
                        </div>
                      </div>

                      {/* Mock Bottom Unlocking Action */}
                      <div className="w-full bg-emerald-500 text-slate-950 py-2.5 rounded-xl text-center font-black text-xs shadow-md">
                        🔥 3 Reps Left to Unlock Instagram
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Floating Feature Tag */}
                <div className="absolute -bottom-4 -left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>100% Real-Time 3D Vision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section id="features" className="py-20 sm:py-28 bg-[#0C121E] border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
              Core Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Built for Discipline. Powered by AI.
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-400">
              A comprehensive system combining computer vision biomechanics with native Android app protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 sm:p-8 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  AI Push-Up Counter
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Accurate, real-time camera-based pose estimation using 3D Vector Math to detect joint angles across 3D planes ($X, Y, Z$) — eliminating camera tilt errors.
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time camera pose tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Strict anti-cheat spine alignment check</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Optimized for fast reps (zero dropped counts)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Voice coach audio announcements</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 sm:p-8 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <Lock className="w-6 h-6 text-teal-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Native Android App Locker
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Select any installed Android application and lock it behind physical push-up goals. The app remains blocked until your target is completed.
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Lock Instagram, YouTube, Games & Social Media</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Customizable rep targets for each app</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Instant system-level launch interception</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Real high-res app icon lock overlays</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 sm:p-8 hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                  <Clock className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  Exercise → Screen Time Economy
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Convert physical sweat directly into screen time. With the smart active ticker, time only decrements while you are actively inside the app.
                </p>
                <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>1 Push-Up = 1 Minute of Screen Time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Auto-pauses when exiting to home screen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Status bar & in-app timer stay 100% in sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Automatic re-lock at 00:00 quota expiry</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
            Simple 3-Step Workflow
          </h2>
          <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            How PushLock AI Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-8 flex flex-col items-start">
            <span className="text-5xl font-black text-emerald-500/20 mb-4">01</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Choose an App</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Select apps you want to restrict (e.g., YouTube, Instagram, Games) and configure your target push-up requirements.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-8 flex flex-col items-start">
            <span className="text-5xl font-black text-emerald-500/20 mb-4">02</span>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center mb-4">
              <Camera className="w-5 h-5 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Complete Your Push-Ups</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Prop your phone against a wall or floor. The 3D AI tracks your depth, posture, and lockout in real time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-slate-800 p-8 flex flex-col items-start">
            <span className="text-5xl font-black text-emerald-500/20 mb-4">03</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4">
              <Unlock className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Unlock & Enjoy</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The app unlocks immediately. A live countdown runs only while in the app and pauses whenever you leave.
            </p>
          </div>
        </div>
      </section>

      {/* Android Dedicated Section */}
      <section id="android-app" className="py-20 sm:py-28 bg-[#0C121E] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-300">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Native Android APK</span>
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Real Android System-Level App Locking
                </h2>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  While our web version provides full in-browser AI push-up tracking, the <strong className="text-white">PushLock AI Android APK</strong> gives you genuine, system-wide app locking powered by Android native background services.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
                    <h4 className="font-bold text-white text-sm mb-1">Ongoing Status Bar Ticker</h4>
                    <p className="text-xs text-slate-400">Live countdown with quick-action shortcut to earn more time.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
                    <h4 className="font-bold text-white text-sm mb-1">Auto-Start on Boot</h4>
                    <p className="text-xs text-slate-400">Protection persists reliably across phone reboots.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
                    <h4 className="font-bold text-white text-sm mb-1">Zero Cloud Latency</h4>
                    <p className="text-xs text-slate-400">Bundled Float-16 TFLite neural networks run 100% offline.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80">
                    <h4 className="font-bold text-white text-sm mb-1">Battery-Friendly</h4>
                    <p className="text-xs text-slate-400">Lightweight Kotlin foreground service with UsageStats API.</p>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href={APK_DOWNLOAD_URL}
                    className="px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Download for Android (.apk)</span>
                  </a>

                  <a
                    href="https://github.com/RajatshakyazZz/push-up-counter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>View on GitHub</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase text-slate-400">Supported Target Apps</span>
                    <span className="text-xs text-emerald-400 font-bold">100% Free</span>
                  </div>

                  <div className="space-y-2.5">
                    {['YouTube', 'Instagram', 'TikTok', 'Snapchat', 'Reddit', 'Mobile Games'].map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-xs">
                        <div className="flex items-center gap-2.5 font-bold text-slate-200">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{app}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">15 Push-ups / 15 min</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Permissions Transparency Section */}
      <section id="permissions" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
            Security & Privacy
          </h2>
          <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Transparent Android Permissions
          </p>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            PushLock AI processes everything 100% on your device. We do not transmit your camera feed or usage data to any cloud servers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base mb-1">Usage Access (PACKAGE_USAGE_STATS)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Required for the background service to detect when a protected app is brought to the foreground and start the screen-time ticker.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base mb-1">Display Over Other Apps (Overlay)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Allows PushLock AI to instantly present the physical push-up requirement screen when a locked app is opened.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base mb-1">Camera Access</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used exclusively during push-up workouts for on-device real-time 3D pose detection. No video or photos are ever saved or recorded.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base mb-1">Battery Optimization Exemption</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ensures aggressive OEM battery managers (Xiaomi, Samsung, OnePlus, Oppo) do not kill the background protection ticker.
              </p>
            </div>
          </div>
        </div>

        {/* Web Notice Disclaimer */}
        <div className="mt-8 max-w-4xl mx-auto p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            <strong>Note:</strong> The browser-based web tracker allows you to test camera AI push-up counting on any device. System-level app locking is an Android OS feature that requires installing the native Android APK.
          </span>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-28 bg-linear-to-b from-[#090D16] via-emerald-950/20 to-[#090D16] border-t border-slate-800/80 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-300 mb-6">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span>Start Building Strength Today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6">
            Ready to earn your screen time?
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Ditch mindless dopamine addiction. Transform every minute of social media into physical fitness and discipline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APK_DOWNLOAD_URL}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-150 flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download PushLock AI</span>
            </a>

            <Link
              href="/tracker"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Launch Web Tracker</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-black text-sm text-white">PushLock AI</span>
            <span className="text-slate-600">|</span>
            <span>AI Physical Push-Up App Locker</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-400">
            <a
              href="https://github.com/RajatshakyazZz/push-up-counter"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
            <Link href="/app" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/tracker" className="hover:text-white transition-colors">
              Tracker
            </Link>
            <a href="#permissions" className="hover:text-white transition-colors">
              Privacy & Permissions
            </a>
          </div>

          <div className="text-slate-500 text-center sm:text-right">
            © {new Date().getFullYear()} PushLock AI. Free & Open Source.
          </div>
        </div>
      </footer>
    </div>
  );
}
