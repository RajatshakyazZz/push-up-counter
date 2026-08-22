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
 * Temporal Exponential Moving Average (EMA) Landmark Smoother
 * Eliminates high-frequency landmark jitter from MediaPipe vision tracking
 */
export class LandmarkSmoother {
  private prevLandmarks: Landmark[] | null = null;
  private alpha: number;

  constructor(alpha: number = 0.65) {
    this.alpha = alpha;
  }

  public smooth(landmarks: Landmark[]): Landmark[] {
    if (!landmarks || landmarks.length === 0) {
      this.prevLandmarks = null;
      return [];
    }

    if (!this.prevLandmarks || this.prevLandmarks.length !== landmarks.length) {
      this.prevLandmarks = landmarks.map((lm) => ({ ...lm }));
      return landmarks;
    }

    const smoothed: Landmark[] = landmarks.map((curr, i) => {
      const prev = this.prevLandmarks![i];
      const currVis = curr.visibility ?? curr.presence ?? 0.5;
      const prevVis = prev.visibility ?? prev.presence ?? 0.5;

      return {
        x: this.alpha * curr.x + (1 - this.alpha) * prev.x,
        y: this.alpha * curr.y + (1 - this.alpha) * prev.y,
        z:
          curr.z !== undefined && prev.z !== undefined
            ? this.alpha * curr.z + (1 - this.alpha) * prev.z
            : curr.z,
        visibility: this.alpha * currVis + (1 - this.alpha) * prevVis,
        presence:
          curr.presence !== undefined
            ? this.alpha * curr.presence +
              (1 - this.alpha) * (prev.presence ?? curr.presence)
            : undefined,
      };
    });

    this.prevLandmarks = smoothed;
    return smoothed;
  }

  public reset(): void {
    this.prevLandmarks = null;
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
 * Checks body orientation, landmark confidence, hand supporting relationship, and spine alignment.
 */
export function validatePushUpPosture(
  landmarks: Landmark[],
  variant: 'standard' | 'knee' | 'incline' = 'standard',
  requiredConfidence: number = 0.30
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

  // Extract key points
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

  const landmarksVisible = upperBodyConf >= 0.25;
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
  const avgShoulderY = midShoulder.y;

  // Torso vector
  const torsoDx = Math.abs(midShoulder.x - midHip.x);
  const torsoDy = Math.abs(midShoulder.y - midHip.y);
  const torsoAngleWithHorizontal = Math.round(
    (Math.atan2(torsoDy, Math.max(0.001, torsoDx)) * 180) / Math.PI
  );

  // Lower Target Point (gracefully fall back to knee/hip if ankles in shadow)
  const lLowerPoint =
    lAnkle && getConf(lAnkle) > 0.2 ? lAnkle : lKnee && getConf(lKnee) > 0.2 ? lKnee : lHip;
  const rLowerPoint =
    rAnkle && getConf(rAnkle) > 0.2 ? rAnkle : rKnee && getConf(rKnee) > 0.2 ? rKnee : rHip;
  const midLowerY = ((lLowerPoint?.y ?? 0) + (rLowerPoint?.y ?? 0)) / 2;

  // 2. Hand / Floor Support Verification
  // In pushups, wrists support the body on the floor/surface:
  // - Wrists must be vertically below or near shoulder level in screen coordinates
  // - Wrists must not be held up near face/in mid-air (avgWristY >= 0.25)
  const areHandsVerticallyAligned = avgWristY >= avgShoulderY - 0.08 && avgWristY >= 0.25;
  const areHandsSupporting = areHandsVerticallyAligned;

  // 3. Multi-Angle Push-Up Plank vs Standing/Sitting Detection
  // Case 1: Side Profile Plank (Camera to the side of user)
  const isSidePlank = torsoAngleWithHorizontal <= (variant === 'incline' ? 68 : 60);

  // Case 2: Front View / Diagonal View Push-Up (Phone on floor looking at user)
  // Hallmarks of front-view push-up on floor:
  // - Hands planted wide on floor: avgWristY >= 0.35 and (wristSpan >= 0.12 or wristSpan >= 0.4 * shoulderSpan)
  // - Shoulders are visible in upper frame supporting upper body
  const isFrontOrDiagonalPlank =
    areHandsSupporting &&
    (shoulderSpan >= 0.08 || wristSpan >= 0.12) &&
    avgWristY >= 0.35;

  // Case 3: Upright Standing / Sitting Rejection
  // Standing upright: Shoulders near top (y < 0.30), feet at bottom (y > 0.75), torso vertical (angle > 70),
  // and hands hanging at hips (wristSpan narrow) or hands in air (avgWristY < avgShoulderY).
  const isUprightStanding =
    !isSidePlank &&
    torsoAngleWithHorizontal > 70 &&
    midShoulder.y < 0.30 &&
    midLowerY > 0.75 &&
    (avgWristY < avgShoulderY || wristSpan < 0.25);

  const isPlankOrientation = (isSidePlank || isFrontOrDiagonalPlank) && !isUprightStanding;
  const orientation: 'horizontal' | 'vertical' | 'unknown' = isPlankOrientation
    ? 'horizontal'
    : isUprightStanding || torsoAngleWithHorizontal >= 75
    ? 'vertical'
    : 'unknown';

  if (!isPlankOrientation || orientation === 'vertical') {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Get down into push-up plank position on the floor',
      orientation,
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal,
      fullBodyAngleWithHorizontal: torsoAngleWithHorizontal,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: true,
      isFullBodyVisible: false,
      areHandsSupporting,
      confidence: upperBodyConf,
    };
  }

  if (!areHandsSupporting) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Place your hands firmly on the ground under shoulders',
      orientation,
      hipAlignmentStatus: 'good',
      torsoAngleWithHorizontal,
      fullBodyAngleWithHorizontal: torsoAngleWithHorizontal,
      isPlankOrientation: true,
      isBodyStraight: true,
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
    if (spineAngle < 110 || spineAngle > 230) {
      isPositionValid = false;
    }
  }

  return {
    isPositionValid,
    positionInvalidReason: isPositionValid ? 'Push-up position locked' : positionInvalidReason,
    orientation,
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
