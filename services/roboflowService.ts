import { RoboflowPrediction, AnalysisResult } from '../types';

/**
 * Default credentials for the Acne Away dataset.
 */
export const DEFAULT_API_KEY = "uM4u4vOQC2ZUxR1RTIp9"; 
export const DEFAULT_MODEL_ENDPOINT = "acne-away-trial-2/1";

export const getCredentials = () => {
  const savedKey = localStorage.getItem('acne_away_api_key');
  const savedModel = localStorage.getItem('acne_away_model_id');
  
  return {
    apiKey: savedKey || DEFAULT_API_KEY,
    modelEndpoint: savedModel || DEFAULT_MODEL_ENDPOINT
  };
};

export const isDemoMode = () => {
  const { apiKey, modelEndpoint } = getCredentials();
  return !apiKey || !modelEndpoint;
};

export const analyzeImage = async (file: File): Promise<AnalysisResult> => {
  const { apiKey, modelEndpoint } = getCredentials();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      const imageData = base64Data.split(',')[1];

      const img = new Image();
      img.src = base64Data;
      await new Promise((res) => (img.onload = res));

      try {
        if (isDemoMode()) {
           console.warn("Using Demo Mode.");
           await new Promise(r => setTimeout(r, 1200));
           
           const mockPredictions: RoboflowPrediction[] = [
             { x: 150, y: 200, width: 45, height: 45, class: "Pustule", confidence: 0.94 },
             { x: 320, y: 160, width: 35, height: 35, class: "Blackhead", confidence: 0.88 },
             { x: 210, y: 350, width: 55, height: 55, class: "Papule", confidence: 0.82 },
             { x: 110, y: 120, width: 30, height: 30, class: "Whitehead", confidence: 0.91 },
           ];
           
           resolve({
             predictions: mockPredictions,
             imageUrl: base64Data,
             imageDimensions: { width: img.width, height: img.height }
           });
           return;
        }

        const response = await fetch(
          `https://detect.roboflow.com/${modelEndpoint}?api_key=${apiKey}`,
          {
            method: "POST",
            body: imageData,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to analyze image. Check your API Key and Model ID in Settings.");
        }

        const data = await response.json();
        resolve({
          predictions: data.predictions,
          imageUrl: base64Data,
          imageDimensions: { width: img.width, height: img.height }
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};