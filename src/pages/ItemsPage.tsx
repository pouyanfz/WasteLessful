import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Item, Group, ShoppingItem } from "../types";
import { useAppData } from "../context/AppDataContext";
import { makeTimestamp } from "../data/mockTimestamp";
import { nextGroupColor, groupBadgeBg } from "../data/groupColors";
import { mockUser } from "../data/mockUsers";
import { quantityPercentage } from "../utils/quantity";
import ItemCard from "../components/ItemCard";
import AddItemModal from "../components/AddItemModal";
import EditItemModal from "../components/EditItemModal";
import GroupTabs from "../components/GroupTabs";
import FilterSheet, { applyFilters, activeFilterCount, EMPTY_FILTERS } from "../components/FilterSheet";
import type { Filters } from "../components/FilterSheet";

const STORAGE_KEY = "activeGroupId";
const VIEW_MODE_KEY = "desktopViewMode";

function loadActiveGroupId(): string | null {
  const val = localStorage.getItem(STORAGE_KEY);
  if (!val || val === "null") return null;
  return val;
}

function saveActiveGroupId(id: string | null) {
  localStorage.setItem(STORAGE_KEY, id ?? "null");
}

function loadViewMode(): "columns" | "single" {
  return localStorage.getItem(VIEW_MODE_KEY) === "single" ? "single" : "columns";
}

interface GroupColumnProps {
  title: string;
  items: Item[];
  filterCount: number;
  onItemClick: (item: Item) => void;
  onAddClick: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

function GearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors shrink-0"
      title="Settings"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    </button>
  );
}

function AddGroupColumn({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");

  function confirm() {
    const name = input.trim();
    if (name) onAdd(name);
    setAdding(false);
    setInput("");
  }

  if (adding) {
    return (
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); confirm(); }
            if (e.key === "Escape") { setAdding(false); setInput(""); }
          }}
          placeholder="Group name"
          autoFocus
          className="border border-green-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-full"
        />
        <div className="flex gap-2">
          <button
            onClick={confirm}
            disabled={!input.trim()}
            className="flex-1 bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 disabled:opacity-40 transition-colors"
          >
            Create
          </button>
          <button
            onClick={() => { setAdding(false); setInput(""); }}
            className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-72 shrink-0 h-24 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors flex flex-col items-center justify-center gap-1 text-sm font-medium"
    >
      <span className="text-2xl leading-none">+</span>
      New group
    </button>
  );
}

function GroupColumn({ title, items, filterCount, onItemClick, onAddClick, onMoveLeft, onMoveRight }: GroupColumnProps) {
function GroupColumn({ title, items, filterCount, onItemClick, onAddClick, onMoveLeft, onMoveRight }: GroupColumnProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col group/col">
    <div className="w-72 shrink-0 flex flex-col group/col">
      {/* Column header */}
      <div className="flex items-center gap-1 mb-3 px-1">
        {/* Move left */}
        <button
          onClick={onMoveLeft}
          disabled={!onMoveLeft}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-0 opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0"
          title="Move left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h2 className="font-semibold text-gray-800 flex-1 truncate">{title}</h2>

        {/* Move right */}
        <button
          onClick={onMoveRight}
          disabled={!onMoveRight}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-0 opacity-0 group-hover/col:opacity-100 transition-opacity shrink-0"
          title="Move right"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          onClick={onAddClick}
          className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xl leading-none shadow-sm hover:bg-green-600 transition-colors shrink-0"
        >
          +
        </button>
      </div>
      {/* Items */}
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">
            {filterCount > 0 ? "No items match filters." : "No items yet."}
          </p>
        ) : (
          items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))
        )}
      </div>
    </div>
  );
}

