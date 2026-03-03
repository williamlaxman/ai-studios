import * as tf from '@tensorflow/tfjs';

// Define types for our detection results
export interface DetectionResult {
  annotatedImage: string; // Base64 of the image with boxes
  totalLesions: number;
  counts: Record<string, number>;
  boxes: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
  }>;
}

// Configuration for sliding window
const PATCH_SIZE = 128; // Size of the window on the original image
const STRIDE = 64;      // Step size (overlap)

// Placeholder for the model
let model: tf.LayersModel | tf.GraphModel | null = null;

// Load the model (simulated or real)
export const loadAcneModel = async (modelUrl?: string) => {
  if (model) return model;
  
  try {
    if (modelUrl) {
      // Try loading a real model if URL provided
      // Support both graph and layers models
      try {
        model = await tf.loadGraphModel(modelUrl);
      } catch {
        model = await tf.loadLayersModel(modelUrl);
      }
      console.log("Loaded custom ResNet-50 model");
    } else {
      console.log("No model URL provided, using heuristic simulation for demo.");
    }
  } catch (error) {
    console.error("Failed to load model:", error);
    console.log("Falling back to heuristic simulation.");
  }
  return model;
};

// Helper to check if OpenCV is ready
const waitForOpenCV = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).cv && (window as any).cv.Mat) {
      resolve();
    } else {
      const check = setInterval(() => {
        if ((window as any).cv && (window as any).cv.Mat) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      // Timeout after 10s
      setTimeout(() => {
        clearInterval(check);
        resolve(); // Try anyway or let it fail
      }, 10000);
    }
  });
};

// Main detection function
export const detectAcneSlidingWindow = async (
  imageElement: HTMLImageElement, 
  confidenceThreshold: number = 0.5
): Promise<DetectionResult> => {
  await waitForOpenCV();
  const cv = (window as any).cv;

  // 1. Read image into OpenCV Mat
  const src = cv.imread(imageElement);
  const imgWidth = src.cols;
  const imgHeight = src.rows;

  // Reusable Mats for the loop
  const mean = new cv.Mat();
  const stdDev = new cv.Mat();

  // Store detections
  const detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    class: string;
    confidence: number;
  }> = [];

  // 2. Sliding Window Loop
  // We scan the whole image
  for (let y = 0; y <= imgHeight - PATCH_SIZE; y += STRIDE) {
    for (let x = 0; x <= imgWidth - PATCH_SIZE; x += STRIDE) {
      
      // Extract patch
      const rect = new cv.Rect(x, y, PATCH_SIZE, PATCH_SIZE);
      const currentPatch = src.roi(rect);

      // Resize to 224x224 for ResNet (if we were using a real model)
      // const resizedPatch = new cv.Mat();
      // cv.resize(currentPatch, resizedPatch, new cv.Size(INPUT_SIZE, INPUT_SIZE), 0, 0, cv.INTER_LINEAR);

      // Heuristic Simulation
      cv.meanStdDev(currentPatch, mean, stdDev);
      
      const r = mean.doubleAt(0);
      const g = mean.doubleAt(1);
      const b = mean.doubleAt(2);
      const variance = stdDev.doubleAt(0); // Rough texture metric

      // Simple heuristic: Acne is often redder than surrounding skin and has texture
      const redness = r - (g + b) / 2;
      
      // Simulate confidence based on redness and texture
      let confidence = 0;
      let predictedClass = "Normal Skin";

      if (redness > 20 && variance > 10) {
        // Likely a lesion
        confidence = Math.min(0.99, 0.5 + (redness / 100) * 0.5);
        
        // Assign class based on severity/characteristics
        if (redness > 40) predictedClass = "Pustule"; // More inflamed
        else if (variance > 20) predictedClass = "Nodule"; // Larger/deeper
        else predictedClass = "Papule";
      } else {
        confidence = 0.1; // Low confidence
      }

      // Check threshold
      if (confidence >= confidenceThreshold && predictedClass !== "Normal Skin") {
        detections.push({
          x,
          y,
          width: PATCH_SIZE,
          height: PATCH_SIZE,
          class: predictedClass,
          confidence
        });
      }

      // Cleanup patch memory
      currentPatch.delete();
      // resizedPatch.delete();
    }
  }

  // 3. Non-Maximum Suppression (NMS)
  // Merge overlapping boxes
  // We return ALL detections after NMS with a low threshold, so the UI can filter them later
  const nmsDetections = nonMaximumSuppression(detections, 0.3);

  // Cleanup
  src.delete();
  mean.delete();
  stdDev.delete();

  return {
    annotatedImage: "", // We will generate this dynamically
    totalLesions: nmsDetections.length,
    counts: {},
    boxes: nmsDetections
  };
};

