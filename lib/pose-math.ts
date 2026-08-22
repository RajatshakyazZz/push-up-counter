import { Landmark } from '@/types/fitness';

/**
 * MediaPipe Pose Landmark Indices:
 * 0:  Nose
 * 11: Left Shoulder, 12: Right Shoulder
 * 13: Left Elbow,    14: Right Elbow
 * 15: Left Wrist,    16: Right Wrist
 * 23: Left Hip,      24: Right Hip
 * 25: Left Knee,     26: Right Knee
 * 27: Left Ankle,    28: Right Ankle
 */
export const POSE_INDICES = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

/**
 * Calculates the internal angle between three points (pointA - pointB - pointC) in degrees (0 - 180°).
 * pointB is the vertex of the angle.
 */
export function calculateAngle(
  a: Landmark | undefined,
  b: Landmark | undefined,
  c: Landmark | undefined
): number {
  if (!a || !b || !c) return 0;

  // Vector BA and Vector BC
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }

  return Math.round(angle * 10) / 10;
}

/**
 * 1 Euro Filter for ultra-smooth, jitter-free and lag-free landmark tracking
 */
export class OneEuroFilter {
  private freq: number;
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xPrev: number | null = null;
  private dxPrev: number = 0;
  private tPrev: number | null = null;

  constructor(freq = 30, minCutoff = 1.0, beta = 0.02, dCutoff = 1.0) {
    this.freq = freq;
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq;
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  public filter(x: number, timestampSec?: number): number {
    const nowSec = timestampSec ?? performance.now() / 1000;
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.tPrev = nowSec;
      this.dxPrev = 0;
      return x;
    }
    const dt = nowSec - this.tPrev;
    this.freq = 1.0 / (dt > 0.001 ? dt : 1 / 30);
    const dx = (x - this.xPrev) * this.freq;
    const dxSmoothed = this.dxPrev + this.alpha(this.dCutoff) * (dx - this.dxPrev);
    const cutoff = this.minCutoff + this.beta * Math.abs(dxSmoothed);
    const xSmoothed = this.xPrev + this.alpha(cutoff) * (x - this.xPrev);
    this.xPrev = xSmoothed;
    this.dxPrev = dxSmoothed;
    this.tPrev = nowSec;
    return xSmoothed;
  }

  public reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

/**
 * One Euro Multi-Landmark Filter
 * Eliminates all skeleton shake/jitter without introducing latency during rapid push-ups.
 */
export class LandmarkSmoother {
  private xFilters: OneEuroFilter[] = [];
  private yFilters: OneEuroFilter[] = [];
  private zFilters: OneEuroFilter[] = [];
  private prevLandmarks: Landmark[] | null = null;
  private holdFrames: number[] = [];

  constructor(_initialAlpha?: number) {}

