import { isExpiringSoon, daysUntilExpiry } from './expiry'
import { isLowQuantity } from './quantity'

interface AutoAddOptions {
  expiresAt: Date | null
  current: number
  initial: number
  notifyDaysBeforeExpiry: number
  lowQuantityThreshold: number
  autoAddOnExpiry: boolean
  autoAddOnLowQuantity: boolean
}

/** Returns true if the item should be auto-added to the shopping list. */
export function shouldAutoAdd(opts: AutoAddOptions, now = new Date()): boolean {
  const {
    expiresAt,
    current,
    initial,
    notifyDaysBeforeExpiry,
    lowQuantityThreshold,
    autoAddOnExpiry,
    autoAddOnLowQuantity,
  } = opts

  if (autoAddOnExpiry && expiresAt !== null) {
    if (isExpiringSoon(expiresAt, notifyDaysBeforeExpiry, now)) return true
  }

  if (autoAddOnLowQuantity) {
    if (isLowQuantity(current, initial, lowQuantityThreshold)) return true
  }

  return false
}

/**
 * Human-readable note for a shopping item that is linked to an inventory item.
 * Returns null when there is no linked item.
 */
export function linkedItemNote(
  linkedItemName: string | null,
  expiresAt: Date | null,
  now = new Date(),
): string | null {
  if (!linkedItemName) return null

  if (expiresAt === null) {
    return `You planned this for ${linkedItemName}`
  }

  const days = daysUntilExpiry(expiresAt, now)
  return `You planned this for ${linkedItemName} (expires in ${days} day${days === 1 ? '' : 's'})`
}
