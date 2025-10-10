/**
 * Storage Service - Unit Tests
 * 
 * Tests validation, retry logic, error handling, and graceful fallbacks
 */

import { StorageService, StorageError } from '../storage.service';
import { DEFAULT_THRESHOLDS } from '../../types/nutrition.types';
import type { NutritionThresholds } from '../../types/nutrition.types';

// Get mocked SecureStore
const SecureStore = require('expo-secure-store');

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // Create fresh instance for each test
    storageService = new StorageService();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('saveThresholds', () => {
    const validThresholds: NutritionThresholds = {
      calories: 2000,
      protein: 50,
      fat: 70,
      saturatedFat: 20,
      carbohydrates: 275,
      sugars: 50,
      fiber: 25,
      sodium: 2300,
    };

    it('should save valid thresholds successfully', async () => {
      // Mock successful save
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await storageService.saveThresholds(validThresholds);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        '@nutriscan:thresholds',
        JSON.stringify(validThresholds)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid thresholds (negative values)', async () => {
      const invalidThresholds = {
        ...validThresholds,
        calories: -100, // Invalid!
      };

      await expect(
        storageService.saveThresholds(invalidThresholds)
      ).rejects.toThrow(StorageError);

      // Should not attempt to save
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should reject invalid thresholds (non-numeric values)', async () => {
      const invalidThresholds = {
        ...validThresholds,
        protein: 'fifty' as any, // Invalid!
      };

      await expect(
        storageService.saveThresholds(invalidThresholds)
      ).rejects.toThrow(StorageError);

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should retry on transient failures', async () => {
      // Fail twice, succeed on third attempt
      (SecureStore.setItemAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Device locked'))
        .mockRejectedValueOnce(new Error('Storage busy'))
        .mockResolvedValueOnce(undefined);

      await storageService.saveThresholds(validThresholds);

      // Should have retried 3 times total
      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should throw StorageError after max retries', async () => {
      // Fail all 3 attempts
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage unavailable')
      );

      await expect(
        storageService.saveThresholds(validThresholds)
      ).rejects.toThrow(StorageError);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('loadThresholds', () => {
    it('should load stored thresholds successfully', async () => {
      const storedThresholds: NutritionThresholds = {
        calories: 1800,
        protein: 60,
        fat: 65,
        saturatedFat: 18,
        carbohydrates: 250,
        sugars: 40,
        fiber: 30,
        sodium: 2000,
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(storedThresholds)
      );

      const result = await storageService.loadThresholds();

      expect(result).toEqual(storedThresholds);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('@nutriscan:thresholds');
    });

    it('should return defaults when no data stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await storageService.loadThresholds();

      expect(result).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should return defaults when stored data is corrupted', async () => {
      // Invalid JSON
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        '{invalid json}'
      );

      const result = await storageService.loadThresholds();

      expect(result).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should return defaults when stored data is invalid', async () => {
      // Valid JSON but invalid threshold structure
      const invalidData = {
        calories: -100, // Negative!
        protein: 50,
        // Missing other fields
      };

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(invalidData)
      );

      const result = await storageService.loadThresholds();

      expect(result).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should return defaults on storage error (graceful fallback)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage unavailable')
      );

      // Should NOT throw - graceful fallback
      const result = await storageService.loadThresholds();

      expect(result).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should retry on transient failures', async () => {
      const storedThresholds = DEFAULT_THRESHOLDS;

      // Fail twice, succeed on third attempt
      (SecureStore.getItemAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Device locked'))
        .mockRejectedValueOnce(new Error('Storage busy'))
        .mockResolvedValueOnce(JSON.stringify(storedThresholds));

      const result = await storageService.loadThresholds();

      expect(result).toEqual(storedThresholds);
      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('clearThresholds', () => {
    it('should clear thresholds successfully', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await storageService.clearThresholds();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@nutriscan:thresholds');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      // Fail twice, succeed on third attempt
      (SecureStore.deleteItemAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Device locked'))
        .mockRejectedValueOnce(new Error('Storage busy'))
        .mockResolvedValueOnce(undefined);

      await storageService.clearThresholds();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });

    it('should throw StorageError after max retries', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage unavailable')
      );

      await expect(storageService.clearThresholds()).rejects.toThrow(StorageError);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('hasStoredThresholds', () => {
    it('should return true when thresholds are stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(DEFAULT_THRESHOLDS)
      );

      const result = await storageService.hasStoredThresholds();

      expect(result).toBe(true);
    });

    it('should return false when no thresholds stored', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const result = await storageService.hasStoredThresholds();

      expect(result).toBe(false);
    });

    it('should return false on error (graceful fallback)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error('Storage unavailable')
      );

      const result = await storageService.hasStoredThresholds();

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values correctly', async () => {
      const thresholdsWithZero = {
        ...DEFAULT_THRESHOLDS,
        fiber: 0, // User doesn't care about fiber
      };

      await expect(
        storageService.saveThresholds(thresholdsWithZero)
      ).rejects.toThrow(StorageError); // Zero is not valid (must be positive)
    });

    it('should handle very large values', async () => {
      const thresholdsWithLargeValues = {
        ...DEFAULT_THRESHOLDS,
        calories: 50000, // Bodybuilder diet
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await storageService.saveThresholds(thresholdsWithLargeValues);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    });

    it('should handle decimal values', async () => {
      const thresholdsWithDecimals = {
        ...DEFAULT_THRESHOLDS,
        protein: 52.5,
        fat: 68.3,
      };

      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await storageService.saveThresholds(thresholdsWithDecimals);

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    });
  });
});
