import { Timestamp } from 'firebase/firestore'
import type { User, UserSettings, Group, Item, ShoppingItem, Recipe } from '../types'
import { nextGroupColor } from '../data/groupColors'

function daysFromNow(n: number): Timestamp {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return Timestamp.fromDate(d)
}

const KEY = (uid: string) => `wl_local_${uid}`

export interface LocalStoreData {
  user: User
  groups: Group[]
  items: Item[]
  shoppingItems: ShoppingItem[]
  recipes: Recipe[]
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  notifyDaysBeforeExpiry: 3,
  notifyOnExpired: true,
  notifyOnLowQuantity: true,
  lowQuantityThreshold: 25,
  notifyUnusedAfterDays: null,
  weeklyReport: false,
  autoAddToShoppingListOnExpiry: false,
  autoAddToShoppingListOnLowQuantity: true,
  getGroupNotifications: true,
  archiveRetentionDays: null,
  archiveMaxItems: null,
}

function isTimestampLike(v: unknown): v is { seconds: number; nanoseconds: number } {
  return (
    v !== null &&
    typeof v === 'object' &&
    typeof (v as Record<string, unknown>).seconds === 'number' &&
    typeof (v as Record<string, unknown>).nanoseconds === 'number'
  )
}

function serialize(data: LocalStoreData): string {
  return JSON.stringify(data, (_, value) => {
    // Duck-type check avoids instanceof failures when module instances differ
    if (isTimestampLike(value) && typeof (value as { toDate?: unknown }).toDate === 'function') {
      return { __ts: true, s: value.seconds, n: value.nanoseconds }
    }
    return value
  })
}

function deserialize(json: string): LocalStoreData {
  return JSON.parse(json, (_, value) => {
    if (value && typeof value === 'object' && value.__ts === true) {
      return new Timestamp(value.s as number, value.n as number)
    }
    // Fallback: Timestamp serialized as plain {seconds, nanoseconds} when instanceof check failed
    if (isTimestampLike(value) && !('__ts' in value) && Object.keys(value).length === 2) {
      return new Timestamp(value.seconds, value.nanoseconds)
    }
    return value
  })
}

function toTimestamp(v: unknown): Timestamp {
  if (v instanceof Timestamp) return v
  if (isTimestampLike(v)) return new Timestamp(v.seconds, v.nanoseconds)
  return Timestamp.now()
}

function toTimestampOrNull(v: unknown): Timestamp | null {
  if (v === null || v === undefined) return null
  return toTimestamp(v)
}

function normalizeItem(item: Item): Item {
  return {
    ...item,
    dates: {
      addedAt: toTimestamp(item.dates.addedAt),
      purchasedAt: toTimestampOrNull(item.dates.purchasedAt),
      expiresAt: toTimestampOrNull(item.dates.expiresAt),
      lastUsedAt: toTimestampOrNull(item.dates.lastUsedAt),
    },
    updatedAt: toTimestamp(item.updatedAt),
    archivedAt: toTimestampOrNull(item.archivedAt),
  }
}

function normalizeData(data: LocalStoreData): LocalStoreData {
  return {
    ...data,
    items: data.items.map(normalizeItem),
  }
}

export function getLocalStore(uid: string): LocalStoreData | null {
  try {
    const raw = localStorage.getItem(KEY(uid))
    if (!raw) return null
    return normalizeData(deserialize(raw))
  } catch {
    return null
  }
}

export function saveLocalStore(uid: string, data: LocalStoreData): void {
  localStorage.setItem(KEY(uid), serialize(data))
}

export function updateLocalStore(
  uid: string,
  updater: (data: LocalStoreData) => LocalStoreData,
): LocalStoreData {
  const data = getLocalStore(uid) ?? buildFreshLocalStore(uid)
  const updated = updater(data)
  saveLocalStore(uid, updated)
  return updated
}

export function clearLocalStore(uid: string): void {
  localStorage.removeItem(KEY(uid))
}

function buildFreshLocalStore(uid: string): LocalStoreData {
  const now = Timestamp.now()
  const groupId = crypto.randomUUID()
  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()

  const group: Group = {
    id: groupId,
    name: 'My Home',
    color: nextGroupColor([]),
    ownerId: uid,
    memberIds: [uid],
    inviteCode,
    inviteCodeExpiresAt: null,
    updatedAt: now,
  }

  const user: User = {
    uid,
    displayName: 'Guest',
    email: null,
    isAnonymous: true,
    photoURL: null,
    groupIds: [groupId],
    activeGroupId: groupId,
    groupNicknames: {},
    fcmTokens: [],
    settings: DEFAULT_SETTINGS,
    createdAt: now,
    updatedAt: now,
  }

  const milkId = crypto.randomUUID()
  const redbullId = crypto.randomUUID()
  const milkShoppingItemId = crypto.randomUUID()

  const items: Item[] = [
    {
      id: milkId,
      groupId,
      name: 'Milk',
      categories: ['dairy'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 1, initial: 1, unit: 'L' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(2),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: uid,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
    {
      id: redbullId,
      groupId,
      name: 'Red Bull',
      categories: ['drink'],
      colorTag: '#ef4444',
      photoURL: null,
      notes: null,
      quantity: { current: 5, initial: 12, unit: 'can' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: null,
        lastUsedAt: null,
      },
      notification: { enabled: false, daysBeforeExp: null },
      addedBy: uid,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
  ]

  const shoppingItems: ShoppingItem[] = [
    {
      id: milkShoppingItemId,
      groupId,
      shoppingListId: null,
      name: 'Milk',
      quantity: { amount: 1, unit: 'L' },
      linkedRecipeId: null,
      linkedItemId: milkId,
      linkedItemName: 'Milk',
      status: 'toBuy',
      autoAdded: true,
      addedToInventory: false,
      addedBy: uid,
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    },
  ]

  return { user, groups: [group], items, shoppingItems, recipes: [] }
}

export function initLocalStore(uid: string): LocalStoreData {
  const existing = getLocalStore(uid)
  if (existing) return existing
  const data = normalizeData(buildFreshLocalStore(uid))
  saveLocalStore(uid, data)
  return data
}
