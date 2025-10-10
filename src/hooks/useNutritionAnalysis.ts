import { useState, useRef, useCallback } from 'react';
import { imageService } from '@/services/image.service';
import { openAIService } from '@/services/openai.service';
import type { NutritionData } from '@/types/nutrition.types';

/**
 * Progress state for multi-step analysis
 */
export interface AnalysisProgress {
  step: 'compressing' | 'converting' | 'analyzing' | 'idle';
  message: string;
  percentage: number;
}

/**
 * Return type for useNutritionAnalysis hook
 */
export interface UseNutritionAnalysisReturn {
  /**
   * Analyze an image and extract nutrition data
   * @param imageUri - Local file URI of the image to analyze
   * @returns NutritionData or null if analysis fails
   */
  analyzeImage: (imageUri: string) => Promise<NutritionData | null>;

  /**
   * Retry the last failed analysis
   * @returns NutritionData or null if no previous URI or analysis fails
   */
  retry: () => Promise<NutritionData | null>;

  /**
   * Whether an analysis is currently in progress
   */
  isAnalyzing: boolean;

  /**
   * Current progress state during analysis
   */
  progress: AnalysisProgress;

  /**
   * Error message if analysis failed
   */
  error: string | null;

  /**
   * Last successful analysis result (cached)
   */
  lastResult: NutritionData | null;
}

/**
 * Hook for analyzing nutrition labels using OpenAI Vision API
 *
 * Features:
 * - Multi-step progress tracking (compress → convert → analyze)
 * - Retry functionality for failed analyses
 * - Result caching
 * - Concurrent analysis prevention
 * - User-friendly error messages
 *
 * @example
 * ```typescript
 * const { analyzeImage, isAnalyzing, progress, error } = useNutritionAnalysis();
 *
 * const handleCapture = async (uri: string) => {
 *   const result = await analyzeImage(uri);
 *   if (result) {
 *     // Show nutrition report
 *   }
 * };
 * ```
 */
export function useNutritionAnalysis(): UseNutritionAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress>({
    step: 'idle',
    message: '',
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<NutritionData | null>(null);

  // Store last URI for retry functionality
  const lastImageUriRef = useRef<string | null>(null);

  /**
   * Analyze an image and extract nutrition data
   */
  const analyzeImage = useCallback(
    async (imageUri: string): Promise<NutritionData | null> => {
      // Prevent concurrent analyses
      if (isAnalyzing) {
        console.warn('Analysis already in progress, ignoring new request');
        return null;
      }

      // Reset state
      setIsAnalyzing(true);
      setError(null);
      setProgress({ step: 'idle', message: '', percentage: 0 });
      lastImageUriRef.current = imageUri;

      try {
        // Step 1: Compress image
        setProgress({
          step: 'compressing',
          message: 'Compressing image...',
          percentage: 33,
        });

        const compressedUri = await imageService.compressImage(imageUri);

        // Step 2: Convert to base64
        setProgress({
          step: 'converting',
          message: 'Converting image...',
          percentage: 66,
        });

        const base64Image = await imageService.convertToBase64(compressedUri);

        // Step 3: Analyze with AI
        setProgress({
          step: 'analyzing',
          message: 'Analyzing nutrition label...',
          percentage: 100,
        });

        const nutritionData = await openAIService.analyzeImage(base64Image);

        // Success - cache result
        setLastResult(nutritionData);
        setProgress({ step: 'idle', message: '', percentage: 0 });
        return nutritionData;
      } catch (err) {
        // Enhanced error messages
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';

        setError(errorMessage);
        setProgress({ step: 'idle', message: '', percentage: 0 });
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing]
  );

  /**
   * Retry the last failed analysis
   */
  const retry = useCallback(async (): Promise<NutritionData | null> => {
    if (!lastImageUriRef.current) {
      setError('No previous image to retry');
      return null;
    }

    return analyzeImage(lastImageUriRef.current);
  }, [analyzeImage]);

  return {
    analyzeImage,
    retry,
    isAnalyzing,
    progress,
    error,
    lastResult,
  };
}
