import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/db'
import { useAuth } from './AuthContext'
import {
  createGroup,
  updateGroup as fsUpdateGroup,
  deleteGroup as fsDeleteGroup,
  subscribeToGroups,
  refreshInviteCode as fsRefreshInviteCode,
  getGroupByInviteCode,
  joinGroupFirestore,
  removeMemberFirestore,
} from '../firebase/groups'
import {
  addItem as fsAddItem,
  updateItem as fsUpdateItem,
  deleteItem as fsDeleteItem,
  moveItemsToGroup,
  deleteItemsBatch,
  subscribeToItems,
} from '../firebase/items'
import {
  addShoppingItem as fsAddShoppingItem,
  updateShoppingItem as fsUpdateShoppingItem,
  deleteShoppingItem as fsDeleteShoppingItem,
  subscribeToShoppingItems,
} from '../firebase/shoppingList'
import {
  addRecipe as fsAddRecipe,
  updateRecipe as fsUpdateRecipe,
  deleteRecipe as fsDeleteRecipe,
  subscribeToRecipes,
} from '../firebase/recipes'
import {
  updateUserDoc,
  addGroupToUserDoc,
  removeGroupFromUserDoc,
  setGroupNickname as fsSetGroupNickname,
} from '../firebase/users'
import { nextGroupColor } from '../data/groupColors'
import { getLocalStore, initLocalStore, updateLocalStore } from '../utils/localStore'
import type {
  Item,
  Group,
  ShoppingItem,
  ShoppingList,
  Recipe,
  User,
  UserSettings,
} from '../types'
import { nowTimestamp } from '../utils/timestamp'

export type JoinResult =
  | { status: 'joined'; groupId: string; groupName: string }
  | { status: 'already-member'; groupId: string; groupName: string }
  | { status: 'invalid' }
  | { status: 'expired'; groupName: string }

interface AppData {
  userDoc: User | null
  items: Item[]
  groups: Group[]
  shoppingItems: ShoppingItem[]
  shoppingLists: ShoppingList[]
  recipes: Recipe[]
  loading: boolean

  // Settings
  updateSettings: (data: Partial<UserSettings>) => Promise<void>

  // Items
  addItem: (item: Item) => Promise<void>
  updateItem: (id: string, data: Partial<Omit<Item, 'id'>>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  archiveItem: (id: string) => Promise<void>
  restoreItem: (id: string) => Promise<void>

  // Groups
  addGroup: (name: string) => Promise<string>
  updateGroup: (
    id: string,
    data: Partial<Pick<Group, 'name' | 'color'>>,
  ) => Promise<void>
  deleteGroup: (id: string, moveToGroupId: string | null) => Promise<void>
  reorderGroups: (groups: Group[]) => void

  // Shopping items
  addShoppingItem: (item: ShoppingItem) => Promise<void>
  updateShoppingItem: (
    id: string,
    data: Partial<Omit<ShoppingItem, 'id'>>,
  ) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>

  // Invite / members
  refreshInviteCode: (groupId: string) => Promise<string>
  joinGroupByCode: (code: string) => Promise<JoinResult>
  removeMember: (groupId: string, memberId: string) => Promise<void>
  setGroupNickname: (groupId: string, nickname: string) => Promise<void>

  // Named shopping lists (local/session only)
  addShoppingList: (name: string) => ShoppingList
  deleteShoppingList: (id: string) => void

  // Recipes
  addRecipe: (recipe: Recipe) => Promise<void>
  updateRecipe: (id: string, data: Partial<Omit<Recipe, 'id'>>) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
}

const AppDataContext = createContext<AppData | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth()
  const isAnon = firebaseUser?.isAnonymous ?? true

  // ── Local state (anonymous users) ────────────────────────────────────────────
  const [localUserDoc, setLocalUserDoc] = useState<User | null>(null)
  const [localGroups, setLocalGroups] = useState<Group[]>([])
  const [localItems, setLocalItems] = useState<Item[]>([])
  const [localAnonShoppingItems, setLocalAnonShoppingItems] = useState<ShoppingItem[]>([])
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>([])

  // ── Firestore state (real users) ──────────────────────────────────────────────
  const [firestoreUserDoc, setFirestoreUserDoc] = useState<User | null>(null)
  const [firestoreGroups, setFirestoreGroups] = useState<Group[]>([])
  const [groupOrder, setGroupOrder] = useState<string[]>([])
  const [firestoreItems, setFirestoreItems] = useState<Item[]>([])
  const [firestoreShoppingItems, setFirestoreShoppingItems] = useState<ShoppingItem[]>([])
  const [firestoreRecipes, setFirestoreRecipes] = useState<Recipe[]>([])

