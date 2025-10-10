/**
 * App Constants
 */

export const APP_NAME = 'NutriScan AI';
export const APP_VERSION = '1.0.0';

// API Configuration
export const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_MODEL = 'gpt-4o';
export const MAX_RETRIES = 3;
export const TIMEOUT_MS = 30000; // 30 seconds
export const MAX_IMAGE_SIZE_MB = 1;
export const MAX_IMAGE_WIDTH = 1024;

// Storage Keys
export const STORAGE_KEYS = {
  THRESHOLDS: 'user_thresholds',
  SETTINGS: 'app_settings',
} as const;

// Nutrient Display Configuration
export const NUTRIENTS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', icon: '📊' },
  { key: 'protein', label: 'Protein', unit: 'g', icon: '💪' },
  { key: 'fat', label: 'Fat', unit: 'g', icon: '🥑' },
  { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g', icon: '🧈' },
  { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g', icon: '🌾' },
  { key: 'sugars', label: 'Sugars', unit: 'g', icon: '🍬' },
  { key: 'fiber', label: 'Fiber', unit: 'g', icon: '🥦' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', icon: '🧂' },
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  CAMERA_PERMISSION_DENIED: 'Camera access is required to scan nutrition labels.',
  GALLERY_PERMISSION_DENIED: 'Photo library access is required to select images.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  API_TIMEOUT: 'Analysis timed out. Please try again.',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment.',
  INVALID_IMAGE: 'Invalid image. Please try a different photo.',
  ANALYSIS_FAILED: 'Failed to analyze image. Please try again.',
  SAVE_FAILED: 'Failed to save settings. Please try again.',
} as const;

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  SHORT: 100,
  MEDIUM: 300,
  LONG: 600,
} as const;
