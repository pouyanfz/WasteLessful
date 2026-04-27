export const ITEM_UNITS = ['pieces', 'pack', 'box', 'can', '%', 'slice'] as const
export type ItemUnit = (typeof ITEM_UNITS)[number] | string

/** Step size for +/- adjust per unit. Defaults to 1 for unlisted units. */
export const UNIT_STEP: Record<string, number> = {
  '%': 10,
}

export const ITEM_COLOR_TAGS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
] as const

export const ITEM_CATEGORIES = [
  'food',
  'drink',
  'dairy',
  'dry-goods',
  'condiment',
  'snack',
  'cleaning',
] as const
