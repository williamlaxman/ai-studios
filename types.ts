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
}

export interface Stats {
  totalDetections: number;
  acneTypesFound: number;
  avgConfidence: number;
}

export interface FDADrugResult {
  id: string;
  set_id?: string;
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_type?: string[];
  };
  active_ingredient?: string[];
  purpose?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
}
