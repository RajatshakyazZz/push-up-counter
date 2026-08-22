'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import { FormStatus, PushUpSettings } from '@/types/fitness';
import { PoseAnalysis } from '@/lib/pose-math';

interface FormFeedbackCardProps {
  formStatus: FormStatus;
  feedbackMessage: string;
  analysis: PoseAnalysis | null;
  settings: PushUpSettings;
  avgFormScore: number;
}

export function FormFeedbackCard({
  formStatus,
  feedbackMessage,
  analysis,
  settings,
}: FormFeedbackCardProps) {
  const elbow = analysis ? Math.round(analysis.elbowAngle) : 180;
  const body = analysis ? Math.round(analysis.bodyAngle) : 180;
  const isDownTargetReached = elbow <= settings.downAngleThreshold;
  const isPlankStraight = analysis?.isBodyStraight ?? true;

  // Status visual configurations
  const getStatusBadge = () => {
    switch (formStatus) {
      case 'perfect_depth':
        return {
          title: 'TARGET DEPTH',
          icon: <Sparkles className="h-3.5 w-3.5 text-emerald-600" />,
          badgeClass: 'text-emerald-700 border-emerald-300 bg-emerald-50',
        };
      case 'straighten_back':
        return {
          title: 'ALIGN SPINE',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
          badgeClass: 'text-amber-700 border-amber-300 bg-amber-50',
        };
      case 'stand_down':
        return {
          title: 'GET IN PLANK',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
          badgeClass: 'text-amber-700 border-amber-300 bg-amber-50',
        };
      case 'hands_misaligned':
        return {
          title: 'HANDS ON FLOOR',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
          badgeClass: 'text-amber-700 border-amber-300 bg-amber-50',
        };
      case 'invalid_position':
        return {
          title: 'ADJUST POSE',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />,
          badgeClass: 'text-amber-700 border-amber-300 bg-amber-50',
        };
      case 'go_lower':
        return {
          title: 'LOWER CHEST',
          icon: <Info className="h-3.5 w-3.5 text-blue-600" />,
          badgeClass: 'text-blue-700 border-blue-300 bg-blue-50',
        };
      case 'good_form':
        return {
          title: 'GOOD FORM',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
          badgeClass: 'text-emerald-700 border-emerald-300 bg-emerald-50',
        };
      default:
        return {
          title: 'READY',
          icon: <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />,
          badgeClass: 'text-gray-700 border-gray-200 bg-gray-50',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white border border-gray-200/80 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
          AI Biomechanical Form
        </p>
        <span
          className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${statusBadge.badgeClass}`}
        >
          {statusBadge.icon}
          <span>{statusBadge.title}</span>
        </span>
      </div>

      {/* Real-time Biomechanical Bento Gauges */}
      <div className="flex-grow flex flex-col justify-center gap-3.5 pt-1">
        {/* Elbow Flexion */}
        <div>
          <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5">
            <span className="uppercase tracking-wider">Elbow Angle</span>
            <span className="font-mono text-gray-900 font-bold">{elbow}°</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                isDownTargetReached ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
              style={{
                width: `${Math.min(100, Math.max(8, ((180 - elbow) / 120) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Hip Alignment */}
        <div>
          <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5">
            <span className="uppercase tracking-wider">Plank Alignment</span>
            <span
              className={`font-mono font-bold ${
                isPlankStraight ? 'text-emerald-700' : 'text-amber-600'
              }`}
            >
              {isPlankStraight ? 'STABLE' : 'SAGGING / HIPS HIGH'}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                isPlankStraight ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${Math.min(100, (body / 180) * 100)}%` }}
            />
          </div>
        </div>

        {/* Active Feedback Message */}
        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-gray-50 border border-gray-200/80 px-3.5 py-2.5 text-xs text-gray-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-medium truncate">{feedbackMessage}</span>
        </div>
      </div>
    </div>
  );
}
