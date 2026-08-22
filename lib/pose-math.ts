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
  requiredConfidence: number = 0.45
): PostureValidationResult {
  if (!landmarks || landmarks.length < 29) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'No person detected. Position full body in frame.',
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

  const getConf = (lm: Landmark | undefined) =>
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

  // 1. Landmark Confidence Verification
  const shoulderConf = (getConf(lShoulder) + getConf(rShoulder)) / 2;
  const elbowConf = (getConf(lElbow) + getConf(rElbow)) / 2;
  const wristConf = (getConf(lWrist) + getConf(rWrist)) / 2;
  const hipConf = (getConf(lHip) + getConf(rHip)) / 2;
  const lowerConf =
    variant === 'knee'
      ? (getConf(lKnee) + getConf(rKnee)) / 2
      : (getConf(lAnkle) + getConf(rAnkle) + getConf(lKnee) + getConf(rKnee)) / 4;

  const upperBodyConf = (shoulderConf + elbowConf + wristConf) / 3;
  const overallConfidence =
    (shoulderConf + elbowConf + wristConf + hipConf + lowerConf) / 5;

  const landmarksVisible = upperBodyConf >= requiredConfidence;
  const isFullBodyVisible =
    hipConf >= requiredConfidence && lowerConf >= requiredConfidence - 0.1;

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
      confidence: overallConfidence,
    };
  }

  if (hipConf < 0.3) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Make sure your hips and lower body are visible.',
      orientation: 'unknown',
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal: 0,
      fullBodyAngleWithHorizontal: 0,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: true,
      isFullBodyVisible: false,
      areHandsSupporting: false,
      confidence: overallConfidence,
    };
  }

  // 2. Body Orientation Evaluation (Horizontal Plank vs Vertical Standing/Sitting)
  const midShoulder = {
    x: ((lShoulder?.x ?? 0) + (rShoulder?.x ?? 0)) / 2,
    y: ((lShoulder?.y ?? 0) + (rShoulder?.y ?? 0)) / 2,
  };
  const midHip = {
    x: ((lHip?.x ?? 0) + (rHip?.x ?? 0)) / 2,
    y: ((lHip?.y ?? 0) + (rHip?.y ?? 0)) / 2,
  };

  const lowerTarget =
    variant === 'knee'
      ? {
          x: ((lKnee?.x ?? 0) + (rKnee?.x ?? 0)) / 2,
          y: ((lKnee?.y ?? 0) + (rKnee?.y ?? 0)) / 2,
        }
      : {
          x: ((lAnkle?.x ?? lKnee?.x ?? 0) + (rAnkle?.x ?? rKnee?.x ?? 0)) / 2,
          y: ((lAnkle?.y ?? lKnee?.y ?? 0) + (rAnkle?.y ?? rKnee?.y ?? 0)) / 2,
        };

  // Torso vector (Shoulder to Hip)
  const torsoDx = Math.abs(midShoulder.x - midHip.x);
  const torsoDy = Math.abs(midShoulder.y - midHip.y);
  const torsoAngleWithHorizontal = Math.round(
    (Math.atan2(torsoDy, torsoDx) * 180) / Math.PI
  );

  // Full body vector (Shoulder to Lower Body: Ankle/Knee)
  const bodyDx = Math.abs(midShoulder.x - lowerTarget.x);
  const bodyDy = Math.abs(midShoulder.y - lowerTarget.y);
  const fullBodyAngleWithHorizontal = Math.round(
    (Math.atan2(bodyDy, bodyDx) * 180) / Math.PI
  );

  // In a standard pushup, torso angle is typically 0° to 45° (incline allows up to 55°).
  // Standing upright has steep torso angle (65° to 90°) and fullBodyAngle (75° to 90°).
  const maxTorsoAngle = variant === 'incline' ? 60 : 52;
  const maxBodyAngle = variant === 'incline' ? 62 : 55;

  const isPlankOrientation =
    torsoAngleWithHorizontal <= maxTorsoAngle &&
    fullBodyAngleWithHorizontal <= maxBodyAngle;

  const orientation: 'horizontal' | 'vertical' | 'unknown' =
    torsoAngleWithHorizontal <= maxTorsoAngle
      ? 'horizontal'
      : torsoAngleWithHorizontal >= 60
      ? 'vertical'
      : 'unknown';

  if (!isPlankOrientation || orientation === 'vertical') {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Get down into push-up plank position on the floor',
      orientation,
      hipAlignmentStatus: 'invalid',
      torsoAngleWithHorizontal,
      fullBodyAngleWithHorizontal,
      isPlankOrientation: false,
      isBodyStraight: false,
      landmarksVisible: true,
      isFullBodyVisible,
      areHandsSupporting: false,
      confidence: overallConfidence,
    };
  }

  // 3. Supporting Hands & Wrists Relationship
  // In pushups, wrists support the body on the floor/surface:
  // - Wrists must be vertically below or near shoulder level in screen space (y_wrist >= y_shoulder - 0.08)
  // - Rejects hands waving above head or in mid-air
  const avgWristY = ((lWrist?.y ?? 0) + (rWrist?.y ?? 0)) / 2;
  const avgShoulderY = midShoulder.y;

  // If wrists are above shoulders (smaller Y in screen coords), arms are raised in air
  const areHandsVerticallyAligned = avgWristY >= avgShoulderY - 0.08;

  // Wrists should not be extremely wide (span > 0.85 screen width)
  const wristSpan = Math.abs((lWrist?.x ?? 0) - (rWrist?.x ?? 0));
  const areHandsSpanReasonable = wristSpan <= 0.85;

  const areHandsSupporting = areHandsVerticallyAligned && areHandsSpanReasonable;

  if (!areHandsSupporting) {
    return {
      isPositionValid: false,
      positionInvalidReason: 'Place your hands firmly on the ground under shoulders',
      orientation,
      hipAlignmentStatus: 'good',
      torsoAngleWithHorizontal,
      fullBodyAngleWithHorizontal,
      isPlankOrientation: true,
      isBodyStraight: true,
      landmarksVisible: true,
      isFullBodyVisible,
      areHandsSupporting: false,
      confidence: overallConfidence,
    };
  }

  // 4. Spine Alignment / Body Line (Shoulder - Hip - Knee/Ankle)
  const lLower = variant === 'knee' ? lKnee : (lAnkle || lKnee);
  const rLower = variant === 'knee' ? rKnee : (rAnkle || rKnee);

  const leftSpineAngle = calculateAngle(lShoulder, lHip, lLower);
  const rightSpineAngle = calculateAngle(rShoulder, rHip, rLower);
  const spineAngle =
    leftSpineAngle > 0 && rightSpineAngle > 0
      ? (leftSpineAngle + rightSpineAngle) / 2
      : leftSpineAngle || rightSpineAngle || 180;

  let hipAlignmentStatus: 'good' | 'sagging' | 'piked' | 'invalid' = 'good';
  let isBodyStraight = true;

  if (spineAngle < 135) {
    hipAlignmentStatus = 'sagging';
    isBodyStraight = false;
  } else if (spineAngle > 205) {
    hipAlignmentStatus = 'piked';
    isBodyStraight = false;
  }

  let positionInvalidReason = '';
  let isPositionValid = true;

  if (!isBodyStraight) {
    if (hipAlignmentStatus === 'sagging') {
      positionInvalidReason = 'Keep your body straight — lift your hips slightly';
    } else {
      positionInvalidReason = 'Lower your hips to align with your shoulders and feet';
    }
    // Allow slight tolerance in posture gate so beginners can initiate, but flag warning
    if (spineAngle < 125 || spineAngle > 215) {
      isPositionValid = false;
    }
  }

  return {
    isPositionValid,
    positionInvalidReason: isPositionValid ? 'Push-up position locked' : positionInvalidReason,
    orientation,
    hipAlignmentStatus,
    torsoAngleWithHorizontal,
    fullBodyAngleWithHorizontal,
    isPlankOrientation,
    isBodyStraight,
    landmarksVisible: true,
    isFullBodyVisible,
    areHandsSupporting: true,
    confidence: overallConfidence,
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
