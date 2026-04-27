import {
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './db'
import type { LocalStoreData } from '../utils/localStore'

export async function migrateLocalToFirestore(
  uid: string,
  data: LocalStoreData,
  displayName: string | null,
  email: string | null,
  photoURL: string | null,
): Promise<void> {
  // Create the user doc with real account info and migrated settings/groups
  await setDoc(doc(db, 'users', uid), {
    uid,
    displayName: displayName ?? data.user.displayName ?? 'Guest',
    email: email ?? null,
    isAnonymous: false,
    photoURL: photoURL ?? null,
    groupIds: data.groups.map((g) => g.id),
    activeGroupId: data.user.activeGroupId ?? data.groups[0]?.id ?? null,
    groupNicknames: data.user.groupNicknames ?? {},
    fcmTokens: [],
    settings: data.user.settings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Write groups + inviteLookup entries
  for (const group of data.groups) {
    const inviteCode =
      group.inviteCode || crypto.randomUUID().slice(0, 8).toUpperCase()
    const batch = writeBatch(db)
    batch.set(doc(db, 'groups', group.id), {
      name: group.name,
      color: group.color,
      ownerId: uid,
      memberIds: [uid],
      inviteCode,
      inviteCodeExpiresAt: null,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(db, 'inviteLookup', inviteCode), { groupId: group.id })
    await batch.commit()
  }

  // Batch-write items, shopping items, recipes (Firestore limit: 500 per batch)
  const writes: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = []

  for (const item of data.items) {
    const { id, updatedAt: _u, ...rest } = item
    writes.push({
      ref: doc(db, 'items', id),
      data: { ...rest, updatedAt: serverTimestamp() },
    })
  }

  for (const si of data.shoppingItems) {
    const { id, updatedAt: _u, ...rest } = si
    writes.push({
      ref: doc(db, 'shoppingList', id),
      data: { ...rest, updatedAt: serverTimestamp() },
    })
  }

  for (const recipe of data.recipes) {
    const { id, updatedAt: _u, createdAt: _c, ...rest } = recipe
    writes.push({
      ref: doc(db, 'recipes', id),
      data: { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    })
  }

  for (let i = 0; i < writes.length; i += 490) {
    const batch = writeBatch(db)
    for (const w of writes.slice(i, i + 490)) {
      batch.set(w.ref, w.data)
    }
    await batch.commit()
  }
}
