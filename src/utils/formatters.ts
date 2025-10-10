/**
 * Formatters and Display Utilities
 */

/**
 * Format number with one decimal place
 */
export function formatNumber(value: number | null): string {
  if (value === null) return 'N/A';
  return value.toFixed(1);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, threshold: number): string {
  if (threshold === 0) return '0%';
  const percentage = Math.min((value / threshold) * 100, 999);
  return `${percentage.toFixed(0)}%`;
}

/**
 * Format nutrient label with unit
 */
export function formatNutrientValue(
  value: number | null,
  threshold: number,
  unit: string
): string {
  if (value === null) return `N/A / ${threshold} ${unit}`;
  return `${formatNumber(value)} / ${threshold} ${unit}`;
}

/**
 * Get color based on threshold percentage
 */
export function getThresholdColor(
  value: number | null,
  threshold: number,
  colors: { safe: string; caution: string; danger: string }
): string {
  if (value === null) return colors.safe;
  
  const percentage = (value / threshold) * 100;
  
  if (percentage >= 80) return colors.danger;
  if (percentage >= 50) return colors.caution;
  return colors.safe;
}

/**
 * Check if value exceeds threshold
 */
export function isThresholdExceeded(
  value: number | null,
  threshold: number
): boolean {
  if (value === null) return false;
  return value > threshold;
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