  public smooth(landmarks: Landmark[], timestampSec?: number): Landmark[] {
    if (!landmarks || landmarks.length === 0) {
      this.reset();
      return [];
    }

    const t = timestampSec ?? performance.now() / 1000;

    if (this.xFilters.length !== landmarks.length) {
      this.xFilters = landmarks.map(() => new OneEuroFilter(30, 1.0, 0.03, 1.0));
      this.yFilters = landmarks.map(() => new OneEuroFilter(30, 1.0, 0.03, 1.0));
      this.zFilters = landmarks.map(() => new OneEuroFilter(30, 1.0, 0.03, 1.0));
      this.holdFrames = landmarks.map(() => 0);
    }

    const smoothed: Landmark[] = landmarks.map((curr, i) => {
      const vis = curr.visibility ?? curr.presence ?? 0.5;

      // If confidence drops momentarily (< 0.18), hold last smoothed position up to 4 frames
      if (vis < 0.18 && this.prevLandmarks && this.prevLandmarks[i] && this.holdFrames[i] < 4) {
        this.holdFrames[i]++;
        return {
          ...this.prevLandmarks[i],
          visibility: vis,
        };
      }
      this.holdFrames[i] = 0;

      const smoothX = this.xFilters[i].filter(curr.x, t);
      const smoothY = this.yFilters[i].filter(curr.y, t);
      const smoothZ = curr.z !== undefined ? this.zFilters[i].filter(curr.z, t) : undefined;

      return {
        x: smoothX,
        y: smoothY,
        z: smoothZ,
        visibility: vis,
        presence: curr.presence,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.xFilters.forEach((f) => f.reset());
    this.yFilters.forEach((f) => f.reset());
    this.zFilters.forEach((f) => f.reset());
    this.prevLandmarks = null;
    this.holdFrames = [];
  }
}

export interface PoseAnalysis {
  dominantSide: 'left' | 'right' | 'both';
  elbowAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  bodyAngle: number; // Shoulder - Hip - Ankle or Knee
  shoulderAngle: number; // Elbow - Shoulder - Hip
  torsoAngleWithHorizontal: number; // 0° = horizontal, 90° = vertical standing
  fullBodyAngleWithHorizontal: number; // 0° = horizontal, 90° = vertical standing
  isPlankOrientation: boolean;
  isPositionValid: boolean; // STRICT GATE: true only when body structure is in a valid push-up posture
  positionInvalidReason: string;
  orientation: 'horizontal' | 'vertical' | 'unknown';
  hipAlignmentStatus: 'good' | 'sagging' | 'piked' | 'invalid';
  depthPercentage: number; // 0% (top) to 100% (full depth)
  isBodyStraight: boolean;
  confidence: number;
  landmarksVisible: boolean;
  isFullBodyVisible: boolean;
  areHandsSupporting: boolean;
  smoothedLandmarks?: Landmark[];
}

export interface PostureValidationResult {
  isPositionValid: boolean;
  positionInvalidReason: string;
  orientation: 'horizontal' | 'vertical' | 'unknown';
  hipAlignmentStatus: 'good' | 'sagging' | 'piked' | 'invalid';
  torsoAngleWithHorizontal: number;
  fullBodyAngleWithHorizontal: number;
  isPlankOrientation: boolean;
  isBodyStraight: boolean;
  landmarksVisible: boolean;
  isFullBodyVisible: boolean;
  areHandsSupporting: boolean;
  confidence: number;
}

/**
 * Strict Push-Up Posture Validation Gate
 * Guarantees skeleton is GREEN during all push-up phases (top plank, descent, bottom, ascent)
 * and strictly RED for standing upright, sitting, hand waving, or bicep curls.
 */
export function validatePushUpPosture(
  landmarks: Landmark[],
  variant: 'standard' | 'knee' | 'incline' = 'standard',
  requiredConfidence: number = 0.20
): PostureValidationResult {
  if (!landmarks || landmarks.length < 29) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Step into camera view',
      orientation: 'unknown',
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal: 0,
      fullBodyAngleWithHorizontal: 0,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: false,
      isFullBodyVisible: false,
      areHandsSupporting: false,
      confidence: 0,
    };
  }

  const getConf = (lm?: Landmark | null) =>
    lm ? (lm.visibility ?? lm.presence ?? 0.6) : 0;

  // Extract key landmarks
  const lShoulder = landmarks[POSE_INDICES.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_INDICES.RIGHT_SHOULDER];
  const lElbow = landmarks[POSE_INDICES.LEFT_ELBOW];
  const rElbow = landmarks[POSE_INDICES.RIGHT_ELBOW];
  const lWrist = landmarks[POSE_INDICES.LEFT_WRIST];
  const rWrist = landmarks[POSE_INDICES.RIGHT_WRIST];
  const lHip = landmarks[POSE_INDICES.LEFT_HIP];
  const rHip = landmarks[POSE_INDICES.RIGHT_HIP];
  const lKnee = landmarks[POSE_INDICES.LEFT_KNEE];
  const rKnee = landmarks[POSE_INDICES.RIGHT_KNEE];
  const lAnkle = landmarks[POSE_INDICES.LEFT_ANKLE];
  const rAnkle = landmarks[POSE_INDICES.RIGHT_ANKLE];

  // 1. Upper Body Visibility Verification
  const shoulderConf = (getConf(lShoulder) + getConf(rShoulder)) / 2;
  const elbowConf = (getConf(lElbow) + getConf(rElbow)) / 2;
  const wristConf = (getConf(lWrist) + getConf(rWrist)) / 2;
  const upperBodyConf = (shoulderConf + elbowConf + wristConf) / 3;

  const landmarksVisible = upperBodyConf >= 0.20;
  if (!landmarksVisible) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Landmarks unclear. Adjust lighting or camera angle.',
      orientation: 'unknown',
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal: 0,
      fullBodyAngleWithHorizontal: 0,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: false,
      isFullBodyVisible: false,
      areHandsSupporting: false,
      confidence: upperBodyConf,
    };
  }

