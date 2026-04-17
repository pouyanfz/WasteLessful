import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  documentId,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore'
import { db } from './db'
import type { Group } from '../types'

export async function createGroup(
  ownerId: string,
  name: string,
  color: string,
): Promise<string> {
  const id = crypto.randomUUID()
  const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()
  await setDoc(doc(db, 'groups', id), {
    name,
    color,
    ownerId,
    memberIds: [ownerId],
    inviteCode,
    inviteCodeExpiresAt: null,
    updatedAt: serverTimestamp(),
  })
  // Write lookup entry so non-members can find this group by code
  await setDoc(doc(db, 'inviteLookup', inviteCode), { groupId: id })
  return id
}

export async function updateGroup(
  id: string,
  data: Partial<Pick<Group, 'name' | 'color'>>,
) {
  await updateDoc(doc(db, 'groups', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteGroup(id: string) {
  await deleteDoc(doc(db, 'groups', id))
}

export async function refreshInviteCode(groupId: string): Promise<string> {
  // Read the current code so we can delete its lookup entry
  const groupSnap = await getDoc(doc(db, 'groups', groupId))
  const oldCode = groupSnap.exists()
    ? (groupSnap.data().inviteCode as string | null)
    : null

  const code = crypto.randomUUID().slice(0, 8).toUpperCase()
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  )
  await updateDoc(doc(db, 'groups', groupId), {
    inviteCode: code,
    inviteCodeExpiresAt: expiresAt,
    updatedAt: serverTimestamp(),
  })

  // Remove old lookup entry, write new one
  if (oldCode) {
    await deleteDoc(doc(db, 'inviteLookup', oldCode))
  }
  await setDoc(doc(db, 'inviteLookup', code), { groupId })

  return code
}

export async function getGroupByInviteCode(
  code: string,
): Promise<Group | null> {
  // Use a direct document read on the lookup collection (avoids collection query
  // permission issues — Firestore rules can't evaluate collection queries that
  // depend on document fields not constrained by the query).
  const lookupSnap = await getDoc(doc(db, 'inviteLookup', code.toUpperCase()))
  if (!lookupSnap.exists()) return null

  const { groupId } = lookupSnap.data() as { groupId: string }
  const groupSnap = await getDoc(doc(db, 'groups', groupId))
  if (!groupSnap.exists()) return null

  return { id: groupSnap.id, ...groupSnap.data() } as Group
}

export async function joinGroupFirestore(
  groupId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    memberIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  })
}

export async function removeMemberFirestore(
  groupId: string,
  userId: string,
): Promise<void> {
  await updateDoc(doc(db, 'groups', groupId), {
    memberIds: arrayRemove(userId),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToGroups(
  groupIds: string[],
  callback: (groups: Group[]) => void,
): () => void {
  if (groupIds.length === 0) {
    callback([])
    return () => {}
  }
  const q = query(collection(db, 'groups'), where(documentId(), 'in', groupIds))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Group)),
  )
}
