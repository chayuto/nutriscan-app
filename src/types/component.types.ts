/**
 * Component Props Types
 */

import type { NutritionData, NutritionThresholds } from './nutrition.types';

export interface NutrientProgressBarProps {
  label: string;
  value: number | null;
  threshold: number;
  unit: string;
  color?: string;
}

export interface CameraViewProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export interface ReportScreenProps {
  nutritionData: NutritionData;
  thresholds: NutritionThresholds;
  imageUri?: string;
  onBack: () => void;
  onSaveReport?: () => void;
}

export interface SettingsScreenProps {
  thresholds: NutritionThresholds;
  onSave: (thresholds: NutritionThresholds) => void;
  onBack: () => void;
}
