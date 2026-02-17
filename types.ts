export interface User {
  id: string;
  email: string;
  name: string;
}

export interface RoboflowPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  confidence: number;
  color?: string;
}

export interface AnalysisResult {
  predictions: RoboflowPrediction[];
  imageUrl: string;
  imageDimensions: { width: number; height: number };
}

export interface Stats {
  totalDetections: number;
  acneTypesFound: number;
  avgConfidence: number;
}