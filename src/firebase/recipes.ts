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
import type { Recipe } from '../types'

export async function addRecipe(recipe: Recipe): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, updatedAt, createdAt, ...data } = recipe
  await setDoc(doc(db, 'recipes', id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateRecipe(
  id: string,
  data: Partial<Omit<Recipe, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'recipes', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recipes', id))
}

export function subscribeToRecipes(
  groupIds: string[],
  callback: (recipes: Recipe[]) => void,
): () => void {
  if (groupIds.length === 0) {
    callback([])
    return () => {}
  }
  const q = query(collection(db, 'recipes'), where('groupId', 'in', groupIds))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Recipe)),
  )
}
