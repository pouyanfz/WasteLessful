import { useState } from "react";
import type { Item, QuantityUnit } from "../types";
import type { Group } from "../types";
import { makeTimestamp } from "../data/mockTimestamp";

const UNITS: QuantityUnit[] = ["kg", "g", "L", "mL", "bottle", "pack", "box", "can"];
const COLOR_OPTIONS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
const CATEGORY_OPTIONS = ["food", "drink", "dairy", "dry-goods", "condiment", "snack", "cleaning"];

interface AddItemModalProps {
  defaultGroupId: string;
  groups: Group[];
  userId: string;
  onAdd: (item: Item) => void;
  onClose: () => void;
  prefill?: { name: string; amount: number; unit: string };
}

export default function AddItemModal({ defaultGroupId, groups, userId, onAdd, onClose, prefill }: AddItemModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId);
  const [name, setName] = useState(prefill?.name ?? "");
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [colorTag, setColorTag] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const prefillUnit = prefill?.unit ?? "pack";
  const isKnownUnit = (UNITS as readonly string[]).includes(prefillUnit);
  const [quantity, setQuantity] = useState({
    current: prefill?.amount ?? 1,
    initial: prefill?.amount ?? 1,
    unit: (isKnownUnit ? prefillUnit : "pack") as QuantityUnit,
  });
  const [isCustomUnit, setIsCustomUnit] = useState(!isKnownUnit && !!prefill);
  const [customUnitInput, setCustomUnitInput] = useState("");
  const [confirmedCustomUnit, setConfirmedCustomUnit] = useState<string | null>(!isKnownUnit && prefill ? prefillUnit : null);
  const [expiresAt, setExpiresAt] = useState("");

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function addCustomCategory() {
    const val = customCategoryInput.trim().toLowerCase();
    if (val && !categories.includes(val)) {
      setCategories((prev) => [...prev, val]);
    }
    setCustomCategoryInput("");
  }

  function removeCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  function confirmCustomUnit() {
    const val = customUnitInput.trim();
    if (val) {
      setConfirmedCustomUnit(val);
      setQuantity((q) => ({ ...q, unit: val }));
      setCustomUnitInput("");
      setIsCustomUnit(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const now = makeTimestamp(new Date());
    const newItem: Item = {
      id: crypto.randomUUID(),
      groupId: selectedGroupId,
      name: name.trim(),
      categories,
      colorTag,
      photoURL: null,
      notes: notes.trim() || null,
      quantity,
      dates: {
        addedAt: now as never,
        purchasedAt: now as never,
        expiresAt: expiresAt ? makeTimestamp(new Date(expiresAt)) as never : null,
        lastUsedAt: null,
      },
      notification: { enabled: false, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now as never,
      isArchived: false,
      archivedAt: null,
    };

    onAdd(newItem);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Group */}
          {groups.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Add to</label>
              <div className="flex gap-2 flex-wrap">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`text-sm rounded-full px-4 py-2 border font-medium transition-colors ${
                      selectedGroupId === g.id
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-white text-gray-500 border-gray-200"
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
            <label className="text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milk"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              autoFocus
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={quantity.current}
                onChange={(e) =>
                  setQuantity((q) => ({ ...q, current: Number(e.target.value), initial: Number(e.target.value) }))
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <select
                value={isCustomUnit ? "__custom__" : quantity.unit}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsCustomUnit(true);
                  } else {
                    setIsCustomUnit(false);
                    setCustomUnitInput("");
                    if (e.target.value !== confirmedCustomUnit) setConfirmedCustomUnit(null);
                    setQuantity((q) => ({ ...q, unit: e.target.value as QuantityUnit }));
                  }
                }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                {confirmedCustomUnit && (
                  <option value={confirmedCustomUnit}>{confirmedCustomUnit}</option>
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmCustomUnit())}
                  placeholder="e.g. jar, tray…"
                  autoFocus
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
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
            <label className="text-sm font-medium text-gray-700">Expiry date</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                    categories.includes(cat)
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-green-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {/* Custom categories not in the preset list */}
              {categories.filter((c) => !CATEGORY_OPTIONS.includes(c)).map((cat) => (
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
            {/* Custom category input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => setCustomCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCategory())}
                placeholder="Add custom category…"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
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
            <label className="text-sm font-medium text-gray-700">Color tag</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTag(colorTag === c ? null : c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: colorTag === c ? "#111" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            Add Item
          </button>
        </form>
      </div>
    </div>
  );
}
