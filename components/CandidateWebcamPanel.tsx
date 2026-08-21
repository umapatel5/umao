"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, UserRound } from "lucide-react";
import {
  createWebcamMetrics,
  emptyWebcamMetrics,
  markWebcamAnalysisUnavailable
} from "@/lib/webcam/candidate-webcam";
import type {
  CameraPermissionState,
  SpeakingMetrics,
  WebcamAnalysisMetrics
} from "@/types/candidate-analysis";

type FaceDetectorConstructor = new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
};

type FaceDetectorWindow = Window &
  typeof globalThis & {
    FaceDetector?: FaceDetectorConstructor;
  };

type CandidateWebcamPanelProps = {
  onMetricsChange?: (metrics: WebcamAnalysisMetrics) => void;
  speakingMetrics: SpeakingMetrics;
};

const isDevelopment = process.env.NODE_ENV === "development";

export function CandidateWebcamPanel({ onMetricsChange, speakingMetrics }: CandidateWebcamPanelProps) {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const metricsRef = useRef<WebcamAnalysisMetrics>(emptyWebcamMetrics);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<WebcamAnalysisMetrics>(emptyWebcamMetrics);
  const [permissionState, setPermissionState] = useState<CameraPermissionState>("idle");

  const isCameraActive = permissionState === "granted";

  useEffect(() => {
    if (!isCameraActive || !videoRef.current) {
      return;
    }

    const FaceDetector = (window as FaceDetectorWindow).FaceDetector;

    if (!FaceDetector) {
      const unavailableMetrics = markWebcamAnalysisUnavailable(metricsRef.current);
      metricsRef.current = unavailableMetrics;
      setMetrics(unavailableMetrics);
      return;
    }

    let didCancel = false;
    const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
    const intervalId = window.setInterval(() => {
      const video = videoRef.current;

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      detector
        .detect(video)
        .then((faces) => {
          if (didCancel) {
            return;
          }

          const nextMetrics = createWebcamMetrics({
            faces: faces.map((face) => ({
              height: face.boundingBox.height,
              width: face.boundingBox.width,
              x: face.boundingBox.x,
              y: face.boundingBox.y
            })),
            frameHeight: video.videoHeight || video.clientHeight,
            frameWidth: video.videoWidth || video.clientWidth,
            previous: metricsRef.current,
            timestamp: Date.now()
          });

          metricsRef.current = nextMetrics;
          setMetrics(nextMetrics);
          onMetricsChange?.(nextMetrics);
        })
        .catch(() => {
          const unavailableMetrics = markWebcamAnalysisUnavailable(metricsRef.current);
          metricsRef.current = unavailableMetrics;
          setMetrics(unavailableMetrics);
          onMetricsChange?.(unavailableMetrics);
        });
    }, 850);

    return () => {
      didCancel = true;
      window.clearInterval(intervalId);
    };
  }, [isCameraActive, onMetricsChange]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPermissionState((current) => (current === "granted" || current === "requesting" ? "idle" : current));
    metricsRef.current = emptyWebcamMetrics;
    setMetrics(emptyWebcamMetrics);
    onMetricsChange?.(emptyWebcamMetrics);
  }, [onMetricsChange]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  async function startCamera() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      setError("Camera access is not supported in this browser.");
      return;
    }

    setPermissionState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          height: { ideal: 720 },
          width: { ideal: 1280 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setPermissionState("granted");
    } catch (cameraError) {
      setPermissionState("denied");
      setError(getCameraErrorMessage(cameraError));
    }
  }

  return (
    <div className={`candidate-webcam-panel ${isCameraActive ? "active" : ""}`}>
      <div className="candidate-video-shell">
        <video
          aria-label="Candidate webcam preview"
          autoPlay
          className="candidate-video"
          muted
          playsInline
          ref={videoRef}
        />
        {!isCameraActive ? (
          <div className="candidate-video-empty">
            <UserRound aria-hidden size={22} />
            <strong>User webcam</strong>
            <span>{getPermissionLabel(permissionState)}</span>
          </div>
        ) : null}
      </div>

      <div className="candidate-camera-actions">
        <button
          className="icon-button"
          disabled={permissionState === "requesting" || isCameraActive}
          onClick={startCamera}
          title="Start camera"
          type="button"
        >
          <Camera aria-hidden size={16} />
        </button>
        <button
          className="icon-button"
          disabled={!isCameraActive}
          onClick={stopCamera}
          title="Stop camera"
          type="button"
        >
          <CameraOff aria-hidden size={16} />
        </button>
      </div>

      <div className="candidate-attention-row">
        <span className={`attention-dot ${metrics.faceState}`} />
        <span>{formatFaceState(metrics)}</span>
      </div>
      {error ? <div className="camera-error">{error}</div> : null}

      {isDevelopment ? <DevelopmentMetrics metrics={metrics} speakingMetrics={speakingMetrics} /> : null}
    </div>
  );
}

function DevelopmentMetrics({
  metrics,
  speakingMetrics
}: {
  metrics: WebcamAnalysisMetrics;
  speakingMetrics: SpeakingMetrics;
}) {
  return (
    <details className="candidate-dev-metrics" aria-label="Development webcam metrics">
      <summary>Dev metrics</summary>
      <div className="candidate-dev-metrics-grid">
        <div>
          <span>Analysis</span>
          <strong>{metrics.analysisAvailable ? "available" : "unavailable"}</strong>
        </div>
        <div>
          <span>Head</span>
          <strong>{formatMetricLabel(metrics.headPosition)}</strong>
        </div>
        <div>
          <span>Away events</span>
          <strong>{metrics.lookingAwayCount}</strong>
        </div>
        <div>
          <span>Looking away</span>
          <strong>{formatDuration(metrics.lookingAwayMs)}</strong>
        </div>
        <div>
          <span>Extended away</span>
          <strong>{formatDuration(metrics.extendedAwayMs)}</strong>
        </div>
        <div>
          <span>Speaking</span>
          <strong>{formatDuration(speakingMetrics.speakingDurationMs)}</strong>
        </div>
        <div>
          <span>Pauses</span>
          <strong>{speakingMetrics.pauseCount}</strong>
        </div>
        <div>
          <span>Longest pause</span>
          <strong>{formatDuration(speakingMetrics.longestPauseMs)}</strong>
        </div>
      </div>
    </details>
  );
}

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Camera permission was denied. Webcam analysis stays off.";
  }

  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No camera was detected on this device.";
  }

  return "Camera could not be started. You can continue the interview without video.";
}

function getPermissionLabel(permissionState: CameraPermissionState) {
  if (permissionState === "requesting") {
    return "Requesting access";
  }

  if (permissionState === "denied") {
    return "Permission denied";
  }

  if (permissionState === "unsupported") {
    return "Camera unavailable";
  }

  return "Camera off";
}

function formatFaceState(metrics: WebcamAnalysisMetrics) {
  if (!metrics.analysisAvailable && metrics.faceState === "unavailable") {
    return "Face analysis unavailable";
  }

  if (metrics.faceState === "detected") {
    return "Face detected";
  }

  if (metrics.faceState === "not-detected") {
    return "Face not detected";
  }

  return "Face pending";
}

function formatMetricLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDuration(durationMs: number) {
  return `${Math.round(durationMs / 100) / 10}s`;
}
