/**
 * Tests for useThresholds hook
 *
 * Tests cover:
 * - Initial threshold loading from storage
 * - Threshold updates with debounced save
 * - Reset to defaults
 * - Loading and saving states
 * - Error handling
 * - Debounce behavior with jest fake timers
 * - Unmount cleanup
 */

// Mock storage service BEFORE imports
jest.mock('@/services/storage.service', () => ({
  storageService: {
    loadThresholds: jest.fn(),
    saveThresholds: jest.fn(),
  },
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useThresholds } from '../useThresholds';
import { storageService } from '@/services/storage.service';
import { DEFAULT_THRESHOLDS, NutritionThresholds } from '@/types/nutrition.types';

// Enable fake timers for debounce testing
jest.useFakeTimers();

describe('useThresholds', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  // Restore real timers after each test
  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initial Loading', () => {
    it('should initialize with default thresholds', () => {
      (storageService.loadThresholds as jest.Mock).mockResolvedValue(DEFAULT_THRESHOLDS);

      const { result } = renderHook(() => useThresholds());

      expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load thresholds from storage on mount', async () => {
      const customThresholds: NutritionThresholds = {
        ...DEFAULT_THRESHOLDS,
        calories: 1800,
        protein: 60,
      };

      (storageService.loadThresholds as jest.Mock).mockResolvedValue(customThresholds);

      const { result } = renderHook(() => useThresholds());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // Wait for load to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(storageService.loadThresholds).toHaveBeenCalledTimes(1);
      expect(result.current.thresholds).toEqual(customThresholds);
      expect(result.current.error).toBeNull();
    });

    it('should handle load errors and keep defaults', async () => {
      const loadError = new Error('Storage unavailable');
      (storageService.loadThresholds as jest.Mock).mockRejectedValue(loadError);

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Storage unavailable');
      expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS);
      expect(console.error).toHaveBeenCalledWith('[useThresholds] Load error:', loadError);
    });

    it('should handle non-Error objects in load failure', async () => {
      (storageService.loadThresholds as jest.Mock).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load thresholds');
      expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS);
    });
  });

  describe('updateThreshold', () => {
    beforeEach(() => {
      (storageService.loadThresholds as jest.Mock).mockResolvedValue(DEFAULT_THRESHOLDS);
      (storageService.saveThresholds as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update threshold optimistically', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update calories
      act(() => {
        result.current.updateThreshold('calories', 1800);
      });

      // UI updates immediately (optimistic)
      expect(result.current.thresholds.calories).toBe(1800);
      expect(result.current.error).toBeNull();

      // Save hasn't been called yet (debounced)
      expect(storageService.saveThresholds).not.toHaveBeenCalled();
    });

    it('should debounce save after 500ms', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update threshold
      act(() => {
        result.current.updateThreshold('protein', 60);
      });

      // Save not called immediately
      expect(storageService.saveThresholds).not.toHaveBeenCalled();

      // Fast-forward 499ms (not enough)
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(storageService.saveThresholds).not.toHaveBeenCalled();

      // Fast-forward 1ms more (total 500ms)
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Now save should be called
      await waitFor(() => {
        expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
        expect(storageService.saveThresholds).toHaveBeenCalledWith({
          ...DEFAULT_THRESHOLDS,
          protein: 60,
        });
      });
    });

    it('should reset debounce timer on rapid updates', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update 1
      act(() => {
        result.current.updateThreshold('calories', 1800);
      });

      // Fast-forward 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Update 2 (resets timer)
      act(() => {
        result.current.updateThreshold('calories', 1900);
      });

      // Fast-forward 300ms (total 600ms from first update, but only 300ms from second)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Save should NOT be called yet (timer was reset)
      expect(storageService.saveThresholds).not.toHaveBeenCalled();

      // Fast-forward remaining 200ms (total 500ms from second update)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Now save should be called with latest value
      await waitFor(() => {
        expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
        expect(storageService.saveThresholds).toHaveBeenCalledWith({
          ...DEFAULT_THRESHOLDS,
          calories: 1900,
        });
      });
    });

    it('should save only latest value after multiple rapid updates', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Multiple rapid updates
      act(() => {
        result.current.updateThreshold('fat', 60);
        result.current.updateThreshold('fat', 65);
        result.current.updateThreshold('fat', 70);
      });

      // Fast-forward past debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should only save once with latest value
      await waitFor(() => {
        expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
        expect(storageService.saveThresholds).toHaveBeenCalledWith({
          ...DEFAULT_THRESHOLDS,
          fat: 70,
        });
      });
    });

    it('should set isSaving state during save', async () => {
      let resolveSave: (() => void) | undefined;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      (storageService.saveThresholds as jest.Mock).mockReturnValue(savePromise);

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update and trigger save
      act(() => {
        result.current.updateThreshold('sugars', 40);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Resolve save
      act(() => {
        if (resolveSave) {
          resolveSave();
        }
      });

      // Should finish saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it('should handle save errors', async () => {
      const saveError = new Error('Storage write failed');
      (storageService.saveThresholds as jest.Mock).mockRejectedValue(saveError);

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update and trigger save
      act(() => {
        result.current.updateThreshold('fiber', 30);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should show error
      await waitFor(() => {
        expect(result.current.error).toBe('Storage write failed');
        expect(result.current.isSaving).toBe(false);
      });

      expect(console.error).toHaveBeenCalledWith('[useThresholds] Save error:', saveError);
    });

    it('should reject negative values', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalCalories = result.current.thresholds.calories;

      // Try to set negative value
      act(() => {
        result.current.updateThreshold('calories', -100);
      });

      // Should show error and not update
      expect(result.current.error).toBe('Threshold must be a positive number');
      expect(result.current.thresholds.calories).toBe(originalCalories);

      // Should not trigger save
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(storageService.saveThresholds).not.toHaveBeenCalled();
    });

    it('should reject NaN values', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalProtein = result.current.thresholds.protein;

      // Try to set NaN
      act(() => {
        result.current.updateThreshold('protein', NaN);
      });

      // Should show error and not update
      expect(result.current.error).toBe('Threshold must be a positive number');
      expect(result.current.thresholds.protein).toBe(originalProtein);
    });

    it('should clear error on successful update', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set an error first
      act(() => {
        result.current.updateThreshold('calories', -100);
      });
      expect(result.current.error).toBe('Threshold must be a positive number');

      // Valid update should clear error
      act(() => {
        result.current.updateThreshold('calories', 1800);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('resetToDefaults', () => {
    beforeEach(() => {
      (storageService.loadThresholds as jest.Mock).mockResolvedValue({
        ...DEFAULT_THRESHOLDS,
        calories: 1800,
      });
      (storageService.saveThresholds as jest.Mock).mockResolvedValue(undefined);
    });

    it('should reset to default values immediately', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify custom values loaded
      expect(result.current.thresholds.calories).toBe(1800);

      // Reset
      await act(async () => {
        await result.current.resetToDefaults();
      });

      // Should have defaults
      expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should save defaults immediately (no debounce)', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset
      await act(async () => {
        await result.current.resetToDefaults();
      });

      // Save should be called immediately (not debounced)
      expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
      expect(storageService.saveThresholds).toHaveBeenCalledWith(DEFAULT_THRESHOLDS);
    });

    it('should cancel pending debounced save on reset', async () => {
      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update (starts debounce)
      act(() => {
        result.current.updateThreshold('calories', 1800);
      });

      // Fast-forward 300ms (not enough to trigger save)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Reset (should cancel pending save)
      await act(async () => {
        await result.current.resetToDefaults();
      });

      // Fast-forward remaining time
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Only reset save should have been called (not the update)
      expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
      expect(storageService.saveThresholds).toHaveBeenCalledWith(DEFAULT_THRESHOLDS);
    });

    it('should handle reset save errors', async () => {
      const resetError = new Error('Reset save failed');
      (storageService.saveThresholds as jest.Mock).mockRejectedValue(resetError);

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset
      await act(async () => {
        await result.current.resetToDefaults();
      });

      // Should show error
      expect(result.current.error).toBe('Reset save failed');
      expect(console.error).toHaveBeenCalledWith('[useThresholds] Reset error:', resetError);

      // UI should still show defaults (optimistic)
      expect(result.current.thresholds).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should set isSaving state during reset', async () => {
      // Use real timers for this async state test
      jest.useRealTimers();

      let resolveReset: (() => void) | undefined;
      const resetPromise = new Promise<void>((resolve) => {
        resolveReset = resolve;
      });
      (storageService.saveThresholds as jest.Mock).mockReturnValue(resetPromise);

      const { result } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start reset (don't await yet)
      const resetCall = result.current.resetToDefaults();

      // Should be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Resolve the save
      if (resolveReset) {
        resolveReset();
      }

      // Wait for reset to complete
      await resetCall;

      // Should finish
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });

      // Restore fake timers for other tests
      jest.useFakeTimers();
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      // Use real timers for cleanup tests to avoid issues
      jest.useRealTimers();
      (storageService.loadThresholds as jest.Mock).mockResolvedValue(DEFAULT_THRESHOLDS);
      (storageService.saveThresholds as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
      // Restore fake timers after cleanup tests
      jest.useFakeTimers();
    });

    it('should save pending changes on unmount', async () => {
      const { result, unmount } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update (starts debounce with real timer)
      act(() => {
        result.current.updateThreshold('sodium', 2000);
      });

      // Immediately unmount before debounce completes
      unmount();

      // Give unmount effect time to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Save should be called with pending value
      expect(storageService.saveThresholds).toHaveBeenCalledWith({
        ...DEFAULT_THRESHOLDS,
        sodium: 2000,
      });
    });

    it('should not save if no pending changes on unmount', async () => {
      const { result, unmount } = renderHook(() => useThresholds());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update and let save complete
      act(() => {
        result.current.updateThreshold('carbohydrates', 250);
      });

      // Wait for debounce to complete
      await new Promise((resolve) => setTimeout(resolve, 600));

      await waitFor(() => {
        expect(storageService.saveThresholds).toHaveBeenCalledTimes(1);
      });

      // Clear mock
      (storageService.saveThresholds as jest.Mock).mockClear();

      // Unmount (no pending changes)
      unmount();

      // Give unmount effect time to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should not save again
      expect(storageService.saveThresholds).not.toHaveBeenCalled();
    });
  });
});
