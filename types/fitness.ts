export type PushUpPhase =
  | 'idle'
  | 'position_check'
  | 'ready'
  | 'going_down'
  | 'down'
  | 'going_up'
  | 'up'
  | 'rep_completed'
  | 'resting';

export type FormStatus = 
  | 'ready'
  | 'good_form'
  | 'perfect_depth'
  | 'go_lower'
  | 'straighten_back'
  | 'lockout_arms'
  | 'no_person'
  | 'calibrating'
  | 'invalid_position'
  | 'hands_misaligned'
  | 'stand_down';

export interface PushUpDebugInfo {
  isPositionValid: boolean;
  invalidReason: string;
  orientation: 'horizontal' | 'vertical' | 'unknown';
  torsoAngle: number;
  bodyAngle: number;
  poseConfidence: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  dominantElbowAngle: number;
  hipAlignment: 'good' | 'sagging' | 'piked' | 'invalid';
  currentState: string;
  minAngleInRep: number;
  repAngleDelta: number;
  consecutiveFrames: number;
  requiredFrames: number;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

export interface RepRecord {
  repNumber: number;
  timestamp: number;
  durationMs: number;
  minElbowAngle: number;
  bodyAngle: number;
  formScore: number; // 0 - 100
  isValid: boolean;
  notes?: string;
}

export interface PushUpSettings {
  upAngleThreshold: number;       // default 152°
  downAngleThreshold: number;     // default 92°
  backAlignmentThreshold: number; // default 140°
  voiceAnnounce: boolean;
  soundEffects: boolean;
  hapticsEnabled: boolean;
  targetReps: number;
  pushUpVariant: 'standard' | 'knee' | 'incline';
  strictMode: boolean;
  mirrorVideo: boolean;
  showSkeleton: boolean;
  showAngles: boolean;
  countdownSeconds: number; // buffer delay in seconds (e.g. 5, 3, 10, or 0)
  debugMode?: boolean;      // dev debug overlay HUD
  minRepDurationMs?: number; // minimum valid rep time (e.g. 650ms)
  minAngleDelta?: number;    // minimum range of motion angle delta (e.g. 35°)
  requiredConfidence?: number; // required landmark confidence (default 0.5)
}

export interface WorkoutStats {
  totalReps: number;
  invalidAttempts: number;
  currentStreak: number;
  bestStreak: number;
  startTime: number | null;
  elapsedSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  caloriesBurned: number;
  avgPaceRpm: number;
  avgDepthAngle: number;
  avgFormScore: number;
}

export type AppCategory = 'social' | 'entertainment' | 'gaming' | 'productivity' | 'custom';

export interface InstalledApp {
  packageName: string;
  name: string;
  category: AppCategory;
  iconName: string;
  color: string;
  isSystem?: boolean;
}

export interface ProtectedApp {
  id: string;
  packageName: string;
  name: string;
  category: AppCategory;
  iconName: string;
  color: string;
  targetReps: number;
  unlockMinutes: number;
  isProtected: boolean;
  timesUnlockedToday: number;
  totalUnlocks: number;
  lastUnlockedAt: number | null;
}

export interface UnlockSession {
  packageName: string;
  appName: string;
  unlockedAt: number;
  expiresAt: number;
  durationMinutes: number;
  repsCompleted: number;
  isActive: boolean;
}

export interface WorkoutSessionLog {
  id: string;
  date: string;
  timestamp: number;
  reps: number;
  durationSeconds: number;
  unlockedAppName?: string;
  unlockedPackageName?: string;
  formAccuracy: number;
  caloriesBurned: number;
  type: 'app_unlock' | 'free_workout';
}

export interface AppProtectionSettings {
  defaultUnlockMinutes: number;
  defaultPushUpTarget: number;
  strictLockMode: boolean;
  autoRelockOnScreenOff: boolean;
  vibrationOnLock: boolean;
  notifyOnExpire: boolean;
}
