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
} from 'firebase/firestore'
import { db } from './db'
import type { ShoppingItem } from '../types'

export async function addShoppingItem(item: ShoppingItem): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, ...data } = item
  await setDoc(doc(db, 'shoppingList', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function updateShoppingItem(
  id: string,
  data: Partial<Omit<ShoppingItem, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'shoppingList', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'shoppingList', id))
}

export function subscribeToShoppingItems(
  groupIds: string[],
  callback: (items: ShoppingItem[]) => void,
): () => void {
  if (groupIds.length === 0) {
    callback([])
    return () => {}
  }
  const q = query(
    collection(db, 'shoppingList'),
    where('groupId', 'in', groupIds),
  )
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ShoppingItem)),
  )
}
