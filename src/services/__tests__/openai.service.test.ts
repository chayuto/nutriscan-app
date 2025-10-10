/**
 * OpenAI Service Tests - Simple Version
 */

// Mock environment BEFORE importing
process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key-123';

import { openAIService, OpenAIService } from '../openai.service';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock AbortController
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: {},
})) as unknown as typeof AbortController;

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should export a singleton instance', () => {
      expect(openAIService).toBeInstanceOf(OpenAIService);
    });

    it('should allow creating custom instances', () => {
      const custom = new OpenAIService('custom-key');
      expect(custom).toBeInstanceOf(OpenAIService);
    });
  });

  describe('analyzeImage', () => {
    const testBase64 = 'base64imagedata';

    it('should successfully analyze an image', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                calories: 250,
                protein: 5,
                fat: 10,
                saturatedFat: 3,
                carbohydrates: 30,
                sugars: 15,
                fiber: 2,
                sodium: 200,
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await openAIService.analyzeImage(testBase64);

      expect(result.calories).toBe(250);
      expect(result.protein).toBe(5);
      expect(result.fat).toBe(10);
    });

    it('should handle null values in response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                calories: 100,
                protein: null,
                fat: 5,
                saturatedFat: null,
                carbohydrates: 20,
                sugars: null,
                fiber: null,
                sodium: 50,
              }),
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await openAIService.analyzeImage(testBase64);

      expect(result.calories).toBe(100);
      expect(result.protein).toBeNull();
      expect(result.fat).toBe(5);
    });

    it('should throw error on 401 authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow(
        'API authentication failed'
      );
    });

    it('should throw error when response has no choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [] }),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow();
    });

    it('should throw error when response is invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'not json' } }],
        }),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow();
    });

    it('should throw error when response missing required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ calories: 100 }),
              },
            },
          ],
        }),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow(
        'Invalid nutrition data structure'
      );
    });
  });

  describe('Error handling', () => {
    const testBase64 = 'base64data';

    it('should map 429 to rate limit error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow();
    });

    it('should map 400 to invalid request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      } as Response);

      await expect(openAIService.analyzeImage(testBase64)).rejects.toThrow('OpenAI API error: 400');
    });
  });
});