// Function to draw boxes based on current threshold
export const drawAcneDetections = async (
  imageElement: HTMLImageElement,
  boxes: Array<{ x: number; y: number; width: number; height: number; class: string; confidence: number }>,
  threshold: number
): Promise<{ annotatedImage: string; stats: { total: number; counts: Record<string, number> } }> => {
  await waitForOpenCV();
  const cv = (window as any).cv;

  const src = cv.imread(imageElement);
  const outputImg = src.clone();

  const filteredBoxes = boxes.filter(b => b.confidence >= threshold);
  const counts: Record<string, number> = {};

  filteredBoxes.forEach(det => {
    counts[det.class] = (counts[det.class] || 0) + 1;

    // Color based on class
    let color = new cv.Scalar(0, 255, 0, 255); // Green default
    if (det.class === 'Papule') color = new cv.Scalar(255, 0, 0, 255); // Red
    if (det.class === 'Pustule') color = new cv.Scalar(255, 255, 0, 255); // Yellow
    if (det.class === 'Nodule') color = new cv.Scalar(0, 0, 255, 255); // Blue
    if (det.class === 'Whitehead') color = new cv.Scalar(255, 255, 255, 255);
    if (det.class === 'Blackhead') color = new cv.Scalar(0, 0, 0, 255);

    const point1 = new cv.Point(det.x, det.y);
    const point2 = new cv.Point(det.x + det.width, det.y + det.height);
    
    // Draw rectangle
    cv.rectangle(outputImg, point1, point2, color, 2);

    // Draw label
    const text = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
    const fontScale = 0.5;
    const thickness = 1;
    cv.putText(outputImg, text, new cv.Point(det.x, det.y - 5), cv.FONT_HERSHEY_SIMPLEX, fontScale, color, thickness);
  });

  const canvas = document.createElement('canvas');
  cv.imshow(canvas, outputImg);
  const annotatedBase64 = canvas.toDataURL('image/jpeg');

  src.delete();
  outputImg.delete();

  return {
    annotatedImage: annotatedBase64,
    stats: {
      total: filteredBoxes.length,
      counts
    }
  };
};

// Simple NMS implementation

// Simple NMS implementation
function nonMaximumSuppression(
  boxes: Array<{ x: number; y: number; width: number; height: number; confidence: number; class: string }>, 
  iouThreshold: number
) {
  if (boxes.length === 0) return [];

  // Sort by confidence descending
  boxes.sort((a, b) => b.confidence - a.confidence);

  const selected = [];
  const active = new Array(boxes.length).fill(true);

  for (let i = 0; i < boxes.length; i++) {
    if (!active[i]) continue;

    const boxA = boxes[i];
    selected.push(boxA);

    for (let j = i + 1; j < boxes.length; j++) {
      if (!active[j]) continue;

      const boxB = boxes[j];
      const iou = calculateIoU(boxA, boxB);

      if (iou >= iouThreshold) {
        active[j] = false; // Suppress boxB
      }
    }
  }

  return selected;
}

function calculateIoU(a: any, b: any) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);

  if (x2 < x1 || y2 < y1) return 0;

  const intersection = (x2 - x1) * (y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;

  return intersection / (areaA + areaB - intersection);
}
