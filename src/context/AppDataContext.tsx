import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
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

  const [userDoc, setUserDoc] = useState<User | null>(null)
  const [firestoreGroups, setFirestoreGroups] = useState<Group[]>([])
  const [groupOrder, setGroupOrder] = useState<string[]>([])
  const [firestoreItems, setFirestoreItems] = useState<Item[]>([])
  const [firestoreShoppingItems, setFirestoreShoppingItems] = useState<
    ShoppingItem[]
  >([])
  // Named list items are session-only (not persisted in Firestore)
  const [localShoppingItems, setLocalShoppingItems] = useState<ShoppingItem[]>(
    [],
  )
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Subscribe to user document
  useEffect(() => {
    if (!firebaseUser) {
      setUserDoc(null)
      setDataLoading(false)
      return
    }
    const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
      if (snap.exists()) {
        setUserDoc(snap.data() as User)
      }
    })
    return unsub
  }, [firebaseUser?.uid])

  // Subscribe to groups / items / shopping / recipes when groupIds change
  useEffect(() => {
    const groupIds = userDoc?.groupIds ?? []
    setDataLoading(true)

    const unsubGroups = subscribeToGroups(groupIds, (groups) => {
      setFirestoreGroups(groups)
      // Initialize order on first load
      setGroupOrder((prev) =>
        prev.length === 0 ? groups.map((g) => g.id) : prev,
      )
      setDataLoading(false)
    })

    const unsubItems = subscribeToItems(groupIds, setFirestoreItems)
    const unsubShopping = subscribeToShoppingItems(
      groupIds,
      setFirestoreShoppingItems,
    )
    const unsubRecipes = subscribeToRecipes(groupIds, setRecipes)

    if (groupIds.length === 0) setDataLoading(false)

    return () => {
      unsubGroups()
      unsubItems()
      unsubShopping()
      unsubRecipes()
    }
  }, [userDoc?.groupIds?.join(',')])

  // Groups sorted by local order
  const groups = useMemo(() => {
    if (groupOrder.length === 0) return firestoreGroups
    return [...firestoreGroups].sort(
      (a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id),
    )
  }, [firestoreGroups, groupOrder])

  const shoppingItems = useMemo(
    () => [...firestoreShoppingItems, ...localShoppingItems],
    [firestoreShoppingItems, localShoppingItems],
  )

  const loading = dataLoading

  // ── Settings ────────────────────────────────────────────────────────────────

  async function updateSettings(data: Partial<UserSettings>) {
    if (!firebaseUser || !userDoc) return
    await updateUserDoc(firebaseUser.uid, {
      settings: { ...userDoc.settings, ...data },
    })
  }

  // ── Items ────────────────────────────────────────────────────────────────────

  async function addItem(item: Item) {
    await fsAddItem(item)
  }

  async function updateItem(id: string, data: Partial<Omit<Item, 'id'>>) {
    await fsUpdateItem(id, data)
  }

  async function deleteItem(id: string) {
    await fsDeleteItem(id)
  }

  async function archiveItem(id: string) {
    await fsUpdateItem(id, {
      isArchived: true,
      archivedAt: nowTimestamp(),
    })
  }

  async function restoreItem(id: string) {
    await fsUpdateItem(id, { isArchived: false, archivedAt: null })
  }

  // ── Invite / members ────────────────────────────────────────────────────────

  async function refreshInviteCode(groupId: string): Promise<string> {
    return fsRefreshInviteCode(groupId)
  }

  async function joinGroupByCode(code: string): Promise<JoinResult> {
    if (!firebaseUser) return { status: 'invalid' }
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

  async function removeMember(
    groupId: string,
    memberId: string,
  ): Promise<void> {
    await removeMemberFirestore(groupId, memberId)
    await removeGroupFromUserDoc(memberId, groupId)
  }

  async function setGroupNickname(
    groupId: string,
    nickname: string,
  ): Promise<void> {
    if (!firebaseUser) return
    await fsSetGroupNickname(firebaseUser.uid, groupId, nickname)
  }

  // ── Groups ───────────────────────────────────────────────────────────────────

  async function addGroup(name: string): Promise<string> {
    if (!firebaseUser || !userDoc) throw new Error('Not authenticated')
    const color = nextGroupColor(firestoreGroups.map((g) => g.color))
    const groupId = await createGroup(firebaseUser.uid, name, color)
    const newGroupIds = [...(userDoc.groupIds ?? []), groupId]
    await updateUserDoc(firebaseUser.uid, { groupIds: newGroupIds })
    setGroupOrder((prev) => [...prev, groupId])
    return groupId
  }

  async function updateGroup(
    id: string,
    data: Partial<Pick<Group, 'name' | 'color'>>,
  ) {
    await fsUpdateGroup(id, data)
  }

  async function deleteGroup(id: string, moveToGroupId: string | null) {
    if (!firebaseUser || !userDoc) return
    const groupItemIds = firestoreItems
      .filter((i) => i.groupId === id)
      .map((i) => i.id)

    if (moveToGroupId) {
      await moveItemsToGroup(groupItemIds, moveToGroupId)
    } else {
      await deleteItemsBatch(groupItemIds)
    }

    await fsDeleteGroup(id)
    const newGroupIds = userDoc.groupIds.filter((gid) => gid !== id)
    await updateUserDoc(firebaseUser.uid, { groupIds: newGroupIds })
    setGroupOrder((prev) => prev.filter((gid) => gid !== id))
  }

  function reorderGroups(newGroups: Group[]) {
    setGroupOrder(newGroups.map((g) => g.id))
  }

  // ── Shopping items ───────────────────────────────────────────────────────────

  async function addShoppingItem(item: ShoppingItem) {
    if (item.groupId !== null) {
      await fsAddShoppingItem(item)
    } else {
      // Named-list items are session-only
      setLocalShoppingItems((prev) => [...prev, item])
    }
  }

  async function updateShoppingItem(
    id: string,
    data: Partial<Omit<ShoppingItem, 'id'>>,
  ) {
    const isFirestore = firestoreShoppingItems.some((i) => i.id === id)
    if (isFirestore) {
      await fsUpdateShoppingItem(id, data)
    } else {
      setLocalShoppingItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...data } : i)),
      )
    }
  }

  async function deleteShoppingItem(id: string) {
    const isFirestore = firestoreShoppingItems.some((i) => i.id === id)
    if (isFirestore) {
      await fsDeleteShoppingItem(id)
    } else {
      setLocalShoppingItems((prev) => prev.filter((i) => i.id !== id))
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
    setLocalShoppingItems((prev) => prev.filter((i) => i.shoppingListId !== id))
  }

  // ── Recipes ──────────────────────────────────────────────────────────────────

  async function addRecipe(recipe: Recipe) {
    await fsAddRecipe(recipe)
  }

  async function updateRecipe(id: string, data: Partial<Omit<Recipe, 'id'>>) {
    await fsUpdateRecipe(id, data)
  }

  async function deleteRecipe(id: string) {
    await fsDeleteRecipe(id)
  }

  return (
    <AppDataContext.Provider
      value={{
        userDoc,
        items: firestoreItems,
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
