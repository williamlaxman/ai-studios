export interface PatientHistory {
  skinType: string;
  previousTreatments: string;
  history: string;
}

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
  classificationLabel?: string;
  classificationPredictions?: { class: string; confidence: number }[];
}

export interface Stats {
  totalDetections: number;
  acneTypesFound: number;
  avgConfidence: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  source: 'Google' | 'User';
}

export interface Clinic {
  name: string;
  address: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  distance?: string;
  reviews?: Review[];
  lat?: number;
  lng?: number;
}