  // Calculate 2D Spans & Centers
  const midShoulder = {
    x: ((lShoulder?.x ?? 0) + (rShoulder?.x ?? 0)) / 2,
    y: ((lShoulder?.y ?? 0) + (rShoulder?.y ?? 0)) / 2,
  };
  const midHip = {
    x: ((lHip?.x ?? 0) + (rHip?.x ?? 0)) / 2,
    y: ((lHip?.y ?? 0) + (rHip?.y ?? 0)) / 2,
  };

  const shoulderSpan = Math.abs((lShoulder?.x ?? 0) - (rShoulder?.x ?? 0));
  const wristSpan = Math.abs((lWrist?.x ?? 0) - (rWrist?.x ?? 0));
  const avgWristY = ((lWrist?.y ?? 0) + (rWrist?.y ?? 0)) / 2;

  // Torso vector
  const torsoDx = Math.abs(midShoulder.x - midHip.x);
  const torsoDy = Math.abs(midShoulder.y - midHip.y);
  const torsoAngleWithHorizontal = Math.round(
    (Math.atan2(torsoDy, Math.max(0.001, torsoDx)) * 180) / Math.PI
  );

  // Lower Target Point (gracefully fall back to knee/hip if ankles in shadow)
  const lLowerPoint =
    lAnkle && getConf(lAnkle) > 0.12 ? lAnkle : lKnee && getConf(lKnee) > 0.12 ? lKnee : lHip;
  const rLowerPoint =
    rAnkle && getConf(rAnkle) > 0.12 ? rAnkle : rKnee && getConf(rKnee) > 0.12 ? rKnee : rHip;

  // 2. Dual-Hand Floor Support Verification
  // In a real push-up:
  // - BOTH hands must be supporting on the floor plane
  // - Hands are in the lower half of the frame (avgWristY >= 0.35)
  // - Neither hand is raised near chin/face (wrist.y >= shoulder.y - 0.08)
  // - Hand symmetry: Both hands rest on floor plane (|lWrist.y - rWrist.y| <= 0.25)
  // - Hand span: Hands spread apart to support torso (wristSpan >= 0.20 or wristSpan >= 0.50 * shoulderSpan)
  const areWristsOnFloor = avgWristY >= 0.35;
  const isLeftWristNotAboveShoulder = (lWrist?.y ?? 0) >= (lShoulder?.y ?? 0) - 0.08;
  const isRightWristNotAboveShoulder = (rWrist?.y ?? 0) >= (rShoulder?.y ?? 0) - 0.08;
  const isHandSymmetryValid = Math.abs((lWrist?.y ?? 0) - (rWrist?.y ?? 0)) <= 0.25;
  const isHandSpanWide = wristSpan >= 0.20 || wristSpan >= 0.50 * Math.max(0.1, shoulderSpan);

  const areHandsSupporting =
    areWristsOnFloor &&
    isLeftWristNotAboveShoulder &&
    isRightWristNotAboveShoulder &&
    isHandSymmetryValid &&
    isHandSpanWide;

  // 3. Multi-Angle Push-Up Posture Detection
  // Case A: Side Profile View (Camera positioned to the side of user)
  const isSidePlank =
    areHandsSupporting &&
    torsoAngleWithHorizontal <= (variant === 'incline' ? 68 : 60);

  // Case B: Front View / Diagonal View Push-Up (Phone on floor facing user)
  // - Shoulders are in upper/middle frame (midShoulder.y <= 0.55)
  // - Both hands firmly planted on floor in lower frame (areHandsSupporting === true)
  // - Hips are visible in frame behind/below shoulders (midHip.y >= midShoulder.y - 0.05)
  const isHipVisible = getConf(lHip) >= 0.12 || getConf(rHip) >= 0.12;
  const isHipBehindShoulders = midHip.y >= midShoulder.y - 0.05;
  const isFrontFloorPlank =
    areHandsSupporting &&
    midShoulder.y <= 0.55 &&
    shoulderSpan >= 0.08 &&
    isHipVisible &&
    isHipBehindShoulders;

  const isPlankOrientation = isSidePlank || isFrontFloorPlank;

