import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './db'
import type { Item } from '../types'

export async function addItem(item: Item): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, ...data } = item
  await setDoc(doc(db, 'items', id), { ...data, updatedAt: serverTimestamp() })
}

export async function updateItem(
  id: string,
  data: Partial<Omit<Item, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'items', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'items', id))
}

export async function moveItemsToGroup(
  itemIds: string[],
  toGroupId: string,
): Promise<void> {
  if (itemIds.length === 0) return
  const batch = writeBatch(db)
  for (const id of itemIds) {
    batch.update(doc(db, 'items', id), {
      groupId: toGroupId,
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

export async function deleteItemsBatch(itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return
  const batch = writeBatch(db)
  for (const id of itemIds) {
    batch.delete(doc(db, 'items', id))
  }
  await batch.commit()
}

export function subscribeToItems(
  groupIds: string[],
  callback: (items: Item[]) => void,
): () => void {
  if (groupIds.length === 0) {
    callback([])
    return () => {}
  }
  const q = query(collection(db, 'items'), where('groupId', 'in', groupIds))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item)),
  )
}
