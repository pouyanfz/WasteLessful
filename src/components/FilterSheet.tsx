import type { Item } from "../types";
import { daysUntilExpiry } from "../utils/expiry";
import { isLowQuantity } from "../utils/quantity";
import { mockUser } from "../data/mockUsers";

export type ExpiryStatus = "expired" | "expiringSoon" | "fresh" | "noExpiry";

export interface Filters {
  expiryStatus: ExpiryStatus[];
  categories: string[];
  lowQuantity: boolean;
}

export const EMPTY_FILTERS: Filters = { expiryStatus: [], categories: [], lowQuantity: false };

export function activeFilterCount(f: Filters): number {
  return f.expiryStatus.length + f.categories.length + (f.lowQuantity ? 1 : 0);
}

export function applyFilters(items: Item[], f: Filters): Item[] {
  const { notifyDaysBeforeExpiry, lowQuantityThreshold } = mockUser.settings;
  return items.filter((item) => {
    if (f.lowQuantity && !isLowQuantity(item.quantity.current, item.quantity.initial, lowQuantityThreshold)) return false;

    if (f.categories.length > 0 && !f.categories.some((c) => item.categories.includes(c))) return false;

    if (f.expiryStatus.length > 0) {
      const status = getExpiryStatus(item, notifyDaysBeforeExpiry);
      if (!f.expiryStatus.includes(status)) return false;
    }

    return true;
  });
}

function getExpiryStatus(item: Item, notifyDays: number): ExpiryStatus {
  if (!item.dates.expiresAt) return "noExpiry";
  const days = daysUntilExpiry(item.dates.expiresAt.toDate());
  if (days < 0) return "expired";
  if (days <= notifyDays) return "expiringSoon";
  return "fresh";
}

const EXPIRY_OPTIONS: { value: ExpiryStatus; label: string; color: string }[] = [
  { value: "expired", label: "Expired", color: "bg-red-100 text-red-600 border-red-200" },
  { value: "expiringSoon", label: "Expiring soon", color: "bg-orange-100 text-orange-600 border-orange-200" },
  { value: "fresh", label: "Fresh", color: "bg-green-100 text-green-600 border-green-200" },
  { value: "noExpiry", label: "No expiry", color: "bg-gray-100 text-gray-500 border-gray-200" },
];

interface FilterSheetProps {
  filters: Filters;
  availableCategories: string[];
  onChange: (f: Filters) => void;
  onClose: () => void;
}

export default function FilterSheet({ filters, availableCategories, onChange, onClose }: FilterSheetProps) {
  function toggleExpiry(val: ExpiryStatus) {
    onChange({
      ...filters,
      expiryStatus: filters.expiryStatus.includes(val)
        ? filters.expiryStatus.filter((s) => s !== val)
        : [...filters.expiryStatus, val],
    });
  }

  function toggleCategory(cat: string) {
    onChange({
      ...filters,
      categories: filters.categories.includes(cat)
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    });
  }

  const count = activeFilterCount(filters);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:py-8"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
          <div className="flex items-center gap-3">
            {count > 0 && (
              <button
                onClick={() => onChange(EMPTY_FILTERS)}
                className="text-sm text-red-400 hover:text-red-600"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        {/* Expiry status */}
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-gray-700">Expiry status</h3>
          <div className="flex flex-wrap gap-2">
            {EXPIRY_OPTIONS.map((opt) => {
              const active = filters.expiryStatus.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleExpiry(opt.value)}
                  className={`text-sm rounded-full px-4 py-2 border font-medium transition-colors ${
                    active ? opt.color + " ring-2 ring-offset-1 ring-current" : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Low quantity */}
        <section className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Low quantity only</p>
            <p className="text-xs text-gray-400">Items below {mockUser.settings.lowQuantityThreshold}% remaining</p>
          </div>
          <button
            onClick={() => onChange({ ...filters, lowQuantity: !filters.lowQuantity })}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              filters.lowQuantity ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                filters.lowQuantity ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </section>

        {/* Categories */}
        {availableCategories.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-gray-700">Category</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const active = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                      active
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Done button */}
        <button
          onClick={onClose}
          className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm hover:bg-green-600 transition-colors mt-auto"
        >
          {count > 0 ? `Show results (${count} filter${count > 1 ? "s" : ""} active)` : "Done"}
        </button>
      </div>
    </div>
  );
}
