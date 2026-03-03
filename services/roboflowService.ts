import { DetectionResult } from './acneDetection';

export const detectWithRoboflow = async (
  imageFile: File,
  apiKey: string,
  modelId: string
): Promise<DetectionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = (event.target?.result as string).split(',')[1];
        
        // Construct the URL
        // Standard Roboflow Inference Endpoint
        // We assume modelId is in format "project/version" or just "project"
        // Set confidence to 1 (1%) to get all detections and allow client-side filtering
        const url = `https://detect.roboflow.com/${modelId}?api_key=${apiKey}&confidence=1`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: base64Data
        });

        if (!response.ok) {
            throw new Error(`Roboflow API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.predictions) {
            throw new Error("Invalid response from Roboflow");
        }

        // Map predictions to our format
        // Roboflow returns x, y (center), width, height
        // We need x, y (top-left), width, height for OpenCV drawing
        const boxes = data.predictions.map((p: any) => ({
            x: p.x - p.width / 2,
            y: p.y - p.height / 2,
            width: p.width,
            height: p.height,
            class: p.class,
            confidence: p.confidence
        }));

        const counts: Record<string, number> = {};
        boxes.forEach((b: any) => {
            counts[b.class] = (counts[b.class] || 0) + 1;
        });

        resolve({
            annotatedImage: "", // Will be drawn by the frontend
            totalLesions: boxes.length,
            counts,
            boxes
        });

      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(imageFile);
  });
};
