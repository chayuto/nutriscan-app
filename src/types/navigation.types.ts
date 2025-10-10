/**
 * Navigation & View State Types
 */

export type ViewName = 'home' | 'camera' | 'report' | 'settings';

export interface AppState {
  currentView: ViewName;
  isLoading: boolean;
  error: string | null;
  nutritionData: NutritionData | null;
  thresholds: NutritionThresholds;
}

// Import types from other files
import type { NutritionData, NutritionThresholds } from './nutrition.types';
