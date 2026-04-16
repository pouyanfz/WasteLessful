import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './db'
import type { User, UserSettings } from '../types'

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

export async function createUserDoc(
  uid: string,
  opts: {
    displayName?: string | null
    email?: string | null
    photoURL?: string | null
    isAnonymous: boolean
  },
) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    displayName: opts.displayName ?? 'Guest',
    email: opts.email ?? null,
    isAnonymous: opts.isAnonymous,
    photoURL: opts.photoURL ?? null,
    groupIds: [],
    activeGroupId: null,
    settings: DEFAULT_SETTINGS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function getUserDoc(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as User) : null
}

export async function updateUserDoc(
  uid: string,
  data: Partial<Omit<User, 'uid' | 'createdAt'>>,
) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteUserDoc(uid: string) {
  await deleteDoc(doc(db, 'users', uid))
}

export { DEFAULT_SETTINGS }
