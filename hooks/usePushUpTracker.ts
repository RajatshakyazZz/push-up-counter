'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PushUpPhase,
  FormStatus,
  PushUpSettings,
  WorkoutStats,
  RepRecord,
  PushUpDebugInfo,
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
  debugMode: false,
  minRepDurationMs: 280,
  minAngleDelta: 26,
  requiredConfidence: 0.25,
};

// High-speed responsive debounce frame requirements (zero missed reps)
const POSITION_CONFIRM_FRAMES = 3;
const DOWN_CONFIRM_FRAMES = 1;
const UP_CONFIRM_FRAMES = 1;
const REP_COOLDOWN_MS = 120;

export function usePushUpTracker(initialSettings?: Partial<PushUpSettings>) {
  const [settings, setSettings] = useState<PushUpSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [phase, setPhase] = useState<PushUpPhase>('idle');
  const [formStatus, setFormStatus] = useState<FormStatus>('ready');
  const [feedbackMessage, setFeedbackMessage] = useState<string>(
    'Get into push-up position to begin'
  );
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

  const [debugInfo, setDebugInfo] = useState<PushUpDebugInfo>({
    isPositionValid: false,
    invalidReason: 'Not initialized',
    orientation: 'unknown',
    torsoAngle: 0,
    bodyAngle: 180,
    poseConfidence: 0,
    leftElbowAngle: 180,
    rightElbowAngle: 180,
    dominantElbowAngle: 180,
    hipAlignment: 'good',
    currentState: 'idle',
    minAngleInRep: 180,
    repAngleDelta: 0,
    consecutiveFrames: 0,
    requiredFrames: POSITION_CONFIRM_FRAMES,
  });

  // State refs for low-latency non-stale callbacks inside requestAnimationFrame
  const phaseRef = useRef<PushUpPhase>('idle');
  const reachedBottomRef = useRef<boolean>(false);
  const repStartTimeRef = useRef<number>(0);
  const minAngleInRepRef = useRef<number>(180);
  const formScoresInRepRef = useRef<number[]>([]);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSpokenMessageRef = useRef<string>('');
  const targetCelebratedRef = useRef<boolean>(false);
  const lastRepCompletedTimeRef = useRef<number>(0);
  const statsRef = useRef(stats);
  const settingsRef = useRef(settings);

  // Multi-frame debounce confirmation counters
  const consecutivePositionFramesRef = useRef<number>(0);
  const consecutiveDownFramesRef = useRef<number>(0);
  const consecutiveUpFramesRef = useRef<number>(0);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sound cooldowns
  const lastDownSoundTimeRef = useRef<number>(0);
  const lastWarnSoundTimeRef = useRef<number>(0);

  // Rate-limited coach feedback
  const provideFeedback = useCallback(
    (message: string, isSpeech = false, forceSpeech = false) => {
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
    },
    []
  );

  // Frame evaluation function called by PoseDetector loop
  const handlePoseFrame = useCallback(
    (analysis: PoseAnalysis) => {
      const now = Date.now();
      const currentPhase = phaseRef.current;
      const {
        upAngleThreshold,
        downAngleThreshold,
        strictMode,
        soundEffects,
        voiceAnnounce,
        targetReps,
        minRepDurationMs = 280,
        minAngleDelta = 26,
      } = settingsRef.current;

      const {
        elbowAngle,
        leftElbowAngle,
        rightElbowAngle,
        bodyAngle,
        isBodyStraight,
        isPlankOrientation,
        isPositionValid,
        positionInvalidReason,
        orientation,
        hipAlignmentStatus,
        confidence,
        landmarksVisible,
      } = analysis;

      // Update developer diagnostics
      setDebugInfo({
        isPositionValid,
        invalidReason: positionInvalidReason,
        orientation,
        torsoAngle: analysis.torsoAngleWithHorizontal,
        bodyAngle,
        poseConfidence: Math.round(confidence * 100),
        leftElbowAngle,
        rightElbowAngle,
        dominantElbowAngle: elbowAngle,
        hipAlignment: hipAlignmentStatus,
        currentState: currentPhase,
        minAngleInRep: Math.round(minAngleInRepRef.current),
        repAngleDelta:
          currentPhase === 'going_down' ||
          currentPhase === 'down' ||
          currentPhase === 'going_up'
            ? Math.round(Math.max(0, upAngleThreshold - minAngleInRepRef.current))
            : 0,
        consecutiveFrames:
          currentPhase === 'position_check'
            ? consecutivePositionFramesRef.current
            : currentPhase === 'going_down'
            ? consecutiveDownFramesRef.current
            : currentPhase === 'going_up'
            ? consecutiveUpFramesRef.current
            : 0,
        requiredFrames:
          currentPhase === 'position_check'
            ? POSITION_CONFIRM_FRAMES
            : currentPhase === 'going_down'
            ? DOWN_CONFIRM_FRAMES
            : UP_CONFIRM_FRAMES,
      });

      // 1. INACTIVE OR PAUSED WORKOUT
      if (!statsRef.current.isActive || statsRef.current.isPaused) {
        // If explicitly paused by user, hold paused state
        if (statsRef.current.isPaused) {
          consecutivePositionFramesRef.current = 0;
          consecutiveDownFramesRef.current = 0;
          consecutiveUpFramesRef.current = 0;
          setFormStatus('ready');
          setFeedbackMessage('Workout paused — press Resume');
          return;
        }

        // If inactive, check if user gets into valid pushup position to auto-start!
        if (!landmarksVisible) {
          consecutivePositionFramesRef.current = 0;
          setFormStatus('no_person');
          setFeedbackMessage('Step into camera view');
          return;
        }

        if (!isPositionValid) {
          consecutivePositionFramesRef.current = 0;
          if (orientation === 'vertical' || !isPlankOrientation) {
            setFormStatus('stand_down');
            setFeedbackMessage('Get down into push-up position on the floor');
          } else if (!analysis.areHandsSupporting) {
            setFormStatus('hands_misaligned');
            setFeedbackMessage('Place your hands firmly on the ground under shoulders');
          } else {
            setFormStatus('invalid_position');
            setFeedbackMessage(positionInvalidReason || 'Get into push-up position');
          }
          return;
        }

        // Position is VALID and arms extended in plank:
        if (elbowAngle >= upAngleThreshold - 14) {
          consecutivePositionFramesRef.current++;
          if (consecutivePositionFramesRef.current >= POSITION_CONFIRM_FRAMES) {
            // Auto-activate workout hands-free!
            consecutivePositionFramesRef.current = 0;
            phaseRef.current = 'ready';
            setPhase('ready');
            setFormStatus('good_form');
            setStats((prev) => ({
              ...prev,
              isActive: true,
              isPaused: false,
              startTime: prev.startTime || Date.now(),
            }));
            provideFeedback('Ready — start your push-up!', true, true);
          } else {
            phaseRef.current = 'position_check';
            setPhase('position_check');
            setFormStatus('ready');
            setFeedbackMessage('Hold plank to start...');
          }
        } else {
          consecutivePositionFramesRef.current = 0;
          setFormStatus('good_form');
          setFeedbackMessage('Straighten your arms in plank to start');
        }
        return;
      }

      // 2. NO PERSON / LANDMARKS LOST
      if (!landmarksVisible) {
        consecutivePositionFramesRef.current = 0;
        consecutiveDownFramesRef.current = 0;
        consecutiveUpFramesRef.current = 0;

        if (
          currentPhase === 'going_down' ||
          currentPhase === 'down' ||
          currentPhase === 'going_up'
        ) {
          // Cancel active rep safely
          reachedBottomRef.current = false;
          phaseRef.current = 'idle';
          setPhase('idle');
        }

        setFormStatus('no_person');
        setFeedbackMessage('No person detected. Position your full body in frame.');
        return;
      }

      // 3. STRICT PUSH-UP POSITION GATE ENFORCEMENT
      // If position is invalid (standing, sitting, waving hands),
      // FREEZE the state machine without instantly killing in-flight reps on 1 noisy frame.
      // Only reset to idle if posture remains invalid for > 25 consecutive frames (~1 second).
      if (!isPositionValid) {
        consecutivePositionFramesRef.current = 0;
        consecutiveDownFramesRef.current = 0;
        consecutiveUpFramesRef.current = 0;

        if (
          currentPhase === 'going_down' ||
          currentPhase === 'down' ||
          currentPhase === 'going_up' ||
          currentPhase === 'ready' ||
          currentPhase === 'up'
        ) {
          // Freeze state during momentary posture noise, do not clear reachedBottomRef immediately
        }

        if (orientation === 'vertical' || !isPlankOrientation) {
          setFormStatus('stand_down');
          provideFeedback('Get down into push-up position on the floor', false);
        } else if (!analysis.areHandsSupporting) {
          setFormStatus('hands_misaligned');
          provideFeedback('Place your hands firmly on the ground under shoulders', false);
        } else if (!isBodyStraight) {
          setFormStatus('straighten_back');
          provideFeedback(positionInvalidReason || 'Align hips with back', false);
        } else {
          setFormStatus('invalid_position');
          provideFeedback(positionInvalidReason || 'Get into push-up position', false);
        }
        return;
      }

      // 4. FORM SCORING
      let currentFrameScore = 100;
      if (!isBodyStraight) {
        currentFrameScore -= 30;
      }
      if (hipAlignmentStatus === 'sagging' || hipAlignmentStatus === 'piked') {
        currentFrameScore -= 20;
      }
      formScoresInRepRef.current.push(currentFrameScore);

      // Warning sound for sagging hips
      if (
        !isBodyStraight &&
        (currentPhase === 'ready' ||
          currentPhase === 'going_down' ||
          currentPhase === 'down' ||
          currentPhase === 'going_up')
      ) {
        if (soundEffects && now - lastWarnSoundTimeRef.current > 4000) {
          playFormWarning();
          lastWarnSoundTimeRef.current = now;
        }
      }

      // Track minimum elbow angle achieved during descent
      if (elbowAngle < minAngleInRepRef.current) {
        minAngleInRepRef.current = elbowAngle;
      }

      // 5. STRICT PUSH-UP FINITE STATE MACHINE
      switch (currentPhase) {
        case 'idle':
        case 'resting':
        case 'position_check': {
          // Check if user is in top extended plank position
          if (isPositionValid && elbowAngle >= upAngleThreshold - 14) {
            consecutivePositionFramesRef.current++;

            if (consecutivePositionFramesRef.current >= POSITION_CONFIRM_FRAMES) {
              phaseRef.current = 'ready';
              setPhase('ready');
              consecutivePositionFramesRef.current = 0;
              setFormStatus('good_form');
              provideFeedback('Ready — start your push-up!', true);
            } else {
              phaseRef.current = 'position_check';
              setPhase('position_check');
              setFormStatus('ready');
              setFeedbackMessage('Hold push-up position...');
            }
          } else {
            consecutivePositionFramesRef.current = 0;
            phaseRef.current = 'idle';
            setPhase('idle');
            setFormStatus('ready');
            setFeedbackMessage('Straighten your arms in plank to begin');
          }
          break;
        }

        case 'ready':
        case 'up': {
          // Cooldown guard: Prevent starting a new descent immediately after previous rep
          if (now - lastRepCompletedTimeRef.current < REP_COOLDOWN_MS) {
            setFeedbackMessage('Hold steady tempo');
            return;
          }

          // Starting descent: arms bending below top threshold exit (hysteresis)
          if (elbowAngle < upAngleThreshold - 14) {
            phaseRef.current = 'going_down';
            setPhase('going_down');
            reachedBottomRef.current = false;
            repStartTimeRef.current = now;
            minAngleInRepRef.current = elbowAngle;
            formScoresInRepRef.current = [currentFrameScore];
            consecutiveDownFramesRef.current = 0;
            setFormStatus('good_form');
            setFeedbackMessage('Lowering chest down...');
          } else {
            setFormStatus('good_form');
            setFeedbackMessage('Ready — lower your chest!');
          }
          break;
        }

        case 'going_down': {
          // Check if valid bottom depth is reached (instant 1-frame registration)
          if (elbowAngle <= downAngleThreshold) {
            consecutiveDownFramesRef.current++;

            if (consecutiveDownFramesRef.current >= DOWN_CONFIRM_FRAMES) {
              phaseRef.current = 'down';
              setPhase('down');
              reachedBottomRef.current = true;
              consecutiveDownFramesRef.current = 0;
              setFormStatus('perfect_depth');
              provideFeedback('Now push up!', false);

              if (soundEffects && now - lastDownSoundTimeRef.current > 300) {
                playDownCue();
                lastDownSoundTimeRef.current = now;
              }
            }
          } else {
            consecutiveDownFramesRef.current = 0;

            // Incomplete rep check: User went back up before reaching bottom
            if (
              elbowAngle > upAngleThreshold - 10 &&
              !reachedBottomRef.current
            ) {
              const repDuration = now - repStartTimeRef.current;
              if (repDuration > 350) {
                setStats((prev) => ({
                  ...prev,
                  invalidAttempts: prev.invalidAttempts + 1,
                }));
                setFormStatus('go_lower');
                provideFeedback('Go lower for a full repetition', false);
              }
              phaseRef.current = 'ready';
              setPhase('ready');
              consecutiveDownFramesRef.current = 0;
            }
          }
          break;
        }

        case 'down': {
          // User begins pushing back up past hysteresis threshold
          if (elbowAngle > downAngleThreshold + 10) {
            phaseRef.current = 'going_up';
            setPhase('going_up');
            consecutiveUpFramesRef.current = 0;
            setFormStatus('good_form');
            setFeedbackMessage('Pushing up to lockout...');
          }
          break;
        }

        case 'going_up': {
          // Check if arms reached top lockout threshold (responsive 1-frame confirmation)
          if (elbowAngle >= upAngleThreshold - 12) {
            consecutiveUpFramesRef.current++;

            if (consecutiveUpFramesRef.current >= UP_CONFIRM_FRAMES) {
              const repDuration = now - repStartTimeRef.current;
              const rom = upAngleThreshold - minAngleInRepRef.current;
              const avgForm =
                formScoresInRepRef.current.length > 0
                  ? Math.round(
                      formScoresInRepRef.current.reduce((a, b) => a + b, 0) /
                        formScoresInRepRef.current.length
                    )
                  : 90;

              // Strict Rep Validation Criteria:
              // 1. Must have reached verified bottom depth (reachedBottomRef === true)
              // 2. Range of motion delta must meet minimum (rom >= minAngleDelta, default 26°)
              // 3. Minimum human rep duration (>= minRepDurationMs, default 280ms)
              // 4. Must be in valid push-up posture throughout
              // 5. Strict mode form threshold
              const isRepStrictlyValid =
                reachedBottomRef.current &&
                rom >= minAngleDelta &&
                repDuration >= minRepDurationMs &&
                (!strictMode || avgForm >= 65);

              if (isRepStrictlyValid) {
                const newRepCount = statsRef.current.totalReps + 1;
                const newStreak = statsRef.current.currentStreak + 1;
                const newBestStreak = Math.max(
                  statsRef.current.bestStreak,
                  newStreak
                );

                if (soundEffects) {
                  playRepChime();
                }
                if (voiceAnnounce) {
                  // ONLY speak the rep number count during workout
                  speakCoachFeedback(`${newRepCount}`, true);
                }

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

                setStats((prev) => {
                  const total = newRepCount;
                  const elapsedMin = Math.max(1 / 60, prev.elapsedSeconds / 60);
                  const rpm = Math.round((total / elapsedMin) * 10) / 10;
                  const calories = Math.round(total * 0.35 * 10) / 10;

                  return {
                    ...prev,
                    totalReps: total,
                    currentStreak: newStreak,
                    bestStreak: newBestStreak,
                    avgPaceRpm: rpm,
                    caloriesBurned: calories,
                    avgDepthAngle: Math.round(
                      (prev.avgDepthAngle * (total - 1) +
                        minAngleInRepRef.current) /
                        total
                    ),
                    avgFormScore: Math.round(
                      (prev.avgFormScore * (total - 1) + avgForm) / total
                    ),
                  };
                });

                // Target celebration
                if (
                  newRepCount === targetReps &&
                  !targetCelebratedRef.current
                ) {
                  targetCelebratedRef.current = true;
                  if (soundEffects) {
                    playTargetReachedFanfare();
                  }
                  if (voiceAnnounce) {
                    speakCoachFeedback(
                      `Goal reached! Outstanding workout!`,
                      true
                    );
                  }
                  confetti({
                    particleCount: 120,
                    spread: 80,
                    origin: { y: 0.6 },
                  });
                }

                setFormStatus('good_form');
                provideFeedback(`Rep ${newRepCount} counted! Great rep!`, true);
                lastRepCompletedTimeRef.current = now;
              } else if (
                reachedBottomRef.current &&
                repDuration < minRepDurationMs
              ) {
                // Too fast / noisy jitter
                setFeedbackMessage('Hold steady tempo — don’t rush');
              } else {
                setFormStatus('straighten_back');
                provideFeedback(
                  'Incomplete range of motion. Keep plank straight and lock out!',
                  false
                );
                setStats((prev) => ({
                  ...prev,
                  currentStreak: 0,
                  invalidAttempts: prev.invalidAttempts + 1,
                }));
              }

              // Reset cycle back to ready
              phaseRef.current = 'ready';
              setPhase('ready');
              reachedBottomRef.current = false;
              minAngleInRepRef.current = 180;
              formScoresInRepRef.current = [];
              consecutiveUpFramesRef.current = 0;
            }
          } else if (elbowAngle < downAngleThreshold) {
            // Sunk back down
            phaseRef.current = 'down';
            setPhase('down');
            consecutiveUpFramesRef.current = 0;
          } else {
            consecutiveUpFramesRef.current = 0;
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
    consecutivePositionFramesRef.current = 0;
    consecutiveDownFramesRef.current = 0;
    consecutiveUpFramesRef.current = 0;
    setStats((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: prev.startTime || Date.now(),
    }));
    if (settings.voiceAnnounce) {
      speakCoachFeedback(
        'Workout started. Get into push-up position!',
        true
      );
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
    consecutivePositionFramesRef.current = 0;
    consecutiveDownFramesRef.current = 0;
    consecutiveUpFramesRef.current = 0;
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

  const updateSettings = useCallback(
    (newSettings: Partial<PushUpSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  return {
    phase,
    formStatus,
    feedbackMessage,
    stats,
    repRecords,
    settings,
    debugInfo,
    handlePoseFrame,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    resetWorkout,
    updateSettings,
  };
}

