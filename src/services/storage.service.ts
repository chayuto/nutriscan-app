/**
 * Storage Service - Production-Grade Implementation
 *
 * Provides secure, persistent storage for user settings using expo-secure-store.
 * Includes validation, retry logic, error handling, and graceful fallbacks.
 */

import * as SecureStore from 'expo-secure-store';
import type { NutritionThresholds } from '../types/nutrition.types';
import { DEFAULT_THRESHOLDS } from '../types/nutrition.types';
import { isValidThreshold } from '../utils/validators';

/**
 * Storage keys with namespace prefix to avoid collisions
 */
const STORAGE_KEYS = {
  THRESHOLDS: '@nutriscan:thresholds',
  APP_VERSION: '@nutriscan:app_version',
} as const;

/**
 * Custom error for storage operations
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Interface for storage service (enables testing with mocks)
 */
export interface IStorageService {
  saveThresholds(thresholds: NutritionThresholds): Promise<void>;
  loadThresholds(): Promise<NutritionThresholds>;
  clearThresholds(): Promise<void>;
  hasStoredThresholds(): Promise<boolean>;
}

/**
 * Production-grade storage service implementation
 */
class StorageService implements IStorageService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 100;

  /**
   * Validate threshold data structure
   * Prevents corrupted data from being saved or loaded
   */
  private validateThresholds(data: unknown): data is NutritionThresholds {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const thresholds = data as Record<string, unknown>;

    // Check all required fields exist and are valid positive numbers
    const requiredFields: Array<keyof NutritionThresholds> = [
      'calories',
      'protein',
      'fat',
      'saturatedFat',
      'carbohydrates',
      'sugars',
      'fiber',
      'sodium',
    ];

    return requiredFields.every((field) => {
      const value = thresholds[field];
      return isValidThreshold(value);
    });
  }

  /**
   * Retry logic for transient storage failures
   * Handles temporary issues like device busy, lock screen, etc.
   */
  private async withRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.MAX_RETRIES) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new StorageError(
      `Failed to ${operationName} after ${this.MAX_RETRIES} attempts`,
      operationName,
      lastError
    );
  }

  /**
   * Save user's custom thresholds to secure storage
   *
   * @param thresholds - User's personalized daily nutrition limits
   * @throws {StorageError} If validation fails or storage is unavailable
   */
  async saveThresholds(thresholds: NutritionThresholds): Promise<void> {
    // Validate before saving
    if (!this.validateThresholds(thresholds)) {
      throw new StorageError(
        'Invalid threshold data: all values must be positive numbers',
        'save',
        { data: thresholds }
      );
    }

    try {
      await this.withRetry(async () => {
        const jsonData = JSON.stringify(thresholds);
        await SecureStore.setItemAsync(STORAGE_KEYS.THRESHOLDS, jsonData);
      }, 'save thresholds');

      console.log('✅ Thresholds saved successfully');
    } catch (error) {
      console.error('❌ Failed to save thresholds:', error);
      throw error;
    }
  }

  /**
   * Load user's custom thresholds from secure storage
   *
   * @returns User's thresholds if found, otherwise default FDA guidelines
   * @note Never throws - returns defaults on any error for graceful UX
   */
  async loadThresholds(): Promise<NutritionThresholds> {
    try {
      const jsonData = await this.withRetry(async () => {
        return await SecureStore.getItemAsync(STORAGE_KEYS.THRESHOLDS);
      }, 'load thresholds');

      // No stored data - return defaults
      if (!jsonData) {
        console.log('ℹ️ No stored thresholds found, using defaults');
        return DEFAULT_THRESHOLDS;
      }

      // Parse and validate
      const parsedData = JSON.parse(jsonData);

      if (!this.validateThresholds(parsedData)) {
        console.warn('⚠️ Stored thresholds corrupted, using defaults');
        return DEFAULT_THRESHOLDS;
      }

      console.log('✅ Thresholds loaded successfully');
      return parsedData;
    } catch (error) {
      // Graceful fallback - never break the app
      console.warn('⚠️ Failed to load thresholds, using defaults:', error);
      return DEFAULT_THRESHOLDS;
    }
  }

  /**
   * Clear stored thresholds (reset to defaults)
   * Used when user taps "Reset to Defaults" in Settings
   */
  async clearThresholds(): Promise<void> {
    try {
      await this.withRetry(async () => {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.THRESHOLDS);
      }, 'clear thresholds');

      console.log('✅ Thresholds cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear thresholds:', error);
      throw new StorageError('Failed to clear thresholds', 'clear', error);
    }
  }

  /**
   * Check if user has custom thresholds stored
   * Useful for showing "using defaults" vs "using custom" in UI
   */
  async hasStoredThresholds(): Promise<boolean> {
    try {
      const data = await this.withRetry(async () => {
        return await SecureStore.getItemAsync(STORAGE_KEYS.THRESHOLDS);
      }, 'check stored thresholds');

      return data !== null;
    } catch (error) {
      console.warn('⚠️ Failed to check stored thresholds:', error);
      return false;
    }
  }

  /**
   * Utility: Get all storage keys (for debugging)
   * NOTE: Not used in production, but useful for dev tools
   */
  async debugGetAllKeys(): Promise<string[]> {
    return Object.values(STORAGE_KEYS);
  }

  /**
   * Utility: Clear all app data (for testing/debugging)
   * DANGER: This will delete all user settings!
   */
  async debugClearAll(): Promise<void> {
    try {
      await Promise.all(
        Object.values(STORAGE_KEYS).map((key) =>
          SecureStore.deleteItemAsync(key).catch(() => {
            // Ignore errors - key might not exist
          })
        )
      );
      console.log('🗑️ All storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear all storage:', error);
    }
  }
}

/**
 * Singleton instance - use this throughout the app
 *
 * @example
 * import { storageService } from '@/services/storage.service';
 *
 * // Save thresholds
 * await storageService.saveThresholds(newThresholds);
 *
 * // Load thresholds
 * const thresholds = await storageService.loadThresholds();
 */
export const storageService = new StorageService();

/**
 * Export class for testing purposes
 * Allows creating mock instances in tests
 */
export { StorageService };