  // Named shopping list items (session-only, both modes)
  const [namedListShoppingItems, setNamedListShoppingItems] = useState<ShoppingItem[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])

  const [dataLoading, setDataLoading] = useState(true)

  // ── Load from local store (anonymous users) ───────────────────────────────────
  useEffect(() => {
    if (!firebaseUser?.isAnonymous) return
    const data = initLocalStore(firebaseUser.uid)
    setLocalUserDoc(data.user)
    setLocalGroups(data.groups)
    setLocalItems(data.items)
    setLocalAnonShoppingItems(data.shoppingItems)
    setLocalRecipes(data.recipes)
    setDataLoading(false)
  }, [firebaseUser?.uid, firebaseUser?.isAnonymous])

  // ── Subscribe to Firestore user document (real users only) ────────────────────
  useEffect(() => {
    if (!firebaseUser || firebaseUser.isAnonymous) {
      setFirestoreUserDoc(null)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      if (snap.exists()) setFirestoreUserDoc(snap.data() as User)
    })
    return unsub
  }, [firebaseUser?.uid, firebaseUser?.isAnonymous])

  // ── Subscribe to Firestore groups/items/shopping/recipes (real users only) ────
  useEffect(() => {
    if (!firestoreUserDoc) return
    const groupIds = firestoreUserDoc.groupIds ?? []
    setDataLoading(true)

    const unsubGroups = subscribeToGroups(groupIds, (groups) => {
      setFirestoreGroups(groups)
      setGroupOrder((prev) =>
        prev.length === 0 ? groups.map((g) => g.id) : prev,
      )
      setDataLoading(false)
    })

    const unsubItems = subscribeToItems(groupIds, setFirestoreItems)
    const unsubShopping = subscribeToShoppingItems(groupIds, setFirestoreShoppingItems)
    const unsubRecipes = subscribeToRecipes(groupIds, setFirestoreRecipes)

    if (groupIds.length === 0) setDataLoading(false)

    return () => {
      unsubGroups()
      unsubItems()
      unsubShopping()
      unsubRecipes()
    }
  }, [firestoreUserDoc?.groupIds?.join(',')])

  // ── Derived values ────────────────────────────────────────────────────────────

  const userDoc = isAnon ? localUserDoc : firestoreUserDoc

  const groups = useMemo(() => {
    if (isAnon) return localGroups
    if (groupOrder.length === 0) return firestoreGroups
    return [...firestoreGroups].sort(
      (a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id),
    )
  }, [isAnon, localGroups, firestoreGroups, groupOrder])

  const items = isAnon ? localItems : firestoreItems

  const shoppingItems = useMemo(() => {
    const base = isAnon ? localAnonShoppingItems : firestoreShoppingItems
    return [...base, ...namedListShoppingItems]
  }, [isAnon, localAnonShoppingItems, firestoreShoppingItems, namedListShoppingItems])

  const recipes = isAnon ? localRecipes : firestoreRecipes

  const loading = dataLoading

  // ── Settings ──────────────────────────────────────────────────────────────────

  async function updateSettings(data: Partial<UserSettings>) {
    if (isAnon) {
      if (!firebaseUser || !localUserDoc) return
      const newSettings = { ...localUserDoc.settings, ...data }
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        user: { ...store.user, settings: newSettings },
      }))
      setLocalUserDoc(updated.user)
    } else {
      if (!firebaseUser || !firestoreUserDoc) return
      await updateUserDoc(firebaseUser.uid, {
        settings: { ...firestoreUserDoc.settings, ...data },
      })
    }
  }

  // ── Items ──────────────────────────────────────────────────────────────────────

  async function addItem(item: Item) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        items: [...store.items, item],
      }))
      setLocalItems(updated.items)
    } else {
      await fsAddItem(item)
    }
  }

  async function updateItem(id: string, data: Partial<Omit<Item, 'id'>>) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        items: store.items.map((i) =>
          i.id === id ? { ...i, ...data, updatedAt: Timestamp.now() } : i,
        ),
      }))
      setLocalItems(updated.items)
    } else {
      await fsUpdateItem(id, data)
    }
  }

  async function deleteItem(id: string) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        items: store.items.filter((i) => i.id !== id),
      }))
      setLocalItems(updated.items)
    } else {
      await fsDeleteItem(id)
    }
  }

  async function archiveItem(id: string) {
    await updateItem(id, { isArchived: true, archivedAt: nowTimestamp() })
  }

  async function restoreItem(id: string) {
    await updateItem(id, { isArchived: false, archivedAt: null })
  }

  // ── Invite / members ──────────────────────────────────────────────────────────

  async function refreshInviteCode(groupId: string): Promise<string> {
    return fsRefreshInviteCode(groupId)
  }

  async function joinGroupByCode(code: string): Promise<JoinResult> {
    if (!firebaseUser || isAnon) return { status: 'invalid' }
    const group = await getGroupByInviteCode(code.trim().toUpperCase())
    if (!group) return { status: 'invalid' }
    const expiry = group.inviteCodeExpiresAt
    if (expiry && expiry.toDate() < new Date()) {
      return { status: 'expired', groupName: group.name }
    }
    if (group.memberIds.includes(firebaseUser.uid)) {
      return {
        status: 'already-member',
        groupId: group.id,
        groupName: group.name,
      }
    }
    await joinGroupFirestore(group.id, firebaseUser.uid)
    await addGroupToUserDoc(firebaseUser.uid, group.id)
    return { status: 'joined', groupId: group.id, groupName: group.name }
  }

  async function removeMember(groupId: string, memberId: string): Promise<void> {
    await removeMemberFirestore(groupId, memberId)
    await removeGroupFromUserDoc(memberId, groupId)
  }

  async function setGroupNickname(groupId: string, nickname: string): Promise<void> {
    if (!firebaseUser) return
    if (isAnon) {
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        user: {
          ...store.user,
          groupNicknames: {
            ...store.user.groupNicknames,
            ...(nickname.trim()
              ? { [groupId]: nickname.trim() }
              : Object.fromEntries(
                  Object.entries(store.user.groupNicknames).filter(
                    ([k]) => k !== groupId,
                  ),
                )),
          },
        },
      }))
      setLocalUserDoc(updated.user)
    } else {
      await fsSetGroupNickname(firebaseUser.uid, groupId, nickname)
    }
  }

  // ── Groups ────────────────────────────────────────────────────────────────────

  async function addGroup(name: string): Promise<string> {
    if (!firebaseUser) throw new Error('Not authenticated')

    if (isAnon) {
      if (!localUserDoc) throw new Error('Local store not initialized')
      const color = nextGroupColor(localGroups.map((g) => g.color))
      const groupId = crypto.randomUUID()
      const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase()
      const now = Timestamp.now()
      const newGroup: Group = {
        id: groupId,
        name,
        color,
        ownerId: firebaseUser.uid,
        memberIds: [firebaseUser.uid],
        inviteCode,
        inviteCodeExpiresAt: null,
        updatedAt: now,
      }
      const newGroupIds = [...(localUserDoc.groupIds ?? []), groupId]
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        user: { ...store.user, groupIds: newGroupIds },
        groups: [...store.groups, newGroup],
      }))
      setLocalUserDoc(updated.user)
      setLocalGroups(updated.groups)
      return groupId
    }

    if (!firestoreUserDoc) throw new Error('Not authenticated')
    const color = nextGroupColor(firestoreGroups.map((g) => g.color))
    const groupId = await createGroup(firebaseUser.uid, name, color)
    const newGroupIds = [...(firestoreUserDoc.groupIds ?? []), groupId]
    await updateUserDoc(firebaseUser.uid, { groupIds: newGroupIds })
    setGroupOrder((prev) => [...prev, groupId])
    return groupId
  }

  async function updateGroup(id: string, data: Partial<Pick<Group, 'name' | 'color'>>) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        groups: store.groups.map((g) =>
          g.id === id ? { ...g, ...data, updatedAt: Timestamp.now() } : g,
        ),
      }))
      setLocalGroups(updated.groups)
    } else {
      await fsUpdateGroup(id, data)
    }
  }

  async function deleteGroup(id: string, moveToGroupId: string | null) {
    if (!firebaseUser) return

    if (isAnon) {
      if (!localUserDoc) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        items: moveToGroupId
          ? store.items.map((i) =>
              i.groupId === id ? { ...i, groupId: moveToGroupId } : i,
            )
          : store.items.filter((i) => i.groupId !== id),
        groups: store.groups.filter((g) => g.id !== id),
        user: {
          ...store.user,
          groupIds: store.user.groupIds.filter((gid) => gid !== id),
        },
      }))
      setLocalGroups(updated.groups)
      setLocalItems(updated.items)
      setLocalUserDoc(updated.user)
      return
    }

    if (!firestoreUserDoc) return
    const groupItemIds = firestoreItems
      .filter((i) => i.groupId === id)
      .map((i) => i.id)

    if (moveToGroupId) {
      await moveItemsToGroup(groupItemIds, moveToGroupId)
    } else {
      await deleteItemsBatch(groupItemIds)
    }

    await fsDeleteGroup(id)
    const newGroupIds = firestoreUserDoc.groupIds.filter((gid) => gid !== id)
    await updateUserDoc(firebaseUser.uid, { groupIds: newGroupIds })
    setGroupOrder((prev) => prev.filter((gid) => gid !== id))
  }

  function reorderGroups(newGroups: Group[]) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        groups: newGroups,
      }))
      setLocalGroups(updated.groups)
    } else {
      setGroupOrder(newGroups.map((g) => g.id))
    }
  }

  // ── Shopping items ────────────────────────────────────────────────────────────

  async function addShoppingItem(item: ShoppingItem) {
    if (item.groupId !== null) {
      if (isAnon) {
        if (!firebaseUser) return
        const updated = updateLocalStore(firebaseUser.uid, (store) => ({
          ...store,
          shoppingItems: [...store.shoppingItems, item],
        }))
        setLocalAnonShoppingItems(updated.shoppingItems)
      } else {
        await fsAddShoppingItem(item)
      }
    } else {
      // Named-list items are always session-only
      setNamedListShoppingItems((prev) => [...prev, item])
    }
  }

  async function updateShoppingItem(
    id: string,
    data: Partial<Omit<ShoppingItem, 'id'>>,
  ) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        shoppingItems: store.shoppingItems.map((i) =>
          i.id === id ? { ...i, ...data, updatedAt: Timestamp.now() } : i,
        ),
      }))
      setLocalAnonShoppingItems(updated.shoppingItems)
    } else {
      const isFirestore = firestoreShoppingItems.some((i) => i.id === id)
      if (isFirestore) {
        await fsUpdateShoppingItem(id, data)
      } else {
        setNamedListShoppingItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...data } : i)),
        )
      }
    }
  }

  async function deleteShoppingItem(id: string) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        shoppingItems: store.shoppingItems.filter((i) => i.id !== id),
      }))
      setLocalAnonShoppingItems(updated.shoppingItems)
    } else {
      const isFirestore = firestoreShoppingItems.some((i) => i.id === id)
      if (isFirestore) {
        await fsDeleteShoppingItem(id)
      } else {
        setNamedListShoppingItems((prev) => prev.filter((i) => i.id !== id))
      }
    }
  }

  // ── Named shopping lists (session-only) ──────────────────────────────────────

  function addShoppingList(name: string): ShoppingList {
    const list: ShoppingList = { id: crypto.randomUUID(), name }
    setShoppingLists((prev) => [...prev, list])
    return list
  }

  function deleteShoppingList(id: string) {
    setShoppingLists((prev) => prev.filter((l) => l.id !== id))
    setNamedListShoppingItems((prev) =>
      prev.filter((i) => i.shoppingListId !== id),
    )
  }

  // ── Recipes ───────────────────────────────────────────────────────────────────

  async function addRecipe(recipe: Recipe) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        recipes: [...store.recipes, recipe],
      }))
      setLocalRecipes(updated.recipes)
    } else {
      await fsAddRecipe(recipe)
    }
  }

  async function updateRecipe(id: string, data: Partial<Omit<Recipe, 'id'>>) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        recipes: store.recipes.map((r) =>
          r.id === id ? { ...r, ...data, updatedAt: Timestamp.now() } : r,
        ),
      }))
      setLocalRecipes(updated.recipes)
    } else {
      await fsUpdateRecipe(id, data)
    }
  }

  async function deleteRecipe(id: string) {
    if (isAnon) {
      if (!firebaseUser) return
      const updated = updateLocalStore(firebaseUser.uid, (store) => ({
        ...store,
        recipes: store.recipes.filter((r) => r.id !== id),
      }))
      setLocalRecipes(updated.recipes)
    } else {
      await fsDeleteRecipe(id)
    }
  }

  return (
    <AppDataContext.Provider
      value={{
        userDoc,
        items,
        groups,
        shoppingItems,
        shoppingLists,
        recipes,
        loading,
        updateSettings,
        addItem,
        updateItem,
        deleteItem,
        archiveItem,
        restoreItem,
        refreshInviteCode,
        joinGroupByCode,
        removeMember,
        setGroupNickname,
        addGroup,
        updateGroup,
        deleteGroup,
        reorderGroups,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        addShoppingList,
        deleteShoppingList,
        addRecipe,
        updateRecipe,
        deleteRecipe,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
