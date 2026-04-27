import type { Item } from '../types'
import { daysUntilExpiry } from '../utils/expiry'
import { isLowQuantity } from '../utils/quantity'
import { mockUser } from '../data/mockUsers'

export type ExpiryStatus = 'expired' | 'expiringSoon' | 'fresh' | 'noExpiry'
export type SortBy = 'expiry' | 'name' | 'quantity' | 'added'

export interface Filters {
  expiryStatus: ExpiryStatus[]
  categories: string[]
  colors: string[]
  lowQuantity: boolean
  sort: { by: SortBy; dir: 'asc' | 'desc' }
}

export const EMPTY_FILTERS: Filters = {
  expiryStatus: [],
  categories: [],
  colors: [],
  lowQuantity: false,
  sort: { by: 'expiry', dir: 'asc' },
}

export function activeFilterCount(f: Filters): number {
  return (
    f.expiryStatus.length +
    f.categories.length +
    f.colors.length +
    (f.lowQuantity ? 1 : 0)
  )
}

function getExpiryStatus(item: Item, notifyDays: number): ExpiryStatus {
  if (!item.dates.expiresAt) return 'noExpiry'
  const days = daysUntilExpiry(item.dates.expiresAt.toDate())
  if (days < 0) return 'expired'
  if (days <= notifyDays) return 'expiringSoon'
  return 'fresh'
}

export function applyFilters(items: Item[], f: Filters): Item[] {
  const { notifyDaysBeforeExpiry, lowQuantityThreshold } = mockUser.settings

  const filtered = items.filter((item) => {
    if (
      f.lowQuantity &&
      !isLowQuantity(
        item.quantity.current,
        item.quantity.initial,
        lowQuantityThreshold,
      )
    )
      return false
    if (
      f.categories.length > 0 &&
      !f.categories.some((c) => item.categories.includes(c))
    )
      return false
    if (f.colors.length > 0 && !f.colors.includes(item.colorTag ?? 'none'))
      return false
    if (f.expiryStatus.length > 0) {
      const status = getExpiryStatus(item, notifyDaysBeforeExpiry)
      if (!f.expiryStatus.includes(status)) return false
    }
    return true
  })

  const mul = f.sort.dir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    switch (f.sort.by) {
      case 'name':
        return mul * a.name.localeCompare(b.name)
      case 'quantity': {
        const pa =
          a.quantity.initial > 0 ? a.quantity.current / a.quantity.initial : 0
        const pb =
          b.quantity.initial > 0 ? b.quantity.current / b.quantity.initial : 0
        return mul * (pa - pb)
      }
      case 'added':
        return (
          mul *
          (a.dates.addedAt.toDate().getTime() -
            b.dates.addedAt.toDate().getTime())
        )
      case 'expiry':
      default: {
        // Items without expiry always go to the end regardless of direction
        if (!a.dates.expiresAt && !b.dates.expiresAt) return 0
        if (!a.dates.expiresAt) return 1
        if (!b.dates.expiresAt) return -1
        return (
          mul *
          (a.dates.expiresAt.toDate().getTime() -
            b.dates.expiresAt.toDate().getTime())
        )
      }
    }
  })
}

const EXPIRY_OPTIONS: { value: ExpiryStatus; label: string; color: string }[] =
  [
    {
      value: 'expired',
      label: 'Expired',
      color: 'bg-red-100 text-red-600 border-red-200',
    },
    {
      value: 'expiringSoon',
      label: 'Expiring soon',
      color: 'bg-orange-100 text-orange-600 border-orange-200',
    },
    {
      value: 'fresh',
      label: 'Fresh',
      color: 'bg-green-100 text-green-600 border-green-200',
    },
    {
      value: 'noExpiry',
      label: 'No expiry',
      color: 'bg-gray-100 text-gray-500 border-gray-200',
    },
  ]

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'expiry', label: 'Expiry' },
  { value: 'name', label: 'Name' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'added', label: 'Date added' },
]

interface FilterSheetProps {
  filters: Filters
  availableCategories: string[]
  availableColors: string[]
  onChange: (f: Filters) => void
  onClose: () => void
}

export default function FilterSheet({
  filters,
  availableCategories,
  availableColors,
  onChange,
  onClose,
}: FilterSheetProps) {
  function toggleExpiry(val: ExpiryStatus) {
    onChange({
      ...filters,
      expiryStatus: filters.expiryStatus.includes(val)
        ? filters.expiryStatus.filter((s) => s !== val)
        : [...filters.expiryStatus, val],
    })
  }

  function toggleCategory(cat: string) {
    onChange({
      ...filters,
      categories: filters.categories.includes(cat)
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    })
  }

  function toggleColor(color: string) {
    onChange({
      ...filters,
      colors: filters.colors.includes(color)
        ? filters.colors.filter((c) => c !== color)
        : [...filters.colors, color],
    })
  }

  function setSort(by: SortBy) {
    onChange({ ...filters, sort: { ...filters.sort, by } })
  }

  function toggleSortDir() {
    onChange({
      ...filters,
      sort: {
        ...filters.sort,
        dir: filters.sort.dir === 'asc' ? 'desc' : 'asc',
      },
    })
  }

  const count = activeFilterCount(filters)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:py-8"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 flex flex-col gap-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Filter & Sort</h2>
          <div className="flex items-center gap-3">
            {count > 0 && (
              <button
                onClick={() => onChange(EMPTY_FILTERS)}
                className="text-sm text-red-400 hover:text-red-600"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Sort */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by</h3>
            <button
              onClick={toggleSortDir}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              {filters.sort.dir === 'asc' ? (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  Asc
                </>
              ) : (
                <>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                  </svg>
                  Desc
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`text-sm rounded-full px-4 py-2 border font-medium transition-colors ${
                  filters.sort.by === opt.value
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-green-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        {/* Expiry status */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Expiry status</h3>
          <div className="flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((opt) => {
              const active = filters.expiryStatus.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleExpiry(opt.value)}
                  className={`text-sm rounded-full px-4 py-2 border font-medium transition-colors ${
                    active
                      ? opt.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Low quantity */}
        <section className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Low quantity only
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Items below {mockUser.settings.lowQuantityThreshold}% remaining
            </p>
          </div>
          <button
            onClick={() =>
              onChange({ ...filters, lowQuantity: !filters.lowQuantity })
            }
            className={`w-12 h-7 rounded-full transition-colors relative ${
              filters.lowQuantity ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                filters.lowQuantity ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </section>

        {/* Colors */}
        {availableColors.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Color tag</h3>
            <div className="flex flex-wrap gap-3">
              {availableColors.map((color) => {
                const active = filters.colors.includes(color)
                const isNone = color === 'none'
                return (
                  <button
                    key={color}
                    onClick={() => toggleColor(color)}
                    title={isNone ? 'No color' : color}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                      active ? 'scale-110' : ''
                    } ${isNone ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600' : ''}`}
                    style={
                      !isNone
                        ? {
                            backgroundColor: color,
                            outline: active ? `2px solid ${color}` : 'none',
                            outlineOffset: '2px',
                          }
                        : undefined
                    }
                  >
                    {isNone && (
                      <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">
                        ∅
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Categories */}
        {availableCategories.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Category</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const active = filters.categories.includes(cat)
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                      active
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Done */}
        <button
          onClick={onClose}
          className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm hover:bg-green-600 transition-colors mt-auto"
        >
          {count > 0
            ? `Show results (${count} filter${count > 1 ? 's' : ''} active)`
            : 'Done'}
        </button>
      </div>
    </div>
  )
}
