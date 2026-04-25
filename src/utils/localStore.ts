import { Timestamp } from 'firebase/firestore'
import type { User, UserSettings, Group, Item, ShoppingItem, Recipe } from '../types'
import { nextGroupColor } from '../data/groupColors'

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

function serialize(data: LocalStoreData): string {
  return JSON.stringify(data, (_, value) => {
    if (value instanceof Timestamp) {
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
    return value
  })
}

export function getLocalStore(uid: string): LocalStoreData | null {
  try {
    const raw = localStorage.getItem(KEY(uid))
    if (!raw) return null
    return deserialize(raw)
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

  return { user, groups: [group], items: [], shoppingItems: [], recipes: [] }
}

export function initLocalStore(uid: string): LocalStoreData {
  const existing = getLocalStore(uid)
  if (existing) return existing
  const data = buildFreshLocalStore(uid)
  saveLocalStore(uid, data)
  return data
}
