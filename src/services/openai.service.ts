/**
 * OpenAI Vision API Service
 *
 * Handles nutrition label analysis using OpenAI's gpt-4o vision model.
 * Includes retry logic, timeout handling, and response validation.
 *
 * @module services/openai.service
 */

import { NutritionData } from '@/types';
import { OPENAI_API_ENDPOINT, OPENAI_MODEL, MAX_RETRIES, TIMEOUT_MS } from '@/utils';

/**
 * OpenAI Service Implementation
 *
 * Provides methods for analyzing nutrition labels using OpenAI Vision API.
 * Includes production-grade error handling, retry logic, and response validation.
 */
export class OpenAIService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

    if (!this.apiKey) {
      console.error('⚠️ OpenAI API key not configured');
    }
  }

  /**
   * Analyze a nutrition label image and extract nutritional data
   *
   * @param base64Image - Base64 encoded image string (without data URI prefix)
   * @returns Parsed nutrition data
   * @throws {Error} If analysis fails after retries
   *
   * @example
   * const base64 = await imageService.convertToBase64(uri);
   * const nutrition = await openAIService.analyzeImage(base64);
   */
  async analyzeImage(base64Image: string): Promise<NutritionData> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.warn(`🔍 Analyzing image (attempt ${attempt}/${MAX_RETRIES})...`);

        const response = await this.makeAPIRequest(base64Image);
        const nutritionData = this.parseResponse(response);

        console.warn('✅ Image analysis successful');
        return nutritionData;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const isRetryable = this.isRetryableError(error);

        console.error(
          `❌ Analysis attempt ${attempt} failed:`,
          lastError.message,
          `(retryable: ${isRetryable})`
        );

        // Don't retry if error is not retryable or we're on the last attempt
        if (!isRetryable || attempt === MAX_RETRIES) {
          throw this.enhanceError(lastError);
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.warn(`⏳ Retrying in ${backoffMs}ms...`);
        await this.delay(backoffMs);
      }
    }

    throw this.enhanceError(lastError || new Error('Analysis failed'));
  }

  /**
   * Make API request to OpenAI with timeout handling
   *
   * @private
   */
  private async makeAPIRequest(base64Image: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const payload = {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system' as const,
            content: this.getSystemPrompt(),
          },
          {
            role: 'user' as const,
            content: [
              {
                type: 'text',
                text: 'Extract nutrition information from this label (per 100g serving).',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0, // Deterministic output
      };

      const response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();

      // Log full OpenAI API response
      console.warn('📡 [OpenAI] Full API Response:', JSON.stringify(data, null, 2));

      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      console.warn('📝 [OpenAI] Extracted content from response');
      return content;
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }

      throw error;
    }
  }

  /**
   * System prompt for consistent JSON output
   *
   * @private
   */
  private getSystemPrompt(): string {
    return `You are a nutrition label analyzer for Australian food labels. Extract nutritional values from the "per 100g" or "per 100mL" column ONLY.

CRITICAL INSTRUCTIONS:
1. First, check if this is a nutrition label. If NOT, return an error response (see format below)
2. Look for the nutrition information table
3. Find the column labeled "per 100g" or "per 100mL" (NOT "per serving")
4. Extract values ONLY from that column
5. Australian labels typically have TWO columns: "per serving" and "per 100g" - USE THE "per 100g" column

Return ONLY valid JSON in ONE of these formats:

SUCCESS (nutrition label found):
{
  "success": true,
  "data": {
    "calories": <number or null>,
    "protein": <number or null>,
    "fat": <number or null>,
    "saturatedFat": <number or null>,
    "carbohydrates": <number or null>,
    "sugars": <number or null>,
    "fiber": <number or null>,
    "sodium": <number or null>,
    "servingSize": "<string or null>",
    "servingsPerContainer": <number or null>
  }
}

ERROR (not a nutrition label):
{
  "success": false,
  "error": "<brief description of what was found instead>"
}

Rules for SUCCESS case:
- Extract from "per 100g" or "per 100mL" column ONLY (ignore "per serving" column)
- All values must be as shown in the per 100g/100mL column
- Calories is energy in kJ or kcal (if only kJ, convert: kJ ÷ 4.184 = kcal)
- Sodium should be in mg (convert from g if needed: 1g = 1000mg)
- Fiber may be labeled as "Dietary Fibre" or "Fibre"
- Saturated Fat may be labeled as "Saturated" under "Fat"
- Use null if value not found in the per 100g column
- No explanatory text, ONLY JSON
- Round to 1 decimal place
- Do not include units in numeric values

Examples:

SUCCESS - Australian label:
{
  "success": true,
  "data": {
    "calories": 2094,
    "protein": 3.2,
    "fat": 15.5,
    "saturatedFat": 8.1,
    "carbohydrates": 68.4,
    "sugars": 12.5,
    "fiber": 2.3,
    "sodium": 310,
    "servingSize": "30g",
    "servingsPerContainer": 10
  }
}

ERROR - Not a nutrition label:
{
  "success": false,
  "error": "This is a medical test kit, not a food nutrition label"
}`;
  }

  /**
   * Parse OpenAI response and validate nutrition data
   *
   * @private
   */
  private parseResponse(content: string): NutritionData {
    try {
      // Log raw AI response for debugging
      console.warn('🤖 [OpenAI] Raw AI Response (first 500 chars):', content.substring(0, 500));

      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const response = JSON.parse(jsonStr);

      // Log parsed response
      console.warn('📊 [OpenAI] Parsed response:', JSON.stringify(response, null, 2));

      // Check if this is the new structured format with success flag
      if ('success' in response) {
        if (!response.success) {
          // AI determined this is not a nutrition label
          const errorMessage = response.error || 'Not a nutrition label';
          console.warn('⚠️ [OpenAI] AI identified non-nutrition label:', errorMessage);
          throw new Error(errorMessage);
        }

        // Extract data from successful response
        if (!response.data) {
          throw new Error('Success response missing data field');
        }

        const data = response.data;

        if (!this.isValidNutritionData(data)) {
          throw new Error('Invalid nutrition data structure from API');
        }

        return data;
      }

      // Legacy format support (direct nutrition data)
      // This handles responses that don't have the success wrapper
      if (this.isValidNutritionData(response)) {
        console.warn('⚠️ [OpenAI] Using legacy response format (no success wrapper)');
        return response;
      }

      throw new Error('Invalid response structure - missing success flag or nutrition data');
    } catch (error) {
      console.error('❌ [OpenAI] Failed to parse response. Full content:', content);
      throw new Error(
        `Failed to parse API response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Type guard for NutritionData validation
   *
   * @private
   */
  private isValidNutritionData(data: unknown): data is NutritionData {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const d = data as Record<string, unknown>;

    return (
      (typeof d.calories === 'number' || d.calories === null) &&
      (typeof d.protein === 'number' || d.protein === null) &&
      (typeof d.fat === 'number' || d.fat === null) &&
      (typeof d.saturatedFat === 'number' || d.saturatedFat === null) &&
      (typeof d.carbohydrates === 'number' || d.carbohydrates === null) &&
      (typeof d.sugars === 'number' || d.sugars === null) &&
      (typeof d.fiber === 'number' || d.fiber === null) &&
      (typeof d.sodium === 'number' || d.sodium === null)
    );
  }

  /**
   * Check if error is retryable
   *
   * @private
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();

    // Non-retryable: AI identified non-nutrition label
    if (
      message.includes('not a nutrition label') ||
      message.includes('not appear to be') ||
      message.includes('medical test') ||
      message.includes('not a food') ||
      message.includes('please provide') ||
      message.includes('this is a') ||
      message.includes('this image is')
    ) {
      return false;
    }

    // Retryable: timeouts, rate limits, server errors
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    ) {
      return true;
    }

    // Non-retryable: auth errors, invalid requests
    if (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('400') ||
      message.includes('invalid') ||
      message.includes('api key')
    ) {
      return false;
    }

    // Default: retry on unknown errors
    return true;
  }

  /**
   * Enhance error with user-friendly message
   *
   * @private
   */
  private enhanceError(error: Error): Error {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('timed out')) {
      return new Error('Analysis timed out. Please try again.');
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return new Error('Too many requests. Please wait a moment and try again.');
    }

    if (message.includes('401') || message.includes('api key')) {
      return new Error('API authentication failed. Please check your API key.');
    }

    if (message.includes('500') || message.includes('503')) {
      return new Error('Service temporarily unavailable. Please try again.');
    }

    if (message.includes('network') || message.includes('fetch')) {
      return new Error('Network error. Please check your internet connection.');
    }

    // Keep original error for debugging
    return error;
  }

  /**
   * Delay helper for retry backoff
   *
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for global use
 *
 * Import this in your code:
 * ```typescript
 * import { openAIService } from '@/services/openai.service';
 * const nutrition = await openAIService.analyzeImage(base64);
 * ```
 */
export const openAIService = new OpenAIService();
