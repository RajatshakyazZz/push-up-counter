'use client';

import React from 'react';
import {
  Instagram,
  Youtube,
  MessageCircle,
  Twitter,
  Facebook,
  Gamepad2,
  Film,
  Sparkles,
  Shield,
  Smartphone,
  Globe,
  Radio,
  Music,
} from 'lucide-react';

interface AppIconProps {
  iconName?: string;
  name?: string;
  color?: string;
  iconDataUri?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AppIcon({ iconName = '', name = '', color, iconDataUri, size = 'md', className = '' }: AppIconProps) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs rounded-xl p-1.5',
    md: 'w-10 h-10 text-sm rounded-2xl p-2',
    lg: 'w-13 h-13 text-base rounded-[1.25rem] p-2.5',
    xl: 'w-18 h-18 text-xl rounded-[1.5rem] p-3.5',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-9 h-9',
  };

  const getIcon = () => {
    const key = (iconName || name || '').toLowerCase();
    const isize = iconSizeMap[size];

    if (key.includes('instagram')) return <Instagram className={`${isize} text-white`} />;
    if (key.includes('youtube')) return <Youtube className={`${isize} text-white`} />;
    if (key.includes('snapchat')) return <MessageCircle className={`${isize} text-black fill-black`} />;
    if (key.includes('tiktok') || key.includes('music')) return <Music className={`${isize} text-white`} />;
    if (key.includes('reddit')) return <Radio className={`${isize} text-white`} />;
    if (key.includes('facebook')) return <Facebook className={`${isize} text-white`} />;
    if (key.includes('twitter') || key.includes(' x')) return <Twitter className={`${isize} text-white`} />;
    if (key.includes('game') || key.includes('candy') || key.includes('clash')) return <Gamepad2 className={`${isize} text-white`} />;
    if (key.includes('netflix') || key.includes('film')) return <Film className={`${isize} text-white`} />;
    if (key.includes('spark') || key.includes('ai')) return <Sparkles className={`${isize} text-white`} />;
    if (key.includes('shield')) return <Shield className={`${isize} text-white`} />;

    // Fallback letter or phone icon
    return <Smartphone className={`${isize} text-white`} />;
  };

  const getBackgroundColor = () => {
    const key = (iconName || name || '').toLowerCase();
    if (color) return color;
    if (key.includes('instagram')) return 'linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4)';
    if (key.includes('youtube')) return '#FF0000';
    if (key.includes('snapchat')) return '#FFFC00';
    if (key.includes('tiktok')) return '#010101';
    if (key.includes('reddit')) return '#FF4500';
    if (key.includes('facebook')) return '#1877F2';
    if (key.includes('twitter') || key.includes(' x')) return '#0F1419';
    if (key.includes('netflix')) return '#E50914';
    if (key.includes('game')) return '#8B5CF6';
    return '#16A34A';
  };

  const bg = getBackgroundColor();
  const isGradient = bg.startsWith('linear-gradient');

  if (iconDataUri) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-white ${sizeMap[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconDataUri}
          alt={name || 'App icon'}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 ${sizeMap[size]} ${className}`}
      style={{
        background: isGradient ? bg : undefined,
        backgroundColor: !isGradient ? bg : undefined,
      }}
    >
      {getIcon()}
    </div>
  );
}