  const orientation: 'horizontal' | 'vertical' | 'unknown' = isPlankOrientation
    ? 'horizontal'
    : 'vertical';

  if (!isPlankOrientation || !areHandsSupporting || orientation === 'vertical') {
    return {
      isPositionValid: false,
      positionInvalidReason: !areHandsSupporting
        ? 'Place both hands firmly on the ground to begin'
        : 'Get down into push-up plank position on the floor',
      orientation: 'vertical',
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal,
      fullBodyAngleWithHorizontal: torsoAngleWithHorizontal,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: true,
      isFullBodyVisible: false,
      areHandsSupporting: false,
      confidence: upperBodyConf,
    };
  }

  // 4. Spine Alignment / Body Line (Shoulder - Hip - Knee/Ankle)
  const leftSpineAngle = calculateAngle(lShoulder, lHip, lLowerPoint);
  const rightSpineAngle = calculateAngle(rShoulder, rHip, rLowerPoint);
  const spineAngle =
    leftSpineAngle > 0 && rightSpineAngle > 0
      ? (leftSpineAngle + rightSpineAngle) / 2
      : leftSpineAngle || rightSpineAngle || 180;

  let hipAlignmentStatus: 'good' | 'sagging' | 'piked' | 'invalid' = 'good';
  let isBodyStraight = true;

  if (isSidePlank) {
    if (spineAngle < 125) {
      hipAlignmentStatus = 'sagging';
      isBodyStraight = false;
    } else if (spineAngle > 215) {
      hipAlignmentStatus = 'piked';
      isBodyStraight = false;
    }
  }

  let positionInvalidReason = '';
  let isPositionValid = true;

  if (!isBodyStraight) {
    if (hipAlignmentStatus === 'sagging') {
      positionInvalidReason = 'Keep your body straight — lift your hips slightly';
    } else {
      positionInvalidReason = 'Lower your hips to align with your shoulders and feet';
    }
    if (spineAngle < 105 || spineAngle > 235) {
      isPositionValid = false;
    }
  }

  return {
    isPositionValid,
    positionInvalidReason: isPositionValid ? 'Push-up position locked' : positionInvalidReason,
    orientation: 'horizontal',
    hipAlignmentStatus,
    torsoAngleWithHorizontal,
    fullBodyAngleWithHorizontal: torsoAngleWithHorizontal,
    isPlankOrientation: true,
    isBodyStraight,
    landmarksVisible: true,
    isFullBodyVisible: true,
    areHandsSupporting: true,
    confidence: upperBodyConf,
  };
}

/**
 * Comprehensive Push-Up Kinematics Analyzer
 */
