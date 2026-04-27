import type { Item, Group } from '../types'
import { daysUntilExpiry, daysSinceAdded } from '../utils/expiry'
import { quantityPercentage } from '../utils/quantity'
import { groupBadgeBg, groupBadgeColor } from '../data/groupColors'

interface ItemCardProps {
  item: Item
  group?: Pick<Group, 'name' | 'color'>
  showGroupBadge?: boolean
  onClick?: () => void
  onAdjust?: (delta: number) => void
}

function getExpiryLabel(item: Item): { label: string; color: string } {
  if (!item.dates.expiresAt) {
    const days = daysSinceAdded(item.dates.addedAt.toDate())
    return { label: `Added ${days}d ago`, color: 'text-gray-400' }
  }

  const days = daysUntilExpiry(item.dates.expiresAt.toDate())
  if (days < 0)
    return { label: `Expired ${Math.abs(days)}d ago`, color: 'text-red-500' }
  if (days === 0) return { label: 'Expires today', color: 'text-orange-400' }
  if (days <= 3)
    return { label: `Expires in ${days}d`, color: 'text-orange-400' }
  return { label: `Expires in ${days}d`, color: 'text-green-500' }
}

export default function ItemCard({
  item,
  group,
  showGroupBadge = false,
  onClick,
  onAdjust,
}: ItemCardProps) {
  const pct = quantityPercentage(item.quantity.current, item.quantity.initial)
  const { label, color } = getExpiryLabel(item)

  const barColor =
    pct <= 25 ? 'bg-red-500' : pct <= 50 ? 'bg-orange-400' : 'bg-green-500'

  return (
    <div
      className="rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 cursor-pointer active:scale-[0.98] transition-transform"
      style={{ backgroundColor: group?.color ? `${group.color}12` : '#ffffff' }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {item.colorTag && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.colorTag }}
            />
          )}
          <span className="font-medium text-gray-900 truncate">
            {item.name}
          </span>
        </div>
        <span className={`text-xs ${color} shrink-0`}>{label}</span>
      </div>

      {/* Quantity bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            {item.quantity.current} / {item.quantity.initial}{' '}
            {item.quantity.unit}
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Quantity adjust */}
      {onAdjust && (
        <div
          className="flex items-center gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onAdjust(-1)}
            disabled={item.quantity.current <= 0}
            className="w-10 h-10 rounded-full border-2 border-gray-300 text-gray-600 flex items-center justify-center text-xl font-bold leading-none hover:border-red-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-700 flex-1 text-center">
            {item.quantity.current} {item.quantity.unit}
          </span>
          <button
            onClick={() => onAdjust(1)}
            disabled={item.quantity.current >= item.quantity.initial}
            className="w-10 h-10 rounded-full border-2 border-gray-300 text-gray-600 flex items-center justify-center text-xl font-bold leading-none hover:border-green-500 hover:text-green-600 hover:bg-green-50 disabled:opacity-30 transition-colors"
          >
            +
          </button>
        </div>
      )}

      {/* Tags: group badge first, then categories */}
      {(group && showGroupBadge || item.categories.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {group && showGroupBadge && (
            <span
              style={{
                backgroundColor: groupBadgeBg(group.color),
                color: groupBadgeColor(group.color),
              }}
              className="text-xs rounded-full px-2 py-0.5 font-medium"
            >
              {group.name}
            </span>
          )}
          {item.categories.map((cat) => (
            <span
              key={cat}
              className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
