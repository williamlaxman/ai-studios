import { AnalysisResult } from '../types';

/**
 * Default credentials for the Acne Away dataset.
 */
export const DEFAULT_API_KEY = "gK3NBQZ6R9ZXHWtLrKOe"; 
export const DEFAULT_MODEL_ENDPOINT = "acne-away-v1/2";

export const getCredentials = () => {
  // Prioritize environment variables, then local storage (though user requested removal), then defaults
  // Since user asked to remove local storage for history/reviews, we'll keep it for settings for now 
  // or just rely on defaults if they didn't ask to remove settings persistence specifically.
  // However, based on previous instruction to remove local storage, we should probably default to constants
  // if we want to be strict, but usually API keys are kept in env or settings.
  // Let's stick to the pattern but update the defaults.
  
  return {
    apiKey: DEFAULT_API_KEY,
    modelEndpoint: DEFAULT_MODEL_ENDPOINT
  };
};

export const isDemoMode = () => {
  return false; // Always try to use the real model with the provided key
};

export const classifyImage = async (input: File | string): Promise<{ top: string; confidence: number; predictions: any[] }> => {
  const { apiKey, modelEndpoint } = getCredentials();

  let imageData = "";

  if (input instanceof File) {
    imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(input);
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        resolve(base64Data.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  } else {
    // Assume input is base64 string (with or without prefix)
    imageData = input.includes(',') ? input.split(',')[1] : input;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    // Use the CLASSIFY endpoint for ResNet50 models
    const response = await fetch(
      `https://classify.roboflow.com/${modelEndpoint}?api_key=${apiKey}`,
      {
        method: "POST",
        body: imageData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to classify image.");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError') {
        throw new Error("Classification timed out. Please check your internet connection.");
    }
    throw error;
  }
};

export const analyzeImage = async (input: File | string, confidenceThreshold: number = 40, dimensions?: { width: number; height: number }): Promise<AnalysisResult> => {
  const { apiKey, modelEndpoint } = getCredentials();

  let imageData = "";
  let base64Full = "";

  if (input instanceof File) {
    base64Full = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(input);
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = (error) => reject(error);
    });
    imageData = base64Full.split(',')[1];
  } else {
    base64Full = input.includes(',') ? input : `data:image/jpeg;base64,${input}`;
    imageData = input.includes(',') ? input.split(',')[1] : input;
  }

  let imgWidth = 0;
  let imgHeight = 0;

  if (dimensions) {
    imgWidth = dimensions.width;
    imgHeight = dimensions.height;
  } else {
    const img = new Image();
    img.src = base64Full;
    await new Promise((res) => (img.onload = res));
    imgWidth = img.width;
    imgHeight = img.height;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    // Construct URL for Roboflow Inference API with confidence parameter
    const response = await fetch(
      `https://detect.roboflow.com/${modelEndpoint}?api_key=${apiKey}&confidence=${confidenceThreshold}`,
      {
        method: "POST",
        body: imageData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to analyze image. Check your API Key and Model ID.");
    }

    const data = await response.json();
    return {
      predictions: data.predictions,
      imageUrl: base64Full,
      imageDimensions: { width: imgWidth, height: imgHeight }
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
        throw new Error("Detection timed out. Please check your internet connection.");
    }
    throw error;
  }
};
