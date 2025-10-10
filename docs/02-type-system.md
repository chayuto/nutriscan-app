# TypeScript Type System

## Core Type Definitions

### Nutrition Data Types

```typescript
// src/types/nutrition.types.ts

export interface NutritionData {
  calories: number | null;
  protein: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  sodium: number | null;
  servingSize?: string;
  servingsPerContainer?: number;
}

export interface NutritionThresholds {
  calories: number;
  protein: number;
  fat: number;
  saturatedFat: number;
  carbohydrates: number;
  sugars: number;
  fiber: number;
  sodium: number;
}

export interface NutritionReport {
  data: NutritionData;
  thresholds: NutritionThresholds;
  timestamp: number;
  imageUri?: string;
}

export type NutrientKey = keyof Omit<NutritionData, 'servingSize' | 'servingsPerContainer'>;

export interface NutrientInfo {
  key: NutrientKey;
  label: string;
  unit: string;
  value: number | null;
  threshold: number;
  color: string;
  isExceeded: boolean;
}
```

### API Types

```typescript
// src/types/api.types.ts

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
  code: string;
  message: string;
  status?: number;
  retryable: boolean;
}
```

### Component Props Types

```typescript
// Component prop interfaces

export interface NutrientProgressBarProps {
  label: string;
  value: number | null;
  threshold: number;
  unit: string;
  color?: string;
}

export interface CameraViewProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export interface ReportScreenProps {
  nutritionData: NutritionData;
  thresholds: NutritionThresholds;
  onBack: () => void;
  onSaveReport?: () => void;
}

export interface SettingsScreenProps {
  thresholds: NutritionThresholds;
  onSave: (thresholds: NutritionThresholds) => void;
  onBack: () => void;
}
```

### View State Types

```typescript
// src/types/navigation.types.ts

export type ViewName = 'home' | 'camera' | 'report' | 'settings';

export interface AppState {
  currentView: ViewName;
  isLoading: boolean;
  error: string | null;
  nutritionData: NutritionData | null;
  thresholds: NutritionThresholds;
}
```

## Type Guards

```typescript
// src/utils/validators.ts

export function isValidNutritionData(data: unknown): data is NutritionData {
  if (typeof data !== 'object' || data === null) return false;

  const d = data as Record<string, unknown>;

  return (
    (typeof d.calories === 'number' || d.calories === null) &&
    (typeof d.protein === 'number' || d.protein === null) &&
    (typeof d.fat === 'number' || d.fat === null) &&
    // ... validate all fields
    true
  );
}

export function isAPIError(error: unknown): error is APIError {
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}
```

## Zod Schema Validation (Recommended)

```typescript
import { z } from 'zod';

export const NutritionDataSchema = z.object({
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  fat: z.number().nullable(),
  saturatedFat: z.number().nullable(),
  carbohydrates: z.number().nullable(),
  sugars: z.number().nullable(),
  fiber: z.number().nullable(),
  sodium: z.number().nullable(),
  servingSize: z.string().optional(),
  servingsPerContainer: z.number().optional(),
});

// Usage
export function parseNutritionData(data: unknown): NutritionData {
  return NutritionDataSchema.parse(data);
}
```

## TSConfig Settings

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```
