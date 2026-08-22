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
 * Adaptive Velocity Landmark Smoother
 * Eliminates skeleton jitter/shake while maintaining zero-latency tracking during fast push-ups.
 */
export class LandmarkSmoother {
  private prevLandmarks: Landmark[] | null = null;

  constructor(_initialAlpha?: number) {}

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

      // Calculate 2D velocity of this keypoint
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      // Clamp extreme 1-frame coordinate teleport artifacts
      let targetX = curr.x;
      let targetY = curr.y;
      if (velocity > 0.16) {
        targetX = prev.x + (dx / velocity) * 0.16;
        targetY = prev.y + (dy / velocity) * 0.16;
      }

      // Dynamic adaptive smoothing:
      // - Near-zero movement: Heavy smoothing (alpha = 0.25) -> rock solid skeleton, zero shake
      // - Rapid push-up movement: High responsiveness (alpha = 0.78) -> zero latency
      const dynamicAlpha = Math.min(0.85, Math.max(0.25, 0.25 + (velocity / 0.035) * 0.60));

      return {
        x: dynamicAlpha * targetX + (1 - dynamicAlpha) * prev.x,
        y: dynamicAlpha * targetY + (1 - dynamicAlpha) * prev.y,
        z:
          curr.z !== undefined && prev.z !== undefined
            ? dynamicAlpha * curr.z + (1 - dynamicAlpha) * prev.z
            : curr.z,
        visibility: dynamicAlpha * currVis + (1 - dynamicAlpha) * prevVis,
        presence:
          curr.presence !== undefined
            ? dynamicAlpha * curr.presence +
              (1 - dynamicAlpha) * (prev.presence ?? curr.presence)
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
 * Guarantees skeleton is GREEN only during genuine push-up plank postures,
 * and strictly RED for standing upright, sitting, hand waving, or bicep curls.
 */
export function validatePushUpPosture(
  landmarks: Landmark[],
  variant: 'standard' | 'knee' | 'incline' = 'standard',
  requiredConfidence: number = 0.25
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

  const landmarksVisible = upperBodyConf >= 0.22;
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
    lAnkle && getConf(lAnkle) > 0.15 ? lAnkle : lKnee && getConf(lKnee) > 0.15 ? lKnee : lHip;
  const rLowerPoint =
    rAnkle && getConf(rAnkle) > 0.15 ? rAnkle : rKnee && getConf(rKnee) > 0.15 ? rKnee : rHip;

  // 2. Dual-Hand Floor Support Verification
  // In a real push-up:
  // - BOTH hands must be on the floor below the shoulders
  // - Neither hand is raised near chin/face (wrist.y must be below shoulder.y)
  // - Both wrists on floor level (avgWristY >= 0.40)
  // - Hand symmetry: Both hands rest on the floor plane (|lWrist.y - rWrist.y| <= 0.22)
  const isLeftWristBelowShoulder = (lWrist?.y ?? 0) >= (lShoulder?.y ?? 0) + 0.10;
  const isRightWristBelowShoulder = (rWrist?.y ?? 0) >= (rShoulder?.y ?? 0) + 0.10;
  const areWristsOnFloor = avgWristY >= 0.40;
  const isHandSymmetryValid = Math.abs((lWrist?.y ?? 0) - (rWrist?.y ?? 0)) <= 0.22;
  const isHandSpanWide = wristSpan >= 0.25 || wristSpan >= 0.60 * Math.max(0.1, shoulderSpan);

  const areHandsSupporting =
    isLeftWristBelowShoulder &&
    isRightWristBelowShoulder &&
    areWristsOnFloor &&
    isHandSymmetryValid &&
    isHandSpanWide;

  // 3. Multi-Angle Push-Up Posture Detection
  // Case A: Side Profile View (Camera positioned to the side of user)
  const isSidePlank =
    areHandsSupporting &&
    torsoAngleWithHorizontal <= (variant === 'incline' ? 68 : 60);

  // Case B: Front View / Diagonal View Push-Up (Phone on floor facing user)
  // - Shoulders are in upper frame (avgShoulderY <= 0.48)
  // - Both hands firmly planted on floor in lower frame (areHandsSupporting === true)
  // - Hips are visible in frame behind/below shoulders (midHip.y >= midShoulder.y + 0.04)
  const isHipVisible = getConf(lHip) >= 0.15 || getConf(rHip) >= 0.15;
  const isHipBehindShoulders = midHip.y >= midShoulder.y + 0.04;
  const isFrontFloorPlank =
    areHandsSupporting &&
    midShoulder.y <= 0.48 &&
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
    if (spineAngle < 110 || spineAngle > 230) {
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
