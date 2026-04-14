/** Percentage of original quantity remaining (0–100). */
export function quantityPercentage(current: number, initial: number): number {
  if (initial <= 0) return 0;
  return Math.min(100, Math.max(0, (current / initial) * 100));
}

/**
 * True when the remaining percentage is at or below the threshold.
 * @param threshold - percentage e.g. 25 means ≤ 25 %
 */
export function isLowQuantity(
  current: number,
  initial: number,
  threshold: number,
): boolean {
  return quantityPercentage(current, initial) <= threshold;
}
