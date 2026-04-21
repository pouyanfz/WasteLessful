import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  documentId,
  arrayRemove,
  arrayUnion,
  deleteField,
} from 'firebase/firestore'
import { db } from './db'
import type { User, UserSettings } from '../types'

export interface MemberProfile {
  uid: string
  displayName: string
  photoURL: string | null
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
    groupNicknames: {},
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

export async function setGroupNickname(
  uid: string,
  groupId: string,
  nickname: string,
): Promise<void> {
  // Empty string = remove the nickname (fall back to the group's real name)
  await updateDoc(doc(db, 'users', uid), {
    [`groupNicknames.${groupId}`]: nickname.trim() || deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function addGroupToUserDoc(
  uid: string,
  groupId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    groupIds: arrayUnion(groupId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeGroupFromUserDoc(
  uid: string,
  groupId: string,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    groupIds: arrayRemove(groupId),
    updatedAt: serverTimestamp(),
  })
}

export async function getMemberProfiles(
  uids: string[],
): Promise<MemberProfile[]> {
  if (uids.length === 0) return []
  const snap = await getDocs(
    query(collection(db, 'users'), where(documentId(), 'in', uids)),
  )
  return snap.docs.map((d) => ({
    uid: d.id,
    displayName: (d.data().displayName as string) ?? 'Unknown',
    photoURL: (d.data().photoURL as string | null) ?? null,
  }))
}

export async function saveFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  })
}

export async function removeFcmToken(uid: string, token: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayRemove(token),
    updatedAt: serverTimestamp(),
  })
}

export { DEFAULT_SETTINGS }