function ArchivedItemCard({
  item,
  groupName,
  onRestore,
  onDelete,
}: {
  item: Item;
  groupName: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const archivedMs = item.archivedAt ? Date.now() - item.archivedAt.toDate().getTime() : null;
  const archivedDays = archivedMs !== null ? Math.floor(archivedMs / 86400000) : null;
  const archivedLabel =
    archivedDays === null ? "" :
    archivedDays === 0 ? "Archived today" :
    archivedDays === 1 ? "Archived yesterday" :
    `Archived ${archivedDays}d ago`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.colorTag && (
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorTag }} />
          )}
          <span className="font-medium text-gray-700 truncate">{item.name}</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{archivedLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="bg-gray-100 rounded-full px-2 py-0.5">{groupName}</span>
        <span>{item.quantity.current} {item.quantity.unit}</span>
      </div>
      {confirmDelete ? (
        <div className="flex gap-2">
          <button
            onClick={onDelete}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
          >
            Delete permanently
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onRestore}
            className="flex-1 py-2 rounded-lg border border-green-400 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors"
          >
            Restore
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-red-400 text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Auto-add prompt ──────────────────────────────────────────────────────────

function AutoAddPromptSheet({
  item,
  reason,
  groups,
  shoppingLists,
  onAdd,
  onDismiss,
}: {
  item: Item;
  reason: "empty" | "low";
  groups: Group[];
  shoppingLists: import("../types").ShoppingList[];
  onAdd: (destId: string) => void;
  onDismiss: () => void;
}) {
  const allDests = [
    ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
    ...shoppingLists.map((l) => ({ id: l.id, name: l.name, color: null as string | null })),
  ];
  const [destId, setDestId] = useState(allDests[0]?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onDismiss}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {reason === "empty" ? `You're out of ${item.name}` : `${item.name} is running low`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Add it to your shopping list?</p>
          </div>
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0">&times;</button>
        </div>

        {allDests.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {allDests.map((d) => (
              <button
                key={d.id}
                onClick={() => setDestId(d.id)}
                style={d.color && destId === d.id ? { backgroundColor: groupBadgeBg(d.color), color: d.color, borderColor: `${d.color}60` } : {}}
                className={`text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${
                  destId === d.id && !d.color ? "bg-green-500 text-white border-green-500" :
                  destId !== d.id ? "bg-white text-gray-500 border-gray-200 hover:border-green-400" : ""
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => { if (destId) onAdd(destId); }}
          disabled={!destId}
          className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          Add to shopping list
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── Sort label helper ────────────────────────────────────────────────────────

function sortLabel(by: string, dir: string): string {
  const labels: Record<string, [string, string]> = {
    expiry:   ["Expiry ↑",   "Expiry ↓"],
    name:     ["Name A→Z",   "Name Z→A"],
    quantity: ["Qty low→high", "Qty high→low"],
    added:    ["Added oldest", "Added newest"],
  };
  return (labels[by] ?? ["?", "?"])[dir === "asc" ? 0 : 1];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ArchivedItemCard({
  item,
  groupName,
  onRestore,
  onDelete,
}: {
  item: Item;
  groupName: string;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const archivedMs = item.archivedAt ? Date.now() - item.archivedAt.toDate().getTime() : null;
  const archivedDays = archivedMs !== null ? Math.floor(archivedMs / 86400000) : null;
  const archivedLabel =
    archivedDays === null ? "" :
    archivedDays === 0 ? "Archived today" :
    archivedDays === 1 ? "Archived yesterday" :
    `Archived ${archivedDays}d ago`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {item.colorTag && (
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.colorTag }} />
          )}
          <span className="font-medium text-gray-700 truncate">{item.name}</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{archivedLabel}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="bg-gray-100 rounded-full px-2 py-0.5">{groupName}</span>
        <span>{item.quantity.current} {item.quantity.unit}</span>
      </div>
      {confirmDelete ? (
        <div className="flex gap-2">
          <button
            onClick={onDelete}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
          >
            Delete permanently
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onRestore}
            className="flex-1 py-2 rounded-lg border border-green-400 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors"
          >
            Restore
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-red-400 text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Auto-add prompt ──────────────────────────────────────────────────────────

function AutoAddPromptSheet({
  item,
  reason,
  groups,
  shoppingLists,
  onAdd,
  onDismiss,
}: {
  item: Item;
  reason: "empty" | "low";
  groups: Group[];
  shoppingLists: import("../types").ShoppingList[];
  onAdd: (destId: string) => void;
  onDismiss: () => void;
}) {
  const allDests = [
    ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
    ...shoppingLists.map((l) => ({ id: l.id, name: l.name, color: null as string | null })),
  ];
  const [destId, setDestId] = useState(allDests[0]?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onDismiss}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {reason === "empty" ? `You're out of ${item.name}` : `${item.name} is running low`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Add it to your shopping list?</p>
          </div>
          <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0">&times;</button>
        </div>

        {allDests.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {allDests.map((d) => (
              <button
                key={d.id}
                onClick={() => setDestId(d.id)}
                style={d.color && destId === d.id ? { backgroundColor: groupBadgeBg(d.color), color: d.color, borderColor: `${d.color}60` } : {}}
                className={`text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${
                  destId === d.id && !d.color ? "bg-green-500 text-white border-green-500" :
                  destId !== d.id ? "bg-white text-gray-500 border-gray-200 hover:border-green-400" : ""
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => { if (destId) onAdd(destId); }}
          disabled={!destId}
          className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          Add to shopping list
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ─── Sort label helper ────────────────────────────────────────────────────────

function sortLabel(by: string, dir: string): string {
  const labels: Record<string, [string, string]> = {
    expiry:   ["Expiry ↑",   "Expiry ↓"],
    name:     ["Name A→Z",   "Name Z→A"],
    quantity: ["Qty low→high", "Qty high→low"],
    added:    ["Added oldest", "Added newest"],
  };
  return (labels[by] ?? ["?", "?"])[dir === "asc" ? 0 : 1];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setItems, groups, setGroups, shoppingItems, setShoppingItems, shoppingLists } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setItems, groups, setGroups, shoppingItems, setShoppingItems, shoppingLists } = useAppData();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(loadActiveGroupId);
  const [autoAddPrompt, setAutoAddPrompt] = useState<{ item: Item; reason: "empty" | "low" } | null>(null);
  const [autoAddPrompt, setAutoAddPrompt] = useState<{ item: Item; reason: "empty" | "low" } | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToGroupId, setAddToGroupId] = useState<string>(() => groups[0]?.id ?? "");
  const [addModalPrefill, setAddModalPrefill] = useState<{ name: string; amount: number; unit: string } | null>(null);
  const [addToGroupId, setAddToGroupId] = useState<string>(() => groups[0]?.id ?? "");
  const [addModalPrefill, setAddModalPrefill] = useState<{ name: string; amount: number; unit: string } | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [desktopView, setDesktopView] = useState<"columns" | "single">(loadViewMode);
  const [search, setSearch] = useState("");

  function toggleDesktopView() {
    setDesktopView((v) => {
      const next = v === "columns" ? "single" : "columns";
      localStorage.setItem(VIEW_MODE_KEY, next);
      return next;
    });
  }

  function handleAddGroup(name: string) {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      color: nextGroupColor(groups.map((g) => g.color)),
      color: nextGroupColor(groups.map((g) => g.color)),
      ownerId: "user-1",
      memberIds: ["user-1"],
      inviteCode: "",
      inviteCodeExpiresAt: null,
      updatedAt: makeTimestamp(new Date()) as never,
    };
    setGroups((prev) => [...prev, newGroup]);
    handleTabChange(newGroup.id);
  }

  function handleTabChange(groupId: string | null) {
    setActiveGroupId(groupId);
    saveActiveGroupId(groupId);
  }

  function handleAdd(item: Item) {
    setItems((prev) => [item, ...prev]);
  }

  function handleSave(updated: Item) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  function handleDelete(id: string) {
    const now = makeTimestamp(new Date()) as never;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: true, archivedAt: now } : i));
    setEditingItem(null);
  }

  function handleRestore(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: false, archivedAt: null } : i));
  }

  function handlePermanentDelete(id: string) {
    const now = makeTimestamp(new Date()) as never;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: true, archivedAt: now } : i));
    setEditingItem(null);
  }

  function handleRestore(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: false, archivedAt: null } : i));
  }

  function handlePermanentDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Open AddItemModal pre-filled when navigated from shopping list
  useEffect(() => {
    const state = location.state as { prefillItem?: { name: string; amount: number; unit: string; groupId: string | null } } | null;
    if (state?.prefillItem) {
      const { name, amount, unit, groupId } = state.prefillItem;
      setAddToGroupId(groupId ?? groups[0]?.id ?? "");
      setAddModalPrefill({ name, amount, unit });
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, []);

  function moveGroup(index: number, dir: -1 | 1) {
    setGroups((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleUpdateGroupColor(groupId: string, color: string) {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, color } : g));
  }

  function handleDeleteGroup(groupId: string, moveToGroupId: string | null) {
  // Open AddItemModal pre-filled when navigated from shopping list
  useEffect(() => {
    const state = location.state as { prefillItem?: { name: string; amount: number; unit: string; groupId: string | null } } | null;
    if (state?.prefillItem) {
      const { name, amount, unit, groupId } = state.prefillItem;
      setAddToGroupId(groupId ?? groups[0]?.id ?? "");
      setAddModalPrefill({ name, amount, unit });
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, []);

  function moveGroup(index: number, dir: -1 | 1) {
    setGroups((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleUpdateGroupColor(groupId: string, color: string) {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, color } : g));
  }

  function handleDeleteGroup(groupId: string, moveToGroupId: string | null) {
    setItems((prev) =>
      moveToGroupId
        ? prev.map((item) => item.groupId === groupId ? { ...item, groupId: moveToGroupId } : item)
        : prev.filter((item) => item.groupId !== groupId)
    );
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) handleTabChange(null);
  }

  function handleAdjust(id: string, delta: number) {
    const current = items.find((i) => i.id === id);
    if (!current) return;

    const next = Math.max(0, current.quantity.current + delta);
    const newInitial = next > current.quantity.initial ? next : current.quantity.initial;
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, quantity: { ...i.quantity, current: next, initial: newInitial } } : i
    ));

    // Only check when reducing and item is not already on the shopping list
    if (delta < 0) {
      const alreadyOnList = shoppingItems.some((s) => s.linkedItemId === id && s.status === "toBuy");
      if (!alreadyOnList) {
        if (next === 0) {
          setAutoAddPrompt({ item: current, reason: "empty" });
        } else if (mockUser.settings.autoAddToShoppingListOnLowQuantity) {
          const prevPct = quantityPercentage(current.quantity.current, current.quantity.initial);
          const newPct = quantityPercentage(next, newInitial);
          if (prevPct > mockUser.settings.lowQuantityThreshold && newPct <= mockUser.settings.lowQuantityThreshold) {
            setAutoAddPrompt({ item: current, reason: "low" });
          }
        }
      }
    }
  }

  function handleAutoAdd(destId: string) {
    if (!autoAddPrompt) return;
    const { item } = autoAddPrompt;
    const now = makeTimestamp(new Date()) as never;
    const isGroup = groups.some((g) => g.id === destId);
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: isGroup ? destId : null,
      shoppingListId: isGroup ? null : destId,
      name: item.name,
      quantity: { amount: Math.max(item.quantity.current, 1), unit: item.quantity.unit },
      linkedRecipeId: null,
      linkedItemId: item.id,
      linkedItemName: item.name,
      status: "toBuy",
      autoAdded: true,
      addedToInventory: false,
      addedBy: "user-1",
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    };
    setShoppingItems((prev) => [...prev, newShoppingItem]);
    setAutoAddPrompt(null);
      moveToGroupId
        ? prev.map((item) => item.groupId === groupId ? { ...item, groupId: moveToGroupId } : item)
        : prev.filter((item) => item.groupId !== groupId)
    );
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeGroupId === groupId) handleTabChange(null);
  }

  function handleAdjust(id: string, delta: number) {
    const current = items.find((i) => i.id === id);
    if (!current) return;

    const next = Math.max(0, current.quantity.current + delta);
    const newInitial = next > current.quantity.initial ? next : current.quantity.initial;
    setItems((prev) => prev.map((i) =>
      i.id === id ? { ...i, quantity: { ...i.quantity, current: next, initial: newInitial } } : i
    ));

    // Only check when reducing and item is not already on the shopping list
    if (delta < 0) {
      const alreadyOnList = shoppingItems.some((s) => s.linkedItemId === id && s.status === "toBuy");
      if (!alreadyOnList) {
        if (next === 0) {
          setAutoAddPrompt({ item: current, reason: "empty" });
        } else if (mockUser.settings.autoAddToShoppingListOnLowQuantity) {
          const prevPct = quantityPercentage(current.quantity.current, current.quantity.initial);
          const newPct = quantityPercentage(next, newInitial);
          if (prevPct > mockUser.settings.lowQuantityThreshold && newPct <= mockUser.settings.lowQuantityThreshold) {
            setAutoAddPrompt({ item: current, reason: "low" });
          }
        }
      }
    }
  }

  function handleAutoAdd(destId: string) {
    if (!autoAddPrompt) return;
    const { item } = autoAddPrompt;
    const now = makeTimestamp(new Date()) as never;
    const isGroup = groups.some((g) => g.id === destId);
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: isGroup ? destId : null,
      shoppingListId: isGroup ? null : destId,
      name: item.name,
      quantity: { amount: Math.max(item.quantity.current, 1), unit: item.quantity.unit },
      linkedRecipeId: null,
      linkedItemId: item.id,
      linkedItemName: item.name,
      status: "toBuy",
      autoAdded: true,
      addedToInventory: false,
      addedBy: "user-1",
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    };
    setShoppingItems((prev) => [...prev, newShoppingItem]);
    setAutoAddPrompt(null);
  }

  function openAddModal(groupId: string) {
    setAddToGroupId(groupId);
    setShowAddModal(true);
  }

  const isArchiveView = activeGroupId === "archived";

  // --- Archived items (sorted by most recently archived) ---
  const archivedItems = useMemo(() =>
    items
      .filter((i) => i.isArchived)
      .sort((a, b) => (b.archivedAt?.toDate().getTime() ?? 0) - (a.archivedAt?.toDate().getTime() ?? 0)),
    [items]
  );

  const isArchiveView = activeGroupId === "archived";

  // --- Archived items (sorted by most recently archived) ---
  const archivedItems = useMemo(() =>
    items
      .filter((i) => i.isArchived)
      .sort((a, b) => (b.archivedAt?.toDate().getTime() ?? 0) - (a.archivedAt?.toDate().getTime() ?? 0)),
    [items]
  );

  // --- Mobile: single tab view ---
  const tabItems = useMemo(() => {
    if (isArchiveView) return [];
    const base = activeGroupId ? items.filter((i) => i.groupId === activeGroupId) : items;
    return base.filter((i) => !i.isArchived);
  }, [items, activeGroupId, isArchiveView]);
  const tabItems = useMemo(() => {
    if (isArchiveView) return [];
    const base = activeGroupId ? items.filter((i) => i.groupId === activeGroupId) : items;
    return base.filter((i) => !i.isArchived);
  }, [items, activeGroupId, isArchiveView]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    tabItems.forEach((i) => i.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [tabItems]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    tabItems.forEach((i) => colors.add(i.colorTag ?? "none"));
    return Array.from(colors);
  }, [tabItems]);

  const visibleItems = useMemo(() => {
    const filtered = applyFilters(tabItems, filters);
    if (!search.trim()) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((i) => i.name.toLowerCase().includes(q));
  }, [tabItems, filters, search]);
  const filterCount = activeFilterCount(filters);

  // --- Desktop: per-group filtered items (excludes archived) ---
  // --- Desktop: per-group filtered items (excludes archived) ---
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    items.filter((i) => !i.isArchived).forEach((i) => i.categories.forEach((c) => cats.add(c)));
    items.filter((i) => !i.isArchived).forEach((i) => i.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [items]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    items.filter((i) => !i.isArchived).forEach((i) => colors.add(i.colorTag ?? "none"));
    items.filter((i) => !i.isArchived).forEach((i) => colors.add(i.colorTag ?? "none"));
    return Array.from(colors);
  }, [items]);

  const itemsByGroup = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.map((g) => ({
      group: g,
      items: applyFilters(
        items.filter((i) => i.groupId === g.id && !i.isArchived && (!q || i.name.toLowerCase().includes(q))),
        filters
      ),
    }));
  }, [groups, items, filters, search]);

  const searchBar = (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items…"
        className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 placeholder:text-gray-400"
      />
      {search && (
        <button
          onClick={() => setSearch("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">My Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">My Items</h1>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          {!isArchiveView && (
            <>
              <button
                onClick={() => setShowFilterSheet(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-400 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => openAddModal(activeGroupId ?? groups[0]?.id)}
                className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
              >
                +
              </button>
            </>
          )}
          <GearButton onClick={() => navigate("/settings")} />
        <div className="flex items-center gap-2 lg:hidden">
          {!isArchiveView && (
            <>
              <button
                onClick={() => setShowFilterSheet(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:border-green-400 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => openAddModal(activeGroupId ?? groups[0]?.id)}
                className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
              >
                +
              </button>
            </>
          )}
          <GearButton onClick={() => navigate("/settings")} />
        </div>

        {/* Desktop controls */}
        <div className="hidden lg:flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
            <button
              onClick={() => { setDesktopView("single"); localStorage.setItem(VIEW_MODE_KEY, "single"); }}
              title="Single column"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${desktopView === "single" ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="3" width="14" height="18" rx="2" />
              </svg>
            </button>
            <button
              onClick={() => { setDesktopView("columns"); localStorage.setItem(VIEW_MODE_KEY, "columns"); }}
              title="Columns"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${desktopView === "columns" ? "bg-white shadow text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="18" rx="1" />
              </svg>
            </button>
          </div>

          {/* Add — only shown in single view (columns have their own + per column), hidden in archive */}
          {desktopView === "single" && !isArchiveView && (
          {/* Add — only shown in single view (columns have their own + per column), hidden in archive */}
          {desktopView === "single" && !isArchiveView && (
            <button
              onClick={() => openAddModal(activeGroupId ?? groups[0]?.id)}
              onClick={() => openAddModal(activeGroupId ?? groups[0]?.id)}
              className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
            >
              +
            </button>
          )}

          {/* Filter — hidden in archive view */}
          {!isArchiveView && (
            <button
              onClick={() => setShowFilterSheet(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-400 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filter & Sort
              {filterCount > 0 && (
                <span className="w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          )}
          <GearButton onClick={() => navigate("/settings")} />
          {/* Filter — hidden in archive view */}
          {!isArchiveView && (
            <button
              onClick={() => setShowFilterSheet(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-400 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              Filter & Sort
              {filterCount > 0 && (
                <span className="w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </button>
          )}
          <GearButton onClick={() => navigate("/settings")} />
        </div>
      </header>

      {/* Mobile: tabs + single column */}
      <div className="lg:hidden">
        <GroupTabs
          groups={groups}
          activeGroupId={activeGroupId}
          onChange={handleTabChange}
          onAddGroup={handleAddGroup}
          onReorder={setGroups}
          onDeleteGroup={handleDeleteGroup}
          onUpdateGroupColor={handleUpdateGroupColor}
          archivedCount={archivedItems.length}
        />
        {!isArchiveView && (
          <div className="px-4 pt-3 max-w-lg mx-auto">{searchBar}</div>
        )}
        {/* Sort indicator */}
        {!isArchiveView && !(filters.sort.by === "expiry" && filters.sort.dir === "asc") && (
          <div className="px-4 pt-2 max-w-lg mx-auto flex">
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1.5 font-medium">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              {sortLabel(filters.sort.by, filters.sort.dir)}
              <button onClick={() => setFilters((f) => ({ ...f, sort: EMPTY_FILTERS.sort }))} className="ml-0.5 text-gray-400 hover:text-gray-600">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </span>
          </div>
        )}
        <main className="px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto pb-24">
          {isArchiveView ? (
            archivedItems.length === 0 ? (
              <p className="text-center text-gray-400 mt-12">Archive is empty.</p>
            ) : (
              archivedItems.map((item) => (
                <ArchivedItemCard
                  key={item.id}
                  item={item}
                  groupName={groups.find((g) => g.id === item.groupId)?.name ?? "Unknown group"}
                  onRestore={() => handleRestore(item.id)}
                  onDelete={() => handlePermanentDelete(item.id)}
                />
              ))
            )
          ) : visibleItems.length === 0 ? (
          {isArchiveView ? (
            archivedItems.length === 0 ? (
              <p className="text-center text-gray-400 mt-12">Archive is empty.</p>
            ) : (
              archivedItems.map((item) => (
                <ArchivedItemCard
                  key={item.id}
                  item={item}
                  groupName={groups.find((g) => g.id === item.groupId)?.name ?? "Unknown group"}
                  onRestore={() => handleRestore(item.id)}
                  onDelete={() => handlePermanentDelete(item.id)}
                />
              ))
            )
          ) : visibleItems.length === 0 ? (
            <p className="text-center text-gray-400 mt-12">
              {filterCount > 0 ? "No items match your filters." : "No items yet. Add one!"}
            </p>
          ) : (
            visibleItems.map((item) => (
              <ItemCard key={item.id} item={item} group={groups.find((g) => g.id === item.groupId)} showGroupBadge={activeGroupId === null} onClick={() => setEditingItem(item)} onAdjust={(d) => handleAdjust(item.id, d)} />
              <ItemCard key={item.id} item={item} group={groups.find((g) => g.id === item.groupId)} showGroupBadge={activeGroupId === null} onClick={() => setEditingItem(item)} onAdjust={(d) => handleAdjust(item.id, d)} />
            ))
          )}
        </main>
      </div>

      {/* Desktop: columns view */}
      {desktopView === "columns" && (
        <div className="hidden lg:block">
          <div className="px-6 pt-4 max-w-sm">{searchBar}</div>
        </div>
      )}
      {desktopView === "columns" && (
        <div className="hidden lg:flex overflow-x-auto gap-6 px-6 py-4 pb-24 items-start min-h-[calc(100vh-8rem)]">
          {itemsByGroup.map(({ group, items: groupItems }, i) => (
            <GroupColumn
              key={group.id}
              title={group.name}
              items={groupItems}
              filterCount={filterCount}
              onItemClick={setEditingItem}
              onAddClick={() => openAddModal(group.id)}
              onMoveLeft={i > 0 ? () => moveGroup(i, -1) : undefined}
              onMoveRight={i < groups.length - 1 ? () => moveGroup(i, 1) : undefined}
              onMoveLeft={i > 0 ? () => moveGroup(i, -1) : undefined}
              onMoveRight={i < groups.length - 1 ? () => moveGroup(i, 1) : undefined}
            />
          ))}
          <AddGroupColumn onAdd={handleAddGroup} />
        </div>
      )}

      {/* Desktop: single column view */}
      {desktopView === "single" && (
        <div className="hidden lg:block">
          <GroupTabs
            groups={groups}
            activeGroupId={activeGroupId}
            onChange={handleTabChange}
            onAddGroup={handleAddGroup}
            onReorder={setGroups}
            onDeleteGroup={handleDeleteGroup}
            onUpdateGroupColor={handleUpdateGroupColor}
            archivedCount={archivedItems.length}
          />
          {!isArchiveView && (
            <div className="px-6 pt-4 max-w-xl mx-auto">{searchBar}</div>
          )}
          {/* Sort indicator */}
          {!isArchiveView && !(filters.sort.by === "expiry" && filters.sort.dir === "asc") && (
            <div className="px-6 pt-2 max-w-xl mx-auto flex">
              <span className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1.5 font-medium">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                {sortLabel(filters.sort.by, filters.sort.dir)}
                <button onClick={() => setFilters((f) => ({ ...f, sort: EMPTY_FILTERS.sort }))} className="ml-0.5 text-gray-400 hover:text-gray-600">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </span>
            </div>
          )}
          <main className="px-6 py-6 flex flex-col gap-3 max-w-xl mx-auto pb-24">
            {isArchiveView ? (
              archivedItems.length === 0 ? (
                <p className="text-center text-gray-400 mt-12">Archive is empty.</p>
              ) : (
                archivedItems.map((item) => (
                  <ArchivedItemCard
                    key={item.id}
                    item={item}
                    groupName={groups.find((g) => g.id === item.groupId)?.name ?? "Unknown group"}
                    onRestore={() => handleRestore(item.id)}
                    onDelete={() => handlePermanentDelete(item.id)}
                  />
                ))
              )
            ) : visibleItems.length === 0 ? (
              <p className="text-center text-gray-400 mt-12">
                {filterCount > 0 ? "No items match your filters." : "No items yet. Add one!"}
              </p>
            ) : (
              visibleItems.map((item) => (
                <ItemCard key={item.id} item={item} group={groups.find((g) => g.id === item.groupId)} showGroupBadge={activeGroupId === null} onClick={() => setEditingItem(item)} onAdjust={(d) => handleAdjust(item.id, d)} />
                <ItemCard key={item.id} item={item} group={groups.find((g) => g.id === item.groupId)} showGroupBadge={activeGroupId === null} onClick={() => setEditingItem(item)} onAdjust={(d) => handleAdjust(item.id, d)} />
              ))
            )}
          </main>
        </div>
      )}

      {showAddModal && (
        <AddItemModal
          defaultGroupId={addToGroupId}
          groups={groups}
          userId="user-1"
          onAdd={handleAdd}
          onClose={() => { setShowAddModal(false); setAddModalPrefill(null); }}
          prefill={addModalPrefill ?? undefined}
          onClose={() => { setShowAddModal(false); setAddModalPrefill(null); }}
          prefill={addModalPrefill ?? undefined}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          groups={groups}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingItem(null)}
        />
      )}

      {showFilterSheet && (
        <FilterSheet
          filters={filters}
          availableCategories={desktopView === "columns" ? allCategories : availableCategories}
          availableColors={desktopView === "columns" ? allColors : availableColors}
          onChange={setFilters}
          onClose={() => setShowFilterSheet(false)}
        />
      )}

      {autoAddPrompt && (
        <AutoAddPromptSheet
          item={autoAddPrompt.item}
          reason={autoAddPrompt.reason}
          groups={groups}
          shoppingLists={shoppingLists}
          onAdd={handleAutoAdd}
          onDismiss={() => setAutoAddPrompt(null)}
        />
      )}
    </div>
  );
}
