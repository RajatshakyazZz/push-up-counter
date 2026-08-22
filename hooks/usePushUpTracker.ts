'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PushUpPhase,
  FormStatus,
  PushUpSettings,
  WorkoutStats,
  RepRecord,
} from '@/types/fitness';
import { PoseAnalysis } from '@/lib/pose-math';
import {
  playRepChime,
  playDownCue,
  playFormWarning,
  playTargetReachedFanfare,
  speakCoachFeedback,
} from '@/lib/audio';

export const DEFAULT_SETTINGS: PushUpSettings = {
  upAngleThreshold: 152,
  downAngleThreshold: 92,
  backAlignmentThreshold: 140,
  voiceAnnounce: true,
  soundEffects: true,
  hapticsEnabled: true,
  targetReps: 15,
  pushUpVariant: 'standard',
  strictMode: false,
  mirrorVideo: true,
  showSkeleton: true,
  showAngles: true,
  countdownSeconds: 5,
};

export function usePushUpTracker(initialSettings?: Partial<PushUpSettings>) {
  const [settings, setSettings] = useState<PushUpSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [phase, setPhase] = useState<PushUpPhase>('idle');
  const [formStatus, setFormStatus] = useState<FormStatus>('ready');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Get into plank position to begin');
  const [repRecords, setRepRecords] = useState<RepRecord[]>([]);

  const [stats, setStats] = useState<WorkoutStats>({
    totalReps: 0,
    invalidAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    startTime: null,
    elapsedSeconds: 0,
    isActive: false,
    isPaused: false,
    caloriesBurned: 0,
    avgPaceRpm: 0,
    avgDepthAngle: 0,
    avgFormScore: 100,
  });

  // State refs to maintain consistency across frame callbacks without stale closures
  const phaseRef = useRef<PushUpPhase>('idle');
  const reachedBottomRef = useRef<boolean>(false);
  const repStartTimeRef = useRef<number>(0);
  const minAngleInRepRef = useRef<number>(180);
  const formScoresInRepRef = useRef<number[]>([]);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSpokenMessageRef = useRef<string>('');
  const targetCelebratedRef = useRef<boolean>(false);
  const statsRef = useRef(stats);
  const settingsRef = useRef(settings);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sound cooldowns
  const lastDownSoundTimeRef = useRef<number>(0);

  // Rate-limited coach feedback
  const provideFeedback = useCallback((message: string, isSpeech = false, forceSpeech = false) => {
    setFeedbackMessage(message);
    const now = Date.now();

    if (
      settingsRef.current.voiceAnnounce &&
      isSpeech &&
      (now - lastSpokenTimeRef.current > 2500 || forceSpeech) &&
      lastSpokenMessageRef.current !== message
    ) {
      lastSpokenTimeRef.current = now;
      lastSpokenMessageRef.current = message;
      speakCoachFeedback(message, forceSpeech);
    }
  }, []);

  // Frame evaluation function called by PoseDetector
  const handlePoseFrame = useCallback(
    (analysis: PoseAnalysis) => {
      // If workout is not active or paused, just show basic status
      if (!statsRef.current.isActive || statsRef.current.isPaused) {
        if (!analysis.landmarksVisible) {
          setFormStatus('no_person');
          setFeedbackMessage('Step into camera view');
        } else {
          setFormStatus('ready');
          setFeedbackMessage(
            statsRef.current.isPaused ? 'Workout paused' : 'Press Start Workout when ready'
          );
        }
        return;
      }

      // No person visible
      if (!analysis.landmarksVisible) {
        setFormStatus('no_person');
        setFeedbackMessage('No person detected. Position your full body in frame.');
        return;
      }

      const { elbowAngle, bodyAngle, isBodyStraight, isPlankOrientation } = analysis;
      const {
        upAngleThreshold,
        downAngleThreshold,
        strictMode,
        soundEffects,
        voiceAnnounce,
        targetReps,
      } = settingsRef.current;

      const now = Date.now();

      // Check if user is in horizontal plank posture vs standing upright
      if (!isPlankOrientation && phaseRef.current === 'idle') {
        setFormStatus('ready');
        setFeedbackMessage('Get down into plank position on the floor to start');
        return;
      }

      // Form score for current frame (100 is perfect)
      let currentFrameScore = 100;
      if (!isBodyStraight) {
        currentFrameScore -= 25;
      }
      if (!isPlankOrientation) {
        currentFrameScore -= 20;
      }
      formScoresInRepRef.current.push(currentFrameScore);

      // Track minimum elbow angle achieved during current descent
      if (elbowAngle < minAngleInRepRef.current) {
        minAngleInRepRef.current = elbowAngle;
      }

      // Live Form Check
      if (!isBodyStraight && phaseRef.current !== 'idle' && phaseRef.current !== 'resting') {
        setFormStatus('straighten_back');
        provideFeedback('Keep hips aligned with back', false);
        if (soundEffects && now - lastDownSoundTimeRef.current > 4000) {
          playFormWarning();
          lastDownSoundTimeRef.current = now;
        }
      }

      // PUSH-UP FINITE STATE MACHINE
      const currentPhase = phaseRef.current;

      switch (currentPhase) {
        case 'idle':
        case 'resting': {
          // Check if user is in top plank position (arms extended and body prone)
          if (isPlankOrientation && elbowAngle >= upAngleThreshold - 12) {
            phaseRef.current = 'up';
            setPhase('up');
            setFormStatus('good_form');
            provideFeedback('Plank locked. Lower your chest!', true);
          } else if (!isPlankOrientation) {
            setFormStatus('ready');
            setFeedbackMessage('Get down into plank position on the floor');
          } else {
            setFormStatus('ready');
            setFeedbackMessage('Straighten your arms to begin the rep');
          }
          break;
        }

        case 'up': {
          // If user stands up completely during workout, return to resting/idle
          if (!isPlankOrientation && elbowAngle > 140) {
            setFeedbackMessage('Get down into plank position on the floor');
            return;
          }

          // Starting descent with arms bending
          if (elbowAngle < upAngleThreshold - 14) {
            phaseRef.current = 'going_down';
            setPhase('going_down');
            reachedBottomRef.current = false;
            repStartTimeRef.current = now;
            minAngleInRepRef.current = elbowAngle;
            formScoresInRepRef.current = [currentFrameScore];
            setFormStatus('good_form');
            setFeedbackMessage('Lowering chest down...');
          }
          break;
        }

        case 'going_down': {
          // Check if valid bottom depth is reached
          if (elbowAngle <= downAngleThreshold) {
            phaseRef.current = 'down';
            setPhase('down');
            reachedBottomRef.current = true;
            setFormStatus('perfect_depth');
            setFeedbackMessage('Target depth reached! Push up!');

            if (soundEffects && now - lastDownSoundTimeRef.current > 450) {
              playDownCue();
              lastDownSoundTimeRef.current = now;
            }
          } else if (elbowAngle > upAngleThreshold - 10 && !reachedBottomRef.current) {
            // User went back up without reaching bottom (incomplete rep)
            const repDuration = now - repStartTimeRef.current;
            if (repDuration > 300) {
              setStats((prev) => ({
                ...prev,
                invalidAttempts: prev.invalidAttempts + 1,
              }));
              setFormStatus('go_lower');
              provideFeedback('Go lower for a full repetition', true);
            }
            phaseRef.current = 'up';
            setPhase('up');
          }
          break;
        }

        case 'down': {
          // User begins pushing back up
          if (elbowAngle > downAngleThreshold + 12) {
            phaseRef.current = 'going_up';
            setPhase('going_up');
            setFormStatus('good_form');
            setFeedbackMessage('Pushing up to lockout...');
          }
          break;
        }

        case 'going_up': {
          // Rep Completed: arms locked out again (upAngleThreshold - 4 for forgiving lockout)
          if (elbowAngle >= upAngleThreshold - 4) {
            const repDuration = now - repStartTimeRef.current;
            const rom = upAngleThreshold - minAngleInRepRef.current;
            const avgForm =
              formScoresInRepRef.current.length > 0
                ? Math.round(
                    formScoresInRepRef.current.reduce((a, b) => a + b, 0) /
                      formScoresInRepRef.current.length
                  )
                : 90;

            // Security against false triggers:
            // 1. Must have reached legitimate bottom depth (reachedBottomRef === true)
            // 2. Must have completed full range of motion (rom >= 35°)
            // 3. Minimum human rep duration (>= 350ms)
            // 4. Must be in plank posture
            const isRepStrictlyValid =
              reachedBottomRef.current &&
              rom >= 35 &&
              repDuration >= 350 &&
              (!strictMode || avgForm >= 65);

            if (isRepStrictlyValid) {
              const newRepCount = statsRef.current.totalReps + 1;
              const newStreak = statsRef.current.currentStreak + 1;
              const newBestStreak = Math.max(statsRef.current.bestStreak, newStreak);

              // Audio & speech cue (non-blocking)
              if (soundEffects) {
                playRepChime();
              }
              if (voiceAnnounce) {
                speakCoachFeedback(`${newRepCount}`, true);
              }

              // Rep record entry
              const newRecord: RepRecord = {
                repNumber: newRepCount,
                timestamp: now,
                durationMs: repDuration,
                minElbowAngle: Math.round(minAngleInRepRef.current),
                bodyAngle: Math.round(bodyAngle),
                formScore: avgForm,
                isValid: true,
              };

              setRepRecords((prev) => [newRecord, ...prev]);

              // Update stats
              setStats((prev) => {
                const total = newRepCount;
                const elapsedMin = Math.max(1 / 60, prev.elapsedSeconds / 60);
                const rpm = Math.round((total / elapsedMin) * 10) / 10;
                const calories = Math.round(total * 0.35 * 10) / 10; // ~0.35 cal per pushup

                return {
                  ...prev,
                  totalReps: total,
                  currentStreak: newStreak,
                  bestStreak: newBestStreak,
                  avgPaceRpm: rpm,
                  caloriesBurned: calories,
                  avgDepthAngle: Math.round(
                    (prev.avgDepthAngle * (total - 1) + minAngleInRepRef.current) / total
                  ),
                  avgFormScore: Math.round(
                    (prev.avgFormScore * (total - 1) + avgForm) / total
                  ),
                };
              });

              // Check if target reps achieved
              if (newRepCount === targetReps && !targetCelebratedRef.current) {
                targetCelebratedRef.current = true;
                if (soundEffects) {
                  playTargetReachedFanfare();
                }
                if (voiceAnnounce) {
                  speakCoachFeedback(`Goal reached! Outstanding workout!`, true);
                }
                confetti({
                  particleCount: 120,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              }

              setFormStatus('good_form');
              setFeedbackMessage(`Rep ${newRepCount} counted! Keep going!`);
            } else if (reachedBottomRef.current && repDuration < 350) {
              // Too fast / noisy jitter, ignore without penalty
              setFeedbackMessage('Hold steady tempo');
            } else {
              setFormStatus('straighten_back');
              provideFeedback('Incomplete form. Keep plank straight and lock out!', false);
              setStats((prev) => ({
                ...prev,
                currentStreak: 0,
                invalidAttempts: prev.invalidAttempts + 1,
              }));
            }

            // Reset cycle back to up
            phaseRef.current = 'up';
            setPhase('up');
            reachedBottomRef.current = false;
            minAngleInRepRef.current = 180;
            formScoresInRepRef.current = [];
          } else if (elbowAngle < downAngleThreshold) {
            // Sunk back down
            phaseRef.current = 'down';
            setPhase('down');
          }
          break;
        }
      }
    },
    [provideFeedback]
  );

  // Workout Timer & Pace updater
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (stats.isActive && !stats.isPaused) {
      timerInterval = setInterval(() => {
        setStats((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const elapsedMin = Math.max(1 / 60, newElapsed / 60);
          const rpm =
            prev.totalReps > 0
              ? Math.round((prev.totalReps / elapsedMin) * 10) / 10
              : 0;
          return {
            ...prev,
            elapsedSeconds: newElapsed,
            avgPaceRpm: rpm,
          };
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stats.isActive, stats.isPaused]);

  // Workout Controls
  const startWorkout = useCallback(() => {
    targetCelebratedRef.current = false;
    phaseRef.current = 'idle';
    setPhase('idle');
    setFormStatus('ready');
    setStats((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: prev.startTime || Date.now(),
    }));
    if (settings.voiceAnnounce) {
      speakCoachFeedback('Workout started. Get into position!', true);
    }
  }, [settings.voiceAnnounce]);

  const pauseWorkout = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      isPaused: true,
    }));
    setFeedbackMessage('Workout paused');
  }, []);

  const resumeWorkout = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      isPaused: false,
    }));
    setFeedbackMessage('Resuming workout...');
  }, []);

  const resetWorkout = useCallback(() => {
    phaseRef.current = 'idle';
    reachedBottomRef.current = false;
    targetCelebratedRef.current = false;
    setPhase('idle');
    setFormStatus('ready');
    setFeedbackMessage('Ready for next session');
    setRepRecords([]);
    setStats({
      totalReps: 0,
      invalidAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
      startTime: null,
      elapsedSeconds: 0,
      isActive: false,
      isPaused: false,
      caloriesBurned: 0,
      avgPaceRpm: 0,
      avgDepthAngle: 0,
      avgFormScore: 100,
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PushUpSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return {
    phase,
    formStatus,
    feedbackMessage,
    stats,
    repRecords,
    settings,
    handlePoseFrame,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    resetWorkout,
    updateSettings,
  };
}
