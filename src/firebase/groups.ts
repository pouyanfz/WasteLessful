import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  documentId,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './db'
import type { Group } from '../types'

export async function createGroup(
  ownerId: string,
  name: string,
  color: string,
): Promise<string> {
  const id = crypto.randomUUID()
  await setDoc(doc(db, 'groups', id), {
    name,
    color,
    ownerId,
    memberIds: [ownerId],
    inviteCode: crypto.randomUUID().slice(0, 8).toUpperCase(),
    inviteCodeExpiresAt: null,
    updatedAt: serverTimestamp(),
  })
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