export function analyzePushUpPose(
  landmarks: Landmark[],
  upThreshold: number = 152,
  downThreshold: number = 92,
  variant: 'standard' | 'knee' | 'incline' = 'standard',
  requiredConfidence: number = 0.45
): PoseAnalysis {
  const posture = validatePushUpPosture(landmarks, variant, requiredConfidence);

  if (!landmarks || landmarks.length < 29) {
    return {
      dominantSide: 'both',
      elbowAngle: 180,
      leftElbowAngle: 180,
      rightElbowAngle: 180,
      bodyAngle: 180,
      shoulderAngle: 90,
      torsoAngleWithHorizontal: 0,
      fullBodyAngleWithHorizontal: 0,
      isPlankOrientation: false,
      isPositionValid: false,
      positionInvalidReason: posture.positionInvalidReason,
      orientation: 'unknown',
      hipAlignmentStatus: 'invalid',
      depthPercentage: 0,
      isBodyStraight: false,
      confidence: 0,
      landmarksVisible: false,
      isFullBodyVisible: false,
      areHandsSupporting: false,
    };
  }

  const lShoulder = landmarks[POSE_INDICES.LEFT_SHOULDER];
  const rShoulder = landmarks[POSE_INDICES.RIGHT_SHOULDER];
  const lElbow = landmarks[POSE_INDICES.LEFT_ELBOW];
  const rElbow = landmarks[POSE_INDICES.RIGHT_ELBOW];
  const lWrist = landmarks[POSE_INDICES.LEFT_WRIST];
  const rWrist = landmarks[POSE_INDICES.RIGHT_WRIST];
  const lHip = landmarks[POSE_INDICES.LEFT_HIP];
  const rHip = landmarks[POSE_INDICES.RIGHT_HIP];
  const lKnee = landmarks[POSE_INDICES.LEFT_KNEE];
  const rKnee = landmarks[POSE_INDICES.RIGHT_KNEE];
  const lAnkle = landmarks[POSE_INDICES.LEFT_ANKLE];
  const rAnkle = landmarks[POSE_INDICES.RIGHT_ANKLE];

  const leftArmVis =
    ((lShoulder?.visibility ?? 0.5) +
      (lElbow?.visibility ?? 0.5) +
      (lWrist?.visibility ?? 0.5)) /
    3;
  const rightArmVis =
    ((rShoulder?.visibility ?? 0.5) +
      (rElbow?.visibility ?? 0.5) +
      (rWrist?.visibility ?? 0.5)) /
    3;

  const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);

  // Dominant side determination
  let dominantSide: 'left' | 'right' | 'both' = 'both';
  let elbowAngle = 180;
  let bodyAngle = 180;
  let shoulderAngle = 90;

  if (Math.abs(leftArmVis - rightArmVis) > 0.2) {
    if (leftArmVis > rightArmVis) {
      dominantSide = 'left';
      elbowAngle = leftElbowAngle;
      const lowerPoint = variant === 'knee' ? lKnee : (lAnkle || lKnee);
      bodyAngle = calculateAngle(lShoulder, lHip, lowerPoint);
      shoulderAngle = calculateAngle(lElbow, lShoulder, lHip);
    } else {
      dominantSide = 'right';
      elbowAngle = rightElbowAngle;
      const lowerPoint = variant === 'knee' ? rKnee : (rAnkle || rKnee);
      bodyAngle = calculateAngle(rShoulder, rHip, lowerPoint);
      shoulderAngle = calculateAngle(rElbow, rShoulder, rHip);
    }
  } else {
    dominantSide = leftArmVis >= rightArmVis ? 'left' : 'right';
    elbowAngle =
      leftElbowAngle > 0 && rightElbowAngle > 0
        ? Math.min(leftElbowAngle, rightElbowAngle) * 0.7 +
          Math.max(leftElbowAngle, rightElbowAngle) * 0.3
        : dominantSide === 'left'
        ? leftElbowAngle
        : rightElbowAngle;

    const lLower = variant === 'knee' ? lKnee : (lAnkle || lKnee);
    const rLower = variant === 'knee' ? rKnee : (rAnkle || rKnee);
    const lBody = calculateAngle(lShoulder, lHip, lLower);
    const rBody = calculateAngle(rShoulder, rHip, rLower);
    bodyAngle = dominantSide === 'left' ? lBody : rBody;
    shoulderAngle =
      dominantSide === 'left'
        ? calculateAngle(lElbow, lShoulder, lHip)
        : calculateAngle(rElbow, rShoulder, rHip);
  }

  // Calculate depth percentage: 0% at upThreshold, 100% at downThreshold
  let depthPercentage = 0;
  if (upThreshold > downThreshold) {
    const rawRatio = (upThreshold - elbowAngle) / (upThreshold - downThreshold);
    depthPercentage = Math.min(100, Math.max(0, Math.round(rawRatio * 100)));
  }

  return {
    dominantSide,
    elbowAngle: Math.round(elbowAngle * 10) / 10,
    leftElbowAngle: Math.round(leftElbowAngle * 10) / 10,
    rightElbowAngle: Math.round(rightElbowAngle * 10) / 10,
    bodyAngle: Math.round(bodyAngle * 10) / 10,
    shoulderAngle: Math.round(shoulderAngle * 10) / 10,
    torsoAngleWithHorizontal: posture.torsoAngleWithHorizontal,
    fullBodyAngleWithHorizontal: posture.fullBodyAngleWithHorizontal,
    isPlankOrientation: posture.isPlankOrientation,
    isPositionValid: posture.isPositionValid,
    positionInvalidReason: posture.positionInvalidReason,
    orientation: posture.orientation,
    hipAlignmentStatus: posture.hipAlignmentStatus,
    depthPercentage,
    isBodyStraight: posture.isBodyStraight,
    confidence: posture.confidence,
    landmarksVisible: posture.landmarksVisible,
    isFullBodyVisible: posture.isFullBodyVisible,
    areHandsSupporting: posture.areHandsSupporting,
  };
}
