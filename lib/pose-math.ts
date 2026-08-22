import { Landmark } from '@/types/fitness';

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
 * MediaPipe Pose Landmark Indices:
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

export interface PoseAnalysis {
  dominantSide: 'left' | 'right' | 'both';
  elbowAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  bodyAngle: number; // Shoulder - Hip - Ankle or Knee
  shoulderAngle: number; // Elbow - Shoulder - Hip
  torsoAngleWithHorizontal: number; // 0° = completely horizontal plank, 90° = standing vertically
  isPlankOrientation: boolean; // true when body is in pushup/plank position, false when standing upright
  depthPercentage: number; // 0% (top) to 100% (full depth)
  isBodyStraight: boolean;
  confidence: number;
  landmarksVisible: boolean;
}

/**
 * Evaluates pose landmarks for push-up kinematics with anti-false-positive filtering
 */
export function analyzePushUpPose(
  landmarks: Landmark[],
  upThreshold: number = 150,
  downThreshold: number = 95,
  variant: 'standard' | 'knee' | 'incline' = 'standard'
): PoseAnalysis {
  if (!landmarks || landmarks.length < 29) {
    return {
      dominantSide: 'both',
      elbowAngle: 180,
      leftElbowAngle: 180,
      rightElbowAngle: 180,
      bodyAngle: 180,
      shoulderAngle: 90,
      torsoAngleWithHorizontal: 0,
      isPlankOrientation: false,
      depthPercentage: 0,
      isBodyStraight: true,
      confidence: 0,
      landmarksVisible: false,
    };
  }

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

  // Calculate visibility confidence
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

  // Pick dominant side based on visibility
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
    // Both sides facing camera or 45-degree angle
    dominantSide = leftArmVis >= rightArmVis ? 'left' : 'right';
    elbowAngle = (leftElbowAngle > 0 && rightElbowAngle > 0)
      ? Math.min(leftElbowAngle, rightElbowAngle) * 0.7 + Math.max(leftElbowAngle, rightElbowAngle) * 0.3
      : (dominantSide === 'left' ? leftElbowAngle : rightElbowAngle);
    
    const lLower = variant === 'knee' ? lKnee : (lAnkle || lKnee);
    const rLower = variant === 'knee' ? rKnee : (rAnkle || rKnee);
    const lBody = calculateAngle(lShoulder, lHip, lLower);
    const rBody = calculateAngle(rShoulder, rHip, rLower);
    bodyAngle = dominantSide === 'left' ? lBody : rBody;
    shoulderAngle = dominantSide === 'left' 
      ? calculateAngle(lElbow, lShoulder, lHip)
      : calculateAngle(rElbow, rShoulder, rHip);
  }

  // Calculate Torso Orientation relative to horizontal ground
  // Mid-shoulder to Mid-hip vector
  const midShoulder = {
    x: ((lShoulder?.x ?? 0) + (rShoulder?.x ?? 0)) / 2,
    y: ((lShoulder?.y ?? 0) + (rShoulder?.y ?? 0)) / 2,
  };
  const midHip = {
    x: ((lHip?.x ?? 0) + (rHip?.x ?? 0)) / 2,
    y: ((lHip?.y ?? 0) + (rHip?.y ?? 0)) / 2,
  };

  const dx = Math.abs(midShoulder.x - midHip.x);
  const dy = Math.abs(midShoulder.y - midHip.y);
  
  // Angle with horizontal axis (0° = completely horizontal plank, 90° = vertical standing)
  const angleWithHorizontalRad = Math.atan2(dy, dx);
  const torsoAngleWithHorizontal = Math.round((angleWithHorizontalRad * 180) / Math.PI);

  // In a pushup/plank position, the torso is primarily horizontal or moderately inclined (0° - 55°)
  // If user is standing upright, torso angle is steep (65° - 90°)
  // For incline pushups, allow up to 60°
  const maxAllowableTorsoAngle = variant === 'incline' ? 65 : 58;
  const isPlankOrientation = torsoAngleWithHorizontal <= maxAllowableTorsoAngle;

  // Calculate depth percentage: 0% at upThreshold, 100% at downThreshold
  let depthPercentage = 0;
  if (upThreshold > downThreshold) {
    const rawRatio = (upThreshold - elbowAngle) / (upThreshold - downThreshold);
    depthPercentage = Math.min(100, Math.max(0, Math.round(rawRatio * 100)));
  }

  // Check body alignment: straight line between shoulder, hip, and feet/knees (140° - 195°)
  const isBodyStraight = bodyAngle >= 140 && bodyAngle <= 195;
  const overallConfidence = (leftArmVis + rightArmVis) / 2;
  const landmarksVisible = overallConfidence > 0.3;

  return {
    dominantSide,
    elbowAngle: Math.round(elbowAngle * 10) / 10,
    leftElbowAngle: Math.round(leftElbowAngle * 10) / 10,
    rightElbowAngle: Math.round(rightElbowAngle * 10) / 10,
    bodyAngle: Math.round(bodyAngle * 10) / 10,
    shoulderAngle: Math.round(shoulderAngle * 10) / 10,
    torsoAngleWithHorizontal,
    isPlankOrientation,
    depthPercentage,
    isBodyStraight,
    confidence: overallConfidence,
    landmarksVisible,
  };
}
