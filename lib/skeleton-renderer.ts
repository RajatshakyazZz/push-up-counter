import { Landmark } from '@/types/fitness';
import { POSE_INDICES, PoseAnalysis } from '@/lib/pose-math';

// Connections for rendering
const POSE_CONNECTIONS = [
  // Torso
  [POSE_INDICES.LEFT_SHOULDER, POSE_INDICES.RIGHT_SHOULDER],
  [POSE_INDICES.LEFT_SHOULDER, POSE_INDICES.LEFT_HIP],
  [POSE_INDICES.RIGHT_SHOULDER, POSE_INDICES.RIGHT_HIP],
  [POSE_INDICES.LEFT_HIP, POSE_INDICES.RIGHT_HIP],
  // Left Arm
  [POSE_INDICES.LEFT_SHOULDER, POSE_INDICES.LEFT_ELBOW],
  [POSE_INDICES.LEFT_ELBOW, POSE_INDICES.LEFT_WRIST],
  // Right Arm
  [POSE_INDICES.RIGHT_SHOULDER, POSE_INDICES.RIGHT_ELBOW],
  [POSE_INDICES.RIGHT_ELBOW, POSE_INDICES.RIGHT_WRIST],
  // Left Leg
  [POSE_INDICES.LEFT_HIP, POSE_INDICES.LEFT_KNEE],
  [POSE_INDICES.LEFT_KNEE, POSE_INDICES.LEFT_ANKLE],
  // Right Leg
  [POSE_INDICES.RIGHT_HIP, POSE_INDICES.RIGHT_KNEE],
  [POSE_INDICES.RIGHT_KNEE, POSE_INDICES.RIGHT_ANKLE],
];

interface RenderOptions {
  showSkeleton: boolean;
  showAngles: boolean;
  mirror: boolean;
  phase: string;
}

/**
 * Draws the interactive fitness pose skeleton on the canvas
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  analysis: PoseAnalysis,
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!landmarks || landmarks.length < 29 || !options.showSkeleton) {
    return;
  }

  // Helper coordinate mapper
  const getCoords = (lm: Landmark) => {
    const x = options.mirror ? (1 - lm.x) * canvasWidth : lm.x * canvasWidth;
    const y = lm.y * canvasHeight;
    return { x, y };
  };

  const isDown = analysis.depthPercentage >= 90;
  const isGoodForm = analysis.isBodyStraight && analysis.isPositionValid;

  // Set line styling
  const baseColor = !analysis.isPositionValid
    ? '#fbbf24' // amber-400 when posture not in push-up plank
    : isDown
    ? '#a3e635' // lime-400 when target depth reached
    : '#84cc16'; // lime-500 tracking color

  const warnColor = '#f59e0b'; // amber warning if hips sag or invalid orientation

  // 1. Draw connections (Bones)
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const startLm = landmarks[startIdx];
    const endLm = landmarks[endIdx];

    if (!startLm || !endLm) return;
    if ((startLm.visibility ?? 1) < 0.25 || (endLm.visibility ?? 1) < 0.25) return;

    const start = getCoords(startLm);
    const end = getCoords(endLm);

    // Dynamic color for arm vs torso
    const isArm =
      startIdx === POSE_INDICES.LEFT_SHOULDER ||
      startIdx === POSE_INDICES.RIGHT_SHOULDER ||
      startIdx === POSE_INDICES.LEFT_ELBOW ||
      startIdx === POSE_INDICES.RIGHT_ELBOW;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    if (isArm) {
      ctx.strokeStyle = baseColor;
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 10;
    } else if (!isGoodForm) {
      ctx.strokeStyle = warnColor;
      ctx.shadowColor = warnColor;
      ctx.shadowBlur = 6;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.shadowBlur = 0;
    }

    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // 2. Draw Key Joint Nodes
  const keyNodes = [
    POSE_INDICES.LEFT_SHOULDER,
    POSE_INDICES.RIGHT_SHOULDER,
    POSE_INDICES.LEFT_ELBOW,
    POSE_INDICES.RIGHT_ELBOW,
    POSE_INDICES.LEFT_WRIST,
    POSE_INDICES.RIGHT_WRIST,
    POSE_INDICES.LEFT_HIP,
    POSE_INDICES.RIGHT_HIP,
    POSE_INDICES.LEFT_KNEE,
    POSE_INDICES.RIGHT_KNEE,
    POSE_INDICES.LEFT_ANKLE,
    POSE_INDICES.RIGHT_ANKLE,
  ];

  keyNodes.forEach((idx) => {
    const lm = landmarks[idx];
    if (!lm || (lm.visibility ?? 1) < 0.3) return;

    const { x, y } = getCoords(lm);
    const isElbow = idx === POSE_INDICES.LEFT_ELBOW || idx === POSE_INDICES.RIGHT_ELBOW;

    // Outer glow ring for active joints
    ctx.beginPath();
    ctx.arc(x, y, isElbow ? 8 : 5, 0, 2 * Math.PI);
    ctx.fillStyle = isElbow ? baseColor : '#ffffff';
    ctx.shadowColor = isElbow ? baseColor : 'transparent';
    ctx.shadowBlur = isElbow ? 12 : 0;
    ctx.fill();

    // Inner center point
    ctx.beginPath();
    ctx.arc(x, y, isElbow ? 3 : 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // 3. Draw Angle Badges & Arcs
  if (options.showAngles) {
    const dominantElbowIdx =
      analysis.dominantSide === 'left'
        ? POSE_INDICES.LEFT_ELBOW
        : POSE_INDICES.RIGHT_ELBOW;

    const elbowLm = landmarks[dominantElbowIdx];
    if (elbowLm && (elbowLm.visibility ?? 1) > 0.35) {
      const { x, y } = getCoords(elbowLm);

      // Angle indicator pill
      const angleText = `${Math.round(analysis.elbowAngle)}°`;
      ctx.font = 'bold 13px system-ui, sans-serif';
      const textWidth = ctx.measureText(angleText).width;
      const padding = 6;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = 22;
      const boxX = x - boxWidth / 2;
      const boxY = y - 28;

      // Pill background
      ctx.fillStyle = isDown ? 'rgba(163, 230, 53, 0.95)' : 'rgba(24, 24, 27, 0.9)';
      ctx.strokeStyle = isDown ? '#ffffff' : '#a3e635';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(angleText, x, boxY + boxHeight / 2);
    }

    // Hip angle indicator if hip is sagged
    const dominantHipIdx =
      analysis.dominantSide === 'left'
        ? POSE_INDICES.LEFT_HIP
        : POSE_INDICES.RIGHT_HIP;
    const hipLm = landmarks[dominantHipIdx];
    if (hipLm && (hipLm.visibility ?? 1) > 0.35 && !analysis.isBodyStraight) {
      const { x, y } = getCoords(hipLm);
      const hipText = `Hip: ${Math.round(analysis.bodyAngle)}°`;
      ctx.font = '600 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(hipText).width;
      const boxX = x - (textWidth + 12) / 2;
      const boxY = y - 24;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, textWidth + 12, 18, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hipText, x, boxY + 9);
    }
  }
}
