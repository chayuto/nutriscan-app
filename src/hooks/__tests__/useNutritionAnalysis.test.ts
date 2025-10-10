// Mock services before imports
jest.mock('@/services/image.service', () => ({
  imageService: {
    compressImage: jest.fn(),
    convertToBase64: jest.fn(),
  },
}));

jest.mock('@/services/openai.service', () => ({
  openAIService: {
    analyzeImage: jest.fn(),
  },
}));

import { renderHook, waitFor } from '@testing-library/react-native';
import { useNutritionAnalysis } from '../useNutritionAnalysis';
import { imageService } from '@/services/image.service';
import { openAIService } from '@/services/openai.service';
import type { NutritionData } from '@/types/nutrition.types';

const mockedImageService = imageService as jest.Mocked<typeof imageService>;
const mockedOpenAIService = openAIService as jest.Mocked<typeof openAIService>;

describe('useNutritionAnalysis', () => {
  // Sample test data
  const testImageUri = 'file:///path/to/image.jpg';
  const compressedUri = 'file:///path/to/compressed.jpg';
  const base64Image = 'base64encodedstring';
  const mockNutritionData: NutritionData = {
    calories: 250,
    protein: 5,
    fat: 10,
    saturatedFat: 3,
    carbohydrates: 30,
    sugars: 12,
    fiber: 2,
    sodium: 300,
    servingSize: '100g',
    servingsPerContainer: 1,
  };

  // Helper to create delayed promises for proper async state testing
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Default successful mocks with small delays to capture state changes
    mockedImageService.compressImage.mockImplementation(async () => {
      await delay(10);
      return compressedUri;
    });
    mockedImageService.convertToBase64.mockImplementation(async () => {
      await delay(10);
      return base64Image;
    });
    mockedOpenAIService.analyzeImage.mockImplementation(async () => {
      await delay(10);
      return mockNutritionData;
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.progress).toEqual({
        step: 'idle',
        message: '',
        percentage: 0,
      });
      expect(result.current.error).toBeNull();
      expect(result.current.lastResult).toBeNull();
      expect(typeof result.current.analyzeImage).toBe('function');
      expect(typeof result.current.retry).toBe('function');
    });
  });

  describe('analyzeImage', () => {
    it('should successfully analyze an image through all steps', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      const nutritionData = await result.current.analyzeImage(testImageUri);

      // Verify all services called in order
      expect(mockedImageService.compressImage).toHaveBeenCalledWith(testImageUri);
      expect(mockedImageService.convertToBase64).toHaveBeenCalledWith(compressedUri);
      expect(mockedOpenAIService.analyzeImage).toHaveBeenCalledWith(base64Image);

      // Verify result
      expect(nutritionData).toEqual(mockNutritionData);
      
      // Wait for state to update
      await waitFor(() => {
        expect(result.current.lastResult).toEqual(mockNutritionData);
      });
      
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update progress through all steps', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // Use longer delays to capture intermediate states
      mockedImageService.compressImage.mockImplementation(async () => {
        await delay(50);
        return compressedUri;
      });
      mockedImageService.convertToBase64.mockImplementation(async () => {
        await delay(50);
        return base64Image;
      });
      mockedOpenAIService.analyzeImage.mockImplementation(async () => {
        await delay(50);
        return mockNutritionData;
      });

      // Start analysis
      const promise = result.current.analyzeImage(testImageUri);

      // Check compressing step
      await waitFor(() => {
        expect(result.current.progress.step).toBe('compressing');
      });
      expect(result.current.progress.message).toBe('Compressing image...');
      expect(result.current.progress.percentage).toBe(33);

      // Check converting step
      await waitFor(() => {
        expect(result.current.progress.step).toBe('converting');
      });
      expect(result.current.progress.message).toBe('Converting image...');
      expect(result.current.progress.percentage).toBe(66);

      // Check analyzing step
      await waitFor(() => {
        expect(result.current.progress.step).toBe('analyzing');
      });
      expect(result.current.progress.message).toBe('Analyzing nutrition label...');
      expect(result.current.progress.percentage).toBe(100);

      await promise;

      // Should reset to idle
      await waitFor(() => {
        expect(result.current.progress.step).toBe('idle');
      });
      expect(result.current.progress.percentage).toBe(0);
    });

    it('should handle compression errors', async () => {
      const compressionError = new Error('Compression failed');
      mockedImageService.compressImage.mockRejectedValueOnce(compressionError);

      const { result } = renderHook(() => useNutritionAnalysis());

      const nutritionData = await result.current.analyzeImage(testImageUri);

      expect(nutritionData).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Compression failed');
      });
      
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.lastResult).toBeNull();

      // Should not call subsequent steps (only called once from default mock in beforeEach)
      expect(mockedImageService.compressImage).toHaveBeenCalledTimes(1);
      expect(mockedOpenAIService.analyzeImage).not.toHaveBeenCalled();
    });

    it('should handle conversion errors', async () => {
      const conversionError = new Error('Conversion failed');
      mockedImageService.convertToBase64.mockRejectedValueOnce(conversionError);

      const { result } = renderHook(() => useNutritionAnalysis());

      const nutritionData = await result.current.analyzeImage(testImageUri);

      expect(nutritionData).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Conversion failed');
      });
      
      expect(result.current.isAnalyzing).toBe(false);

      // Should call compression but not AI analysis
      expect(mockedImageService.compressImage).toHaveBeenCalled();
      expect(mockedOpenAIService.analyzeImage).not.toHaveBeenCalled();
    });

    it('should handle AI analysis errors', async () => {
      const analysisError = new Error('AI analysis failed');
      mockedOpenAIService.analyzeImage.mockRejectedValueOnce(analysisError);

      const { result } = renderHook(() => useNutritionAnalysis());

      const nutritionData = await result.current.analyzeImage(testImageUri);

      expect(nutritionData).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('AI analysis failed');
      });
      
      expect(result.current.isAnalyzing).toBe(false);

      // All steps should be called
      expect(mockedImageService.compressImage).toHaveBeenCalled();
      expect(mockedImageService.convertToBase64).toHaveBeenCalled();
      expect(mockedOpenAIService.analyzeImage).toHaveBeenCalled();
    });

    it('should handle non-Error objects in catch block', async () => {
      mockedImageService.compressImage.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useNutritionAnalysis());

      const nutritionData = await result.current.analyzeImage(testImageUri);

      expect(nutritionData).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Failed to analyze image. Please try again.');
      });
    });

    it('should prevent concurrent analyses', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // Use longer delay to keep first analysis running
      mockedImageService.compressImage.mockImplementation(async () => {
        await delay(100);
        return compressedUri;
      });

      // Start first analysis
      const promise1 = result.current.analyzeImage(testImageUri);

      // Wait a bit for first analysis to start
      await delay(20);

      // Try to start second analysis while first is running
      const promise2 = result.current.analyzeImage('file:///different.jpg');

      // Second analysis should return null immediately
      expect(await promise2).toBeNull();

      // First analysis should complete normally
      expect(await promise1).toEqual(mockNutritionData);

      // Services should only be called once (for first analysis)
      expect(mockedImageService.compressImage).toHaveBeenCalledTimes(1);
    });

    it('should clear previous error on new analysis', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // First analysis fails
      mockedImageService.compressImage.mockRejectedValueOnce(new Error('First error'));
      await result.current.analyzeImage(testImageUri);

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Second analysis succeeds - restore default mock behavior
      await result.current.analyzeImage(testImageUri);

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.lastResult).toEqual(mockNutritionData);
      });
    });

    it('should cache last successful result', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      const result1 = await result.current.analyzeImage(testImageUri);

      await waitFor(() => {
        expect(result.current.lastResult).toEqual(mockNutritionData);
      });
      expect(result1).toEqual(mockNutritionData);

      // Analyze different image with different result
      const differentData: NutritionData = {
        ...mockNutritionData,
        calories: 500,
      };
      mockedOpenAIService.analyzeImage.mockImplementationOnce(async () => {
        await delay(10);
        return differentData;
      });

      const result2 = await result.current.analyzeImage('file:///different.jpg');

      await waitFor(() => {
        expect(result.current.lastResult).toEqual(differentData);
      });
      expect(result2).toEqual(differentData);
    });
  });

  describe('retry', () => {
    it('should retry the last analysis', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // First analysis fails
      mockedImageService.compressImage.mockRejectedValueOnce(new Error('Network error'));
      await result.current.analyzeImage(testImageUri);

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Retry with successful mock (restore default behavior)
      const retryResult = await result.current.retry();

      await waitFor(() => {
        expect(retryResult).toEqual(mockNutritionData);
        expect(result.current.error).toBeNull();
      });

      // Should use same URI as original
      expect(mockedImageService.compressImage).toHaveBeenCalledWith(testImageUri);
      expect(mockedImageService.compressImage).toHaveBeenCalledTimes(2);
    });

    it('should return null if no previous image to retry', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      const retryResult = await result.current.retry();

      expect(retryResult).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('No previous image to retry');
      });

      // Services should not be called
      expect(mockedImageService.compressImage).not.toHaveBeenCalled();
    });

    it('should update last result on successful retry', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // First analysis succeeds and sets lastResult
      const firstResult = await result.current.analyzeImage(testImageUri);
      expect(firstResult).toEqual(mockNutritionData);

      await waitFor(() => {
        expect(result.current.lastResult).toEqual(mockNutritionData);
      });

      // Create new mock data for retry
      const updatedMockData = { ...mockNutritionData, calories: 300 };

      // Update mock to return different data
      mockedOpenAIService.analyzeImage.mockImplementation(async () => {
        await delay(10);
        return updatedMockData;
      });

      // Retry should update lastResult with new data
      const retryResult = await result.current.retry();

      expect(retryResult).toEqual(updatedMockData);
      
      await waitFor(() => {
        expect(result.current.lastResult).toEqual(updatedMockData);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty image URI', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      mockedImageService.compressImage.mockRejectedValueOnce(new Error('Invalid URI'));

      const nutritionData = await result.current.analyzeImage('');

      expect(nutritionData).toBeNull();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Invalid URI');
      });
    });

    it('should handle null nutrition data from API', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      const nullData: NutritionData = {
        calories: null,
        protein: null,
        fat: null,
        saturatedFat: null,
        carbohydrates: null,
        sugars: null,
        fiber: null,
        sodium: null,
      };

      mockedOpenAIService.analyzeImage.mockImplementationOnce(async () => {
        await delay(10);
        return nullData;
      });

      const nutritionData = await result.current.analyzeImage(testImageUri);

      expect(nutritionData).toEqual(nullData);
      
      await waitFor(() => {
        expect(result.current.lastResult).toEqual(nullData);
      });
    });

    it('should reset progress to idle after error', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      mockedImageService.compressImage.mockRejectedValueOnce(new Error('Test error'));

      await result.current.analyzeImage(testImageUri);

      await waitFor(() => {
        expect(result.current.progress).toEqual({
          step: 'idle',
          message: '',
          percentage: 0,
        });
      });
    });

    it('should maintain isAnalyzing false after concurrent prevention', async () => {
      const { result } = renderHook(() => useNutritionAnalysis());

      // Use longer delay to keep first analysis running
      mockedImageService.compressImage.mockImplementation(async () => {
        await delay(100);
        return compressedUri;
      });

      // Start first analysis
      const promise1 = result.current.analyzeImage(testImageUri);

      // Wait a bit for first analysis to start
      await delay(20);

      // Try second analysis (should be rejected)
      await result.current.analyzeImage('file:///other.jpg');

      // isAnalyzing should still be true (first analysis ongoing)
      expect(result.current.isAnalyzing).toBe(true);

      // Wait for first to complete
      await promise1;

      // Now should be false
      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false);
      });
    });
  });
});
