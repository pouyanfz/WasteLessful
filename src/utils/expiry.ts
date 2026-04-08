// All functions accept a plain Date so they have no Firebase dependency.

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Number of whole days until expiry. Negative = already expired. */
export function daysUntilExpiry(expiresAt: Date, now = new Date()): number {
  const expiry = new Date(expiresAt)
  expiry.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.round((expiry.getTime() - today.getTime()) / MS_PER_DAY)
}

/** True when the item's expiry date is in the past. */
export function isExpired(expiresAt: Date, now = new Date()): boolean {
  return daysUntilExpiry(expiresAt, now) < 0
}

/**
 * True when the item expires within the warning window.
 * Window is inclusive on both ends: 0 (today) … notifyDays.
 */
export function isExpiringSoon(
  expiresAt: Date,
  notifyDaysBeforeExpiry: number,
  now = new Date(),
): boolean {
  const days = daysUntilExpiry(expiresAt, now)
  return days >= 0 && days <= notifyDaysBeforeExpiry
}

/** Number of whole days since the item was added. */
export function daysSinceAdded(addedAt: Date, now = new Date()): number {
  const added = new Date(addedAt)
  added.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - added.getTime()) / MS_PER_DAY)
}
