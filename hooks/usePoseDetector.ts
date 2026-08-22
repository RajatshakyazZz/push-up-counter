'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Landmark, PushUpSettings } from '@/types/fitness';
import { analyzePushUpPose, PoseAnalysis, LandmarkSmoother } from '@/lib/pose-math';
import { drawPoseSkeleton } from '@/lib/skeleton-renderer';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export function usePoseDetector(
  settings: PushUpSettings,
  currentPhase: string,
  onPoseFrame: (analysis: PoseAnalysis) => void
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<PoseAnalysis | null>(null);

  const fpsCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const smootherRef = useRef<LandmarkSmoother>(new LandmarkSmoother(0.65));

  // 1. Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        });

        if (!isMounted) return;
        landmarkerRef.current = landmarker;
        setModelLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize MediaPipe PoseLandmarker:', err);
        if (isMounted) {
          setIsLoading(false);
          setCameraError(
            'Could not load MediaPipe AI model. Please check network connection.'
          );
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // 2. Fetch available camera devices
  const getCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.debug('Error listing cameras:', err);
    }
  }, [selectedCameraId]);

  // 3. Start Camera Stream
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setCameraError(null);
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user',
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsCameraActive(true);
          getCameraDevices();
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Camera access error:', error);
        setIsCameraActive(false);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else {
          setCameraError(`Camera error: ${error.message || 'Unable to open camera'}`);
        }
      }
    },
    [getCameraDevices]
  );

  // 4. Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    smootherRef.current.reset();
    setIsCameraActive(false);
  }, []);

  // 5. Change Camera
  const switchCamera = useCallback(
    (deviceId: string) => {
      setSelectedCameraId(deviceId);
      startCamera(deviceId);
    },
    [startCamera]
  );

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const currentPhaseRef = useRef(currentPhase);
  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  const onPoseFrameRef = useRef(onPoseFrame);
  useEffect(() => {
    onPoseFrameRef.current = onPoseFrame;
  }, [onPoseFrame]);

  const lastStateUpdateTimeRef = useRef<number>(0);

  // 6. Frame Loop for Real-time Pose Detection
  useEffect(() => {
    let animationFrameId: number;

    const detectFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        landmarkerRef.current &&
        isCameraActive
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const startTimeMs = performance.now();
          const currentSettings = settingsRef.current;
          const currentPhaseVal = currentPhaseRef.current;

          // Calculate FPS
          fpsCountRef.current++;
          if (startTimeMs - fpsTimeRef.current >= 1000) {
            setFps(Math.round((fpsCountRef.current * 1000) / (startTimeMs - fpsTimeRef.current)));
            fpsCountRef.current = 0;
            fpsTimeRef.current = startTimeMs;
          }

          try {
            const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

            if (results.landmarks && results.landmarks.length > 0) {
              const rawLandmarks = results.landmarks[0] as Landmark[];
              // Smooth landmarks temporally with OneEuroFilter
              const currentLandmarks = smootherRef.current.smooth(rawLandmarks, startTimeMs / 1000);

              const analysis = analyzePushUpPose(
                currentLandmarks,
                currentSettings.upAngleThreshold,
                currentSettings.downAngleThreshold,
                currentSettings.pushUpVariant,
                currentSettings.requiredConfidence
              );
              analysis.smoothedLandmarks = currentLandmarks;

              // Send to tracker immediately on every frame (zero latency)
              onPoseFrameRef.current(analysis);

              // Throttle React state updates to 10 Hz to prevent UI re-render bottleneck
              if (startTimeMs - lastStateUpdateTimeRef.current > 100) {
                lastStateUpdateTimeRef.current = startTimeMs;
                setLandmarks(currentLandmarks);
                setLatestAnalysis(analysis);
              }

              // Render skeleton directly to canvas at 60 FPS
              if (canvas) {
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                }
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  drawPoseSkeleton(
                    ctx,
                    currentLandmarks,
                    analysis,
                    canvas.width,
                    canvas.height,
                    {
                      showSkeleton: currentSettings.showSkeleton,
                      showAngles: currentSettings.showAngles,
                      mirror: currentSettings.mirrorVideo,
                      phase: currentPhaseVal,
                    }
                  );
                }
              }
            } else {
              // No person detected in this frame
              smootherRef.current.reset();
              const emptyAnalysis: PoseAnalysis = {
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
                positionInvalidReason: 'No person detected. Position full body in frame.',
                orientation: 'unknown',
                hipAlignmentStatus: 'invalid',
                depthPercentage: 0,
                isBodyStraight: false,
                confidence: 0,
                landmarksVisible: false,
                isFullBodyVisible: false,
                areHandsSupporting: false,
              };

              onPoseFrameRef.current(emptyAnalysis);

              if (startTimeMs - lastStateUpdateTimeRef.current > 150) {
                lastStateUpdateTimeRef.current = startTimeMs;
                setLandmarks([]);
                setLatestAnalysis(emptyAnalysis);
              }

              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          } catch (detectionErr) {
            console.debug('Pose detection tick error:', detectionErr);
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectFrame);
      requestRef.current = animationFrameId;
    };

    if (isCameraActive && modelLoaded) {
      animationFrameId = requestAnimationFrame(detectFrame);
      requestRef.current = animationFrameId;
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isCameraActive, modelLoaded]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    modelLoaded,
    isCameraActive,
    cameraError,
    cameras,
    selectedCameraId,
    fps,
    landmarks,
    latestAnalysis,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
