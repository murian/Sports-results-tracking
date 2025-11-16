export interface BodyMeasurement {
  id: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  arms?: number;
  calves?: number;
  shoulders?: number;
  neck?: number;
  notes?: string;
}

export interface BodyPhoto {
  id: string;
  date: Date;
  front?: string; // base64 encoded image
  side?: string;
  back?: string;
  notes?: string;
}

export interface SmartScaleData {
  id: string;
  date: Date;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  boneMass?: number;
  waterPercentage?: number;
  visceralFat?: number;
  bmr?: number; // Basal Metabolic Rate
  metabolicAge?: number;
  proteinPercentage?: number;
}

export interface AppData {
  measurements: BodyMeasurement[];
  photos: BodyPhoto[];
  scaleData: SmartScaleData[];
}

export type ViewType = 'dashboard' | 'measurements' | 'photos' | 'scale' | 'progress';
