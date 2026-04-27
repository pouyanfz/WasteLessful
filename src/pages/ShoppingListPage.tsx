import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nowTimestamp } from '../utils/timestamp'
import type { Group, ShoppingItem, ShoppingList } from '../types'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { groupBadgeBg } from '../data/groupColors'
import { ITEM_UNITS } from '../data/constants'

const UNITS = [...ITEM_UNITS]

// ─── Tab strip ────────────────────────────────────────────────────────────────

function TabStrip({
  lists,
  groups,
  activeTab,
  onChange,
  onManage,
  onAddList,
}: {
  lists: ShoppingList[]
  groups: Group[]
  activeTab: string
  onChange: (tab: string) => void
  onManage: () => void
  onAddList: (name: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function startAdding() {
    setAdding(true)
    setInput('')
    setTimeout(() => {
      inputRef.current?.focus()
      scrollRef.current?.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      })
    }, 0)
  }

  function confirm() {
    const name = input.trim()
    if (name) onAddList(name)
    setAdding(false)
    setInput('')
  }

  function cancel() {
    setAdding(false)
    setInput('')
  }

  function tabCls(active: boolean) {
    return `shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? 'border-green-500 text-green-600'
        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
    }`
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center max-w-lg mx-auto">
        {/* Manage button */}
        <button
          onClick={onManage}
          className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors border-r border-gray-100 dark:border-gray-700"
          title="Manage lists"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
        </button>

        {/* Scrollable tabs */}
        <div className="relative flex-1 min-w-0">
          <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => onChange('all')}
              className={tabCls(activeTab === 'all')}
            >
              All
            </button>

            {/* Custom shopping lists */}
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => onChange(l.id)}
                className={tabCls(activeTab === l.id)}
              >
                {l.name}
              </button>
            ))}

            {/* Inventory group tabs — separated by a subtle divider if there are custom lists */}
            {groups.length > 0 && lists.length > 0 && (
              <div className="w-px bg-gray-200 dark:bg-gray-600 my-3 mx-1 shrink-0" />
            )}
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => onChange(g.id)}
                className={tabCls(activeTab === g.id)}
              >
                {g.name}
              </button>
            ))}

            {/* Inline add input */}
            {adding && (
              <div className="flex items-center gap-1 shrink-0 py-1.5 px-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      confirm()
                    }
                    if (e.key === 'Escape') cancel()
                  }}
                  placeholder="List name"
                  className="border border-green-400 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
                />
                <button
                  onClick={confirm}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-full bg-green-500 text-white text-lg leading-none flex items-center justify-center disabled:opacity-40 shrink-0"
                >
                  ✓
                </button>
                <button
                  onClick={cancel}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-lg leading-none flex items-center justify-center shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {!adding && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Add button */}
        {!adding && (
          <button
            onClick={startAdding}
            className="shrink-0 w-10 h-10 flex items-center justify-center border-l border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xl leading-none hover:text-green-500 transition-colors"
            title="New list"
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Manage lists modal ───────────────────────────────────────────────────────

function ManageListsModal({
  lists,
  groups,
  onReorder,
  onDelete,
  onClose,
}: {
  lists: ShoppingList[]
  groups: Group[]
  onReorder: (lists: ShoppingList[]) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  function move(i: number, dir: -1 | 1) {
    const next = [...lists]
    const t = i + dir
    if (t < 0 || t >= next.length) return
    ;[next[i], next[t]] = [next[t], next[i]]
    onReorder(next)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Manage Lists
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Custom lists */}
        {lists.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-5 pt-3 pb-1">
              Your lists
            </p>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {lists.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="w-6 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 4l8 8H4z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === lists.length - 1}
                      className="w-6 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 20l-8-8h16z" />
                      </svg>
                    </button>
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {l.name}
                  </span>
                  <button
                    onClick={() => onDelete(l.id)}
                    className="text-sm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Inventory group tabs — read-only info */}
        {groups.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-5 pt-3 pb-1">
              Group tabs
            </p>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {groups.map((g) => (
                <li key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                    {g.name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Managed in Items
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {lists.length === 0 && groups.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
            No lists yet.
          </p>
        )}

        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit sheet ───────────────────────────────────────────────────────────────

function EditShoppingItemSheet({
  item,
  lists,
  groups,
  onSave,
  onDelete,
  onAddToInventory,
  onClose,
}: {
  item: ShoppingItem
  lists: ShoppingList[]
  groups: Group[]
  onSave: (updated: ShoppingItem) => void
  onDelete: (id: string) => void
  onAddToInventory: (item: ShoppingItem) => void
  onClose: () => void
}) {
  const [name, setName] = useState(item.name)
  const [amount, setAmount] = useState(item.quantity.amount)
  const [unit, setUnit] = useState(
    UNITS.includes(item.quantity.unit) ? item.quantity.unit : 'pieces',
  )
  const [customUnit, setCustomUnit] = useState(
    !UNITS.includes(item.quantity.unit) ? item.quantity.unit : '',
  )
  const [isCustomUnit, setIsCustomUnit] = useState(
    !UNITS.includes(item.quantity.unit),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isBought = item.status === 'bought'

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const resolvedUnit = isCustomUnit ? customUnit.trim() || unit : unit
    onSave({
      ...item,
      name: name.trim(),
      quantity: { amount, unit: resolvedUnit },
      updatedAt: nowTimestamp(),
    })
    onClose()
  }

  const listLabel = item.shoppingListId
    ? lists.find((l) => l.id === item.shoppingListId)?.name
    : item.groupId
      ? groups.find((g) => g.id === item.groupId)?.name
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Edit Item</h2>
            {listLabel && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">in {listLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Quantity
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0.1}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              />
              <select
                value={isCustomUnit ? '__custom__' : unit}
                onChange={(e) => {
                  if (e.target.value === '__custom__') setIsCustomUnit(true)
                  else {
                    setIsCustomUnit(false)
                    setUnit(e.target.value)
                  }
                }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="__custom__">custom…</option>
              </select>
            </div>
            {isCustomUnit && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="e.g. jar, tray…"
                autoFocus
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mt-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              />
            )}
          </div>

          {item.autoAdded &&
            item.linkedItemName &&
            item.linkedItemName !== item.name && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                Auto-added to restock:{' '}
                <span className="font-medium">{item.linkedItemName}</span>
              </p>
            )}

          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            Save
          </button>
        </form>

        {isBought &&
          (item.addedToInventory ? (
            <div className="w-full py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-sm font-medium flex items-center justify-center gap-2 cursor-default">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Already added to inventory
            </div>
          ) : (
            <button
              onClick={() => onAddToInventory(item)}
              className="w-full py-3 rounded-xl border border-green-400 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Add to inventory
            </button>
          ))}

        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                onDelete(item.id)
                onClose()
              }}
              className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-red-400 text-sm hover:text-red-600 transition-colors text-center"
          >
            Delete item
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Inventory prompt sheet ───────────────────────────────────────────────────

function InventoryPromptSheet({
  item,
  onAddToInventory,
  onJustMark,
  onClose,
}: {
  item: ShoppingItem
  onAddToInventory: () => void
  onJustMark: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Mark as bought?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Do you want to add{' '}
              <span className="font-medium text-gray-700 dark:text-gray-200">{item.name}</span> to
              your inventory too?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none shrink-0"
          >
            &times;
          </button>
        </div>

        <button
          onClick={onAddToInventory}
          className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Mark bought &amp; add to inventory
        </button>

        <button
          onClick={onJustMark}
          className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Just mark as bought
        </button>
      </div>
    </div>
  )
}

// ─── Shopping row ─────────────────────────────────────────────────────────────

function ShoppingRow({
  item,
  groupLabel,
  groupColor,
  recipeLabel,
  onToggle,
  onEdit,
}: {
  item: ShoppingItem
  groupLabel: string | null
  groupColor: string | null
  recipeLabel: string | null
  onToggle: (id: string) => void
  onEdit: (item: ShoppingItem) => void
}) {
  const bought = item.status === 'bought'
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.99] transition-transform ${bought ? 'opacity-60' : ''}`}
      onClick={() => onEdit(item)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(item.id)
        }}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${bought ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}
      >
        {bought && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${bought ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-50'}`}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {item.quantity.amount} {item.quantity.unit}
          </span>
          {item.autoAdded && (
            <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-medium">
              {item.linkedItemName && item.linkedItemName !== item.name
                ? `restocking ${item.linkedItemName}`
                : 'auto'}
            </span>
          )}
          {recipeLabel && (
            <span className="text-[10px] bg-purple-50 text-purple-600 rounded-full px-1.5 py-0.5 font-medium">
              for {recipeLabel}
            </span>
          )}
          {groupLabel && (
            <span
              style={
                groupColor
                  ? {
                      backgroundColor: groupBadgeBg(groupColor),
                      color: groupColor,
                    }
                  : {}
              }
              className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${!groupColor ? 'bg-gray-100 text-gray-500' : ''}`}
            >
              {groupLabel}
            </span>
          )}
        </div>
      </div>

      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShoppingListPage() {
  const navigate = useNavigate()
  const { firebaseUser } = useAuth()
  const {
    groups,
    shoppingItems: items,
    shoppingLists: lists,
    recipes,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    addShoppingList,
    deleteShoppingList,
  } = useAppData()
  const [activeTab, setActiveTab] = useState('all')
  const [showManage, setShowManage] = useState(false)
  const [pendingToggleItem, setPendingToggleItem] =
    useState<ShoppingItem | null>(null)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState(1)
  const [newUnit, setNewUnit] = useState('pack')
  const [isCustomAddUnit, setIsCustomAddUnit] = useState(false)
  const [customAddUnit, setCustomAddUnit] = useState('')
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)

  // Determine tab type
  const isGroupTab = groups.some((g) => g.id === activeTab)
  const isListTab = lists.some((l) => l.id === activeTab)

  // Scope items to active tab
  const scopedItems =
    activeTab === 'all'
      ? items
      : isGroupTab
        ? items.filter((i) => i.groupId === activeTab)
        : isListTab
          ? items.filter((i) => i.shoppingListId === activeTab)
          : items

  const toBuy = scopedItems.filter((i) => i.status === 'toBuy')
  const bought = scopedItems.filter((i) => i.status === 'bought')

  // Group badge on rows when viewing "All"
  function getRowLabel(item: ShoppingItem): string | null {
    if (activeTab !== 'all') return null
    if (item.shoppingListId)
      return lists.find((l) => l.id === item.shoppingListId)?.name ?? null
    if (item.groupId)
      return groups.find((g) => g.id === item.groupId)?.name ?? null
    return null
  }

  function addList(name: string) {
    const list = addShoppingList(name)
    setActiveTab(list.id)
  }

  function deleteList(id: string) {
    deleteShoppingList(id)
    if (activeTab === id) setActiveTab('all')
  }

  async function toggleStatus(id: string) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    if (item.status === 'toBuy') {
      setPendingToggleItem(item)
    } else {
      await updateShoppingItem(id, {
        status: 'toBuy',
        boughtBy: null,
        boughtAt: null,
      })
    }
  }

  async function markBought(id: string) {
    await updateShoppingItem(id, {
      status: 'bought',
      boughtBy: firebaseUser?.uid ?? null,
      boughtAt: nowTimestamp(),
    })
  }

  async function markBoughtAndAddedToInventory(id: string) {
    await updateShoppingItem(id, {
      status: 'bought',
      boughtBy: firebaseUser?.uid ?? null,
      boughtAt: nowTimestamp(),
      addedToInventory: true,
    })
  }

  async function deleteItem(id: string) {
    await deleteShoppingItem(id)
  }

  async function saveItem(updated: ShoppingItem) {
    await updateShoppingItem(updated.id, updated)
  }

  async function clearBought() {
    const toDelete = items.filter((i) => {
      if (i.status !== 'bought') return false
      if (activeTab === 'all') return true
      if (isGroupTab) return i.groupId === activeTab
      if (isListTab) return i.shoppingListId === activeTab
      return false
    })
    await Promise.all(toDelete.map((i) => deleteShoppingItem(i.id)))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const resolvedUnit = isCustomAddUnit
      ? customAddUnit.trim() || newUnit
      : newUnit
    const now = nowTimestamp()
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: isGroupTab ? activeTab : null,
      shoppingListId: isListTab ? activeTab : null,
      name: newName.trim(),
      quantity: { amount: newAmount, unit: resolvedUnit },
      linkedRecipeId: null,
      linkedItemId: null,
      linkedItemName: null,
      status: 'toBuy',
      autoAdded: false,
      addedToInventory: false,
      addedBy: firebaseUser?.uid ?? 'guest',
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    }
    await addShoppingItem(newItem)
    setNewName('')
    setNewAmount(1)
    setNewUnit('pack')
    setIsCustomAddUnit(false)
    setCustomAddUnit('')
  }

  async function handleAddToInventory(item: ShoppingItem) {
    setEditingItem(null)
    setPendingToggleItem(null)
    await updateShoppingItem(item.id, { addedToInventory: true })
    navigate('/', {
      state: {
        prefillItem: {
          name: item.name,
          amount: item.quantity.amount,
          unit: item.quantity.unit,
          groupId: item.groupId,
        },
      },
    })
  }

  // Add form: show destination selector only on "All" tab
  const showDestSelector = activeTab === 'all'
  const [addDestTab, setAddDestTab] = useState<string>(
    lists[0]?.id ?? groups[0]?.id ?? '',
  )

  async function handleAddFromAll(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !addDestTab) return
    const resolvedUnit = isCustomAddUnit
      ? customAddUnit.trim() || newUnit
      : newUnit
    const now = nowTimestamp()
    const destIsGroup = groups.some((g) => g.id === addDestTab)
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: destIsGroup ? addDestTab : null,
      shoppingListId: destIsGroup ? null : addDestTab,
      name: newName.trim(),
      quantity: { amount: newAmount, unit: resolvedUnit },
      linkedRecipeId: null,
      linkedItemId: null,
      linkedItemName: null,
      status: 'toBuy',
      autoAdded: false,
      addedToInventory: false,
      addedBy: firebaseUser?.uid ?? 'guest',
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    }
    await addShoppingItem(newItem)
    setNewName('')
    setNewAmount(1)
    setNewUnit('pack')
    setIsCustomAddUnit(false)
    setCustomAddUnit('')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Shopping List</h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
          title="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </header>

      {/* Tab strip */}
      <TabStrip
        lists={lists}
        groups={groups}
        activeTab={activeTab}
        onChange={setActiveTab}
        onManage={() => setShowManage(true)}
        onAddList={addList}
      />

      {/* Add form */}
      <form
        onSubmit={showDestSelector ? handleAddFromAll : handleAdd}
        className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex flex-col gap-2"
      >
        {/* Destination selector — only on All tab */}
        {showDestSelector && (lists.length > 0 || groups.length > 0) && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setAddDestTab(l.id)}
                className={`shrink-0 text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${addDestTab === l.id ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}
              >
                {l.name}
              </button>
            ))}
            {lists.length > 0 && groups.length > 0 && (
              <div className="w-px bg-gray-200 dark:bg-gray-600 my-1 shrink-0" />
            )}
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setAddDestTab(g.id)}
                className={`shrink-0 text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${addDestTab === g.id ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Row 1: name */}
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add item…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        />
        {/* Row 2: qty + unit + submit — always fits on any screen width */}
        <div className="flex gap-2">
          <input
            type="number"
            min={0.1}
            step="any"
            value={newAmount}
            onChange={(e) => setNewAmount(Number(e.target.value))}
            className="w-16 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          />
          <select
            value={isCustomAddUnit ? '__custom__' : newUnit}
            onChange={(e) => {
              if (e.target.value === '__custom__') setIsCustomAddUnit(true)
              else {
                setIsCustomAddUnit(false)
                setNewUnit(e.target.value)
              }
            }}
            className="flex-1 border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value="__custom__">custom…</option>
          </select>
          <button
            type="submit"
            disabled={
              !newName.trim() || (isCustomAddUnit && !customAddUnit.trim())
            }
            className="w-10 h-10 rounded-full bg-green-500 text-white text-xl flex items-center justify-center shadow disabled:opacity-40 shrink-0"
          >
            +
          </button>
        </div>
        {isCustomAddUnit && (
          <input
            type="text"
            value={customAddUnit}
            onChange={(e) => setCustomAddUnit(e.target.value)}
            placeholder="e.g. jar, tray…"
            autoFocus
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          />
        )}
      </form>

      {/* List */}
      <main className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-6">
        {toBuy.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 px-1">
              To buy · {toBuy.length}
            </h2>
            {toBuy.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                groupLabel={getRowLabel(item)}
                groupColor={
                  item.groupId
                    ? (groups.find((g) => g.id === item.groupId)?.color ?? null)
                    : null
                }
                recipeLabel={
                  item.linkedRecipeId
                    ? (recipes.find((r) => r.id === item.linkedRecipeId)
                        ?.name ?? null)
                    : null
                }
                onToggle={toggleStatus}
                onEdit={setEditingItem}
              />
            ))}
          </section>
        )}

        {bought.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Bought · {bought.length}
              </h2>
              <button
                onClick={clearBought}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Clear
              </button>
            </div>
            {bought.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                groupLabel={getRowLabel(item)}
                groupColor={
                  item.groupId
                    ? (groups.find((g) => g.id === item.groupId)?.color ?? null)
                    : null
                }
                recipeLabel={
                  item.linkedRecipeId
                    ? (recipes.find((r) => r.id === item.linkedRecipeId)
                        ?.name ?? null)
                    : null
                }
                onToggle={toggleStatus}
                onEdit={setEditingItem}
              />
            ))}
          </section>
        )}

        {scopedItems.length === 0 && (
          <p className="text-center text-gray-400 dark:text-gray-500 mt-12">
            Nothing on the list.
          </p>
        )}
      </main>

      {showManage && (
        <ManageListsModal
          lists={lists}
          groups={groups}
          onReorder={() => {
            /* local list reorder not wired to Firestore */
          }}
          onDelete={deleteList}
          onClose={() => setShowManage(false)}
        />
      )}

      {pendingToggleItem && (
        <InventoryPromptSheet
          item={pendingToggleItem}
          onAddToInventory={() => {
            markBoughtAndAddedToInventory(pendingToggleItem.id)
            handleAddToInventory(pendingToggleItem)
          }}
          onJustMark={() => {
            markBought(pendingToggleItem.id)
            setPendingToggleItem(null)
          }}
          onClose={() => setPendingToggleItem(null)}
        />
      )}

      {editingItem && (
        <EditShoppingItemSheet
          item={editingItem}
          lists={lists}
          groups={groups}
          onSave={saveItem}
          onDelete={deleteItem}
          onAddToInventory={handleAddToInventory}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  )
}
