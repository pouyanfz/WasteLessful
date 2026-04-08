import type { Timestamp } from 'firebase/firestore'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  notifyDaysBeforeExpiry: number
  notifyOnExpired: boolean
  notifyOnLowQuantity: boolean
  lowQuantityThreshold: number
  notifyUnusedAfterDays: number | null
  weeklyReport: boolean
  autoAddToShoppingListOnExpiry: boolean
  autoAddToShoppingListOnLowQuantity: boolean
  getGroupNotifications: boolean
}

export interface User {
  uid: string
  displayName: string
  email: string | null
  isAnonymous: boolean
  photoURL: string | null
  groupIds: string[]
  activeGroupId: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  settings: UserSettings
}
