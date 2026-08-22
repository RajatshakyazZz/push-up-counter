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

  const isGoodPosition = analysis.isPositionValid;
  const isDown = analysis.depthPercentage >= 90;

  // Vibrant Electric Green when in valid push-up posture (stays green throughout up/down pushups)
  // Bright Warning Red when posture is invalid (standing, sitting, wrong angle)
  const baseColor = isGoodPosition
    ? (isDown ? '#a3e635' : '#22c55e') // Vibrant Electric Green / Lime-400
    : '#ef4444'; // Bright Warning Red

  const glowShadowColor = isGoodPosition ? '#22c55e' : '#ef4444';

  // 1. Draw connections (Bones)
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const startLm = landmarks[startIdx];
    const endLm = landmarks[endIdx];

    if (!startLm || !endLm) return;
    if ((startLm.visibility ?? 1) < 0.20 || (endLm.visibility ?? 1) < 0.20) return;

    const start = getCoords(startLm);
    const end = getCoords(endLm);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.strokeStyle = baseColor;
    ctx.shadowColor = glowShadowColor;
    ctx.shadowBlur = isGoodPosition ? 10 : 12;

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
    if (!lm || (lm.visibility ?? 1) < 0.25) return;

    const { x, y } = getCoords(lm);
    const isElbow = idx === POSE_INDICES.LEFT_ELBOW || idx === POSE_INDICES.RIGHT_ELBOW;

    // Outer glow ring for active joints
    ctx.beginPath();
    ctx.arc(x, y, isElbow ? 8 : 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = baseColor;
    ctx.shadowColor = glowShadowColor;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Inner center point
    ctx.beginPath();
    ctx.arc(x, y, isElbow ? 3 : 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#000000';
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
