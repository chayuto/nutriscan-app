/**
 * API Types for OpenAI Vision integration
 */

export interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string | Array<{ type: string; text?: string; image_url?: any }>;
  }>;
  max_tokens: number;
  temperature: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface APIError {
  code: 'TIMEOUT' | 'RATE_LIMIT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  status?: number;
  retryable: boolean;
}
