/**
 * History Types
 * 
 * Type definitions for scan history and favorites feature.
 * These types support the JSON-based storage approach for managing
 * historical nutrition scans with metadata and user preferences.
 * 
 * @see docs/SPRINT-4-HISTORY-FAVORITES.md for complete specification
 */

import type { NutritionData } from './nutrition.types';

/**
 * Single scan entry in history
 * 
 * Represents a complete nutrition scan with all associated metadata,
 * user customizations, and reference to the original scanned image.
 */
export interface ScanHistoryItem {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Unix timestamp (ms) when scan was performed */
  timestamp: number;

  /** User-editable product name */
  productName?: string;

  /** User-editable brand name */
  brandName?: string;

  /** Nutrition data extracted by OpenAI Vision API */
  nutritionData: NutritionData;

  /** 
   * Local file URI from camera/gallery (e.g., "file:///...")
   * NOTE: OpenAI doesn't return images - we get this from 
   * capturePhoto() or pickFromGallery() in useCamera hook
   * ⚠️ Original images may be deleted by OS if storage is low
   */
  imageUri?: string;

  /** Quick access flag for favorite items */
  isFavorite: boolean;

  /** User-defined tags for categorization */
  tags: string[];

  /** User notes about this scan */
  notes?: string;

  // Metadata
  /** Creation timestamp (Unix ms) */
  createdAt: number;

  /** Last modified timestamp (Unix ms) */
  updatedAt: number;

  /** Schema version for future migrations */
  version: number;
}

/**
 * Complete history storage structure
 * 
 * Root object stored in expo-secure-store containing all scans
 * and metadata about the history collection.
 */
export interface ScanHistory {
  /** Storage schema version (current: 1) */
  version: number;

  /** Array of all scan items (newest first) */
  items: ScanHistoryItem[];

  /** Collection-level metadata */
  metadata: {
    /** Total number of scans performed */
    totalScans: number;

    /** Unix timestamp of most recent scan */
    lastScanAt: number;

    /** Storage schema version string */
    storageVersion: string;
  };
}

/**
 * Filter options for querying history items
 * 
 * Used by getItems() to filter, sort, and paginate results.
 */
export interface HistoryFilter {
  /** Text search across productName, brandName, and notes */
  searchQuery?: string;

  /** Filter by favorite status */
  isFavorite?: boolean;

  /** Filter by date range */
  dateRange?: {
    start: number; // Unix timestamp
    end: number;   // Unix timestamp
  };

  /** Filter by tags (matches if item has ANY of these tags) */
  tags?: string[];

  /** Sort field */
  sortBy?: 'date' | 'name' | 'favorite';

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';

  /** Pagination: number of items to return */
  limit?: number;

  /** Pagination: number of items to skip */
  offset?: number;
}

/**
 * Statistics about scan history
 * 
 * Aggregated data for dashboard display and user insights.
 */
export interface HistoryStats {
  /** Total number of scans */
  totalScans: number;

  /** Number of items marked as favorites */
  favoritesCount: number;

  /** Scans in the last 7 days */
  scansThisWeek: number;

  /** Scans in the last 30 days */
  scansThisMonth: number;

  /** Average calories across all scans */
  averageCalories: number;

  /** Most scanned product name */
  mostScannedProduct?: string;

  /** Unix timestamp of most recent scan */
  lastScanAt: number;

  /** Unix timestamp of oldest scan */
  firstScanAt?: number;

  /** Current streak (consecutive days with scans) */
  currentStreak: number;

  /** All unique tags across all items */
  allTags: string[];
}

/**
 * Options for exporting history data
 */
export interface ExportOptions {
  /** Include favorites only */
  favoritesOnly?: boolean;

  /** Date range to export */
  dateRange?: {
    start: number;
    end: number;
  };

  /** Export format */
  format: 'json' | 'csv';
}

/**
 * Result of export operation
 */
export interface ExportResult {
  /** Export data as string */
  data: string;

  /** MIME type for sharing */
  mimeType: string;

  /** Suggested filename */
  filename: string;

  /** Number of items exported */
  itemCount: number;
}

/**
 * Import validation result
 */
export interface ImportValidation {
  /** Whether import data is valid */
  isValid: boolean;

  /** Number of items in import */
  itemCount: number;

  /** Validation errors if any */
  errors: string[];

  /** Storage schema version of import */
  importVersion: number;
}
