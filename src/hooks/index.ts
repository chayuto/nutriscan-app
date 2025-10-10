/**
 * Hooks barrel export
 *
 * Exports all custom React hooks for use throughout the application.
 * Currently includes:
 * - usePermissions: Generic permission management for camera and media library
 * - useCamera: Camera capture and gallery image picking
 * - useThresholds: Settings management with debounced auto-save
 */

export { usePermissions } from './usePermissions';
export { useCamera } from './useCamera';
export { useThresholds } from './useThresholds';

export type { PermissionType, PermissionStatus, UsePermissionsReturn } from './usePermissions';

export type { UseCameraReturn } from './useCamera';
export type { UseThresholdsReturn } from './useThresholds';
