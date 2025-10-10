/**
 * Hooks barrel export
 *
 * Provides a centralized export point for all custom React hooks
 */

export { usePermissions } from './usePermissions';
export type { PermissionType, PermissionStatus, UsePermissionsReturn } from './usePermissions';

export { useCamera } from './useCamera';
export type { UseCameraReturn } from './useCamera';

// Future exports (Phase 2.4):
// export { useThresholds } from './useThresholds';
// export { useNutritionAnalysis } from './useNutritionAnalysis';
