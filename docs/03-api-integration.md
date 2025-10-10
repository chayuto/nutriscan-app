# OpenAI Vision API Integration

## Service Implementation

### Core Service Structure

````typescript
// src/services/openai.service.ts

import { OpenAIRequest, OpenAIResponse, APIError } from '@types/api.types';
import { NutritionData } from '@types/nutrition.types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

export class OpenAIService {
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async analyzeImage(base64Image: string): Promise<NutritionData> {
    let lastError: APIError | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.makeAPIRequest(base64Image);
        return this.parseResponse(response);
      } catch (error) {
        lastError = this.handleError(error);

        if (!lastError.retryable || attempt === MAX_RETRIES) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        await this.delay(backoffMs);
      }
    }

    throw lastError || new Error('Analysis failed');
  }

  private async makeAPIRequest(base64Image: string): Promise<OpenAIResponse> {
    const payload: OpenAIRequest = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract nutrition information from this label (per 100g).',
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

    const response = await this.fetchWithTimeout(
      API_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      },
      TIMEOUT_MS
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  }

  private getSystemPrompt(): string {
    return `You are a nutrition label analyzer. Extract nutritional values per 100g from food labels.

Return ONLY valid JSON in this exact format:
{
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

Rules:
- All values in grams or mg (convert sodium to mg)
- Use null if value not found
- No explanatory text, only JSON
- Round to 1 decimal place

Example:
{
  "calories": 250,
  "protein": 3.5,
  "fat": 15.5,
  "saturatedFat": 8.0,
  "carbohydrates": 28.0,
  "sugars": 12.5,
  "fiber": 2.0,
  "sodium": 300,
  "servingSize": "30g",
  "servingsPerContainer": 10
}`;
  }

  private parseResponse(response: OpenAIResponse): NutritionData {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in API response');
    }

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      const data = JSON.parse(jsonStr);

      // Validate with type guard or Zod
      if (!this.isValidNutritionData(data)) {
        throw new Error('Invalid nutrition data structure');
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to parse API response: ${error}`);
    }
  }

  private isValidNutritionData(data: any): data is NutritionData {
    return (
      typeof data === 'object' &&
      data !== null &&
      (typeof data.calories === 'number' || data.calories === null) &&
      (typeof data.protein === 'number' || data.protein === null) &&
      (typeof data.fat === 'number' || data.fat === null) &&
      (typeof data.saturatedFat === 'number' || data.saturatedFat === null) &&
      (typeof data.carbohydrates === 'number' || data.carbohydrates === null) &&
      (typeof data.sugars === 'number' || data.sugars === null) &&
      (typeof data.fiber === 'number' || data.fiber === null) &&
      (typeof data.sodium === 'number' || data.sodium === null)
    );
  }

  private handleError(error: unknown): APIError {
    if (error instanceof Error) {
      // Network timeout
      if (error.name === 'AbortError') {
        return {
          code: 'TIMEOUT',
          message: 'Request timed out. Please try again.',
          retryable: true,
        };
      }

      // API errors
      if (error.message.includes('429')) {
        return {
          code: 'RATE_LIMIT',
          message: 'Too many requests. Please wait a moment.',
          status: 429,
          retryable: true,
        };
      }

      if (error.message.includes('401')) {
        return {
          code: 'AUTH_ERROR',
          message: 'API authentication failed.',
          status: 401,
          retryable: false,
        };
      }

      if (error.message.includes('500') || error.message.includes('503')) {
        return {
          code: 'SERVER_ERROR',
          message: 'Service temporarily unavailable.',
          retryable: true,
        };
      }
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
      retryable: false,
    };
  }
}

export const openAIService = new OpenAIService();
````

## Environment Setup

```bash
# .env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
```

## Usage in Hook

```typescript
// src/hooks/useNutritionAnalysis.ts

import { useState } from 'react';
import { openAIService } from '@services/openai.service';
import { NutritionData } from '@types/nutrition.types';

export function useNutritionAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (base64Image: string): Promise<NutritionData | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await openAIService.analyzeImage(base64Image);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeImage,
    isAnalyzing,
    error,
  };
}
```

## Testing Strategy

```typescript
// __tests__/openai.service.test.ts

describe('OpenAIService', () => {
  it('should parse valid response', () => {
    // Test with mock response
  });

  it('should retry on timeout', () => {
    // Test exponential backoff
  });

  it('should handle rate limiting', () => {
    // Test 429 responses
  });

  it('should validate response structure', () => {
    // Test type validation
  });
});
```
