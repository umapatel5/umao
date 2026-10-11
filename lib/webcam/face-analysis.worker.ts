import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let detector: FaceLandmarker | null = null;

self.onmessage = async (event: MessageEvent) => {
  if (event.data.type === "init") {
    try {
      const files = await FilesetResolver.forVisionTasks(`${event.data.origin}/mediapipe/wasm`);
      detector = await FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: `${event.data.origin}/mediapipe/face_landmarker.task`, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        minFaceDetectionConfidence: 0.65,
        minFacePresenceConfidence: 0.65,
        minTrackingConfidence: 0.65,
        outputFacialTransformationMatrixes: true
      });
      self.postMessage({ type: "ready" });
    } catch {
      self.postMessage({ type: "error" });
    }
    return;
  }
  if (event.data.type !== "frame") return;
  const frame = event.data.frame as ImageBitmap;
  try {
    if (!detector) throw new Error("Not initialized");
    const result = detector.detectForVideo(frame, event.data.timestamp);
    const landmarks = result.faceLandmarks[0];
    const matrix = result.facialTransformationMatrixes[0]?.data;
    const yaw = matrix ? Math.atan2(matrix[8], matrix[10]) * 180 / Math.PI : 0;
    const pitch = matrix ? Math.atan2(-matrix[9], Math.hypot(matrix[8], matrix[10])) * 180 / Math.PI : 0;
    const headPosition = Math.abs(yaw) > 28 ? (yaw > 0 ? "right" : "left") : Math.abs(pitch) > 25 ? (pitch > 0 ? "high" : "low") : "centered";
    // Only aggregate geometry leaves the worker; frames and landmarks are not stored.
    let face = null;
    if (landmarks?.length) {
      const xs = landmarks.map((point) => point.x);
      const ys = landmarks.map((point) => point.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      face = { x: left * frame.width, y: top * frame.height, width: (Math.max(...xs) - left) * frame.width, height: (Math.max(...ys) - top) * frame.height };
    }
    self.postMessage({ type: "result", faces: face ? [face] : [], headPosition, width: frame.width, height: frame.height });
  } catch {
    self.postMessage({ type: "error" });
  } finally {
    frame.close();
  }
};
