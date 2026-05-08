import { useState } from 'react'
import type { Item, QuantityUnit } from '../types'
import type { Group } from '../types'
import { nowTimestamp, dateStringToTimestamp } from '../utils/timestamp'
import { ITEM_UNITS, ITEM_COLOR_TAGS, ITEM_CATEGORIES } from '../data/constants'

const UNITS: QuantityUnit[] = [...ITEM_UNITS]
const COLOR_OPTIONS = [...ITEM_COLOR_TAGS]
const CATEGORY_OPTIONS = [...ITEM_CATEGORIES]

interface EditItemModalProps {
  item: Item
  groups: Group[]
  onSave: (updated: Item) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function toDateInputValue(ts: { toDate: () => Date } | null): string {
  if (!ts) return ''
  const d = ts.toDate()
  return d.toISOString().split('T')[0]
}

export default function EditItemModal({
  item,
  groups,
  onSave,
  onDelete,
  onClose,
}: EditItemModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(item.groupId)
  const [name, setName] = useState(item.name)
  const [categories, setCategories] = useState<string[]>(item.categories)
  const [customCategoryInput, setCustomCategoryInput] = useState('')
  const [colorTag, setColorTag] = useState<string | null>(item.colorTag)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [quantity, setQuantity] = useState(item.quantity)
  const initialCustomUnit = UNITS.includes(item.quantity.unit)
    ? null
    : item.quantity.unit
  const [isCustomUnit, setIsCustomUnit] = useState(false)
  const [customUnitInput, setCustomUnitInput] = useState('')
  const [confirmedCustomUnit, setConfirmedCustomUnit] = useState<string | null>(
    initialCustomUnit,
  )
  const [expiresAt, setExpiresAt] = useState(
    toDateInputValue(item.dates.expiresAt),
  )
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  function addCustomCategory() {
    const val = customCategoryInput.trim().toLowerCase()
    if (val && !categories.includes(val))
      setCategories((prev) => [...prev, val])
    setCustomCategoryInput('')
  }

  function removeCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat))
  }

  function confirmCustomUnit() {
    const val = customUnitInput.trim()
    if (val) {
      setConfirmedCustomUnit(val)
      setQuantity((q) => ({ ...q, unit: val }))
      setCustomUnitInput('')
      setIsCustomUnit(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const updated: Item = {
      ...item,
      groupId: selectedGroupId,
      name: name.trim(),
      categories,
      colorTag,
      notes: notes.trim() || null,
      quantity: {
        ...quantity,
        initial: quantity.unit === '%' ? 100 : quantity.initial,
      },
      dates: {
        ...item.dates,
        expiresAt: expiresAt ? dateStringToTimestamp(expiresAt) : null,
      },
      updatedAt: nowTimestamp(),
    }

    onSave(updated)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Edit Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Group */}
          {groups.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Group</label>
              <div className="flex gap-2 flex-wrap">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`text-sm rounded-full px-4 py-2 border font-medium transition-colors ${
                      selectedGroupId === g.id
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
              autoFocus
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Quantity
            </label>
            <div className="flex gap-2 items-end">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Current</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={quantity.current}
                  onChange={(e) =>
                    setQuantity((q) => ({
                      ...q,
                      current: Number(e.target.value),
                    }))
                  }
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <span className="text-gray-300 dark:text-gray-600 text-base pb-2">/</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 dark:text-gray-500">Max</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={quantity.unit === '%' ? 100 : quantity.initial}
                  disabled={quantity.unit === '%'}
                  onChange={(e) =>
                    setQuantity((q) => ({
                      ...q,
                      initial: Number(e.target.value),
                    }))
                  }
                  className={`border rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-green-400 ${quantity.unit === '%' ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'}`}
                />
              </div>
              <select
                value={isCustomUnit ? '__custom__' : quantity.unit}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomUnit(true)
                  } else {
                    setIsCustomUnit(false)
                    setCustomUnitInput('')
                    if (e.target.value !== confirmedCustomUnit)
                      setConfirmedCustomUnit(null)
                    setQuantity((q) => ({
                      ...q,
                      unit: e.target.value as QuantityUnit,
                      ...(e.target.value === '%' ? { initial: 100 } : {}),
                    }))
                  }
                }}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                {confirmedCustomUnit && (
                  <option value={confirmedCustomUnit}>
                    {confirmedCustomUnit}
                  </option>
                )}
                <option value="__custom__">custom…</option>
              </select>
            </div>
            {isCustomUnit && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={customUnitInput}
                  onChange={(e) => setCustomUnitInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    (e.preventDefault(), confirmCustomUnit())
                  }
                  placeholder="e.g. jar, tray…"
                  autoFocus
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={confirmCustomUnit}
                  disabled={!customUnitInput.trim()}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-40"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* Expiry */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Expiry date
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 flex-1 dark:bg-gray-800 dark:text-gray-100"
              />
              {expiresAt && (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 rounded-lg px-2.5 py-2 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                    categories.includes(cat)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {categories
                .filter((c) => !CATEGORY_OPTIONS.includes(c))
                .map((cat) => (
                  <span
                    key={cat}
                    className="text-xs rounded-full px-3 py-1 border bg-green-500 text-white border-green-500 flex items-center gap-1"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="leading-none hover:text-green-200"
                    >
                      &times;
                    </button>
                  </span>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addCustomCategory())
                }
                placeholder="Add custom category…"
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={addCustomCategory}
                disabled={!customCategoryInput.trim()}
                className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {/* Color tag */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Color tag
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTag(colorTag === c ? null : c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: colorTag === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            Save Changes
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id)
                  onClose()
                }}
                className="flex-1 bg-red-500 text-white rounded-xl py-3 font-medium text-sm hover:bg-red-600 transition-colors"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl py-3 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-red-400 text-sm hover:text-red-600 transition-colors"
            >
              Delete item
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
