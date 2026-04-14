import { useMemo, useState } from "react";
import { mockItems } from "../data/mockItems";
import { mockGroups } from "../data/mockGroups";
import type { Item } from "../types";
import type { Group } from "../types";
import { makeTimestamp } from "../data/mockTimestamp";
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

function GroupColumn({ title, items, filterCount, onItemClick, onAddClick }: GroupColumnProps) {
  return (
    <div className="w-72 shrink-0 flex flex-col">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onAddClick}
          className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xl leading-none shadow-sm hover:bg-green-600 transition-colors"
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

export default function ItemsPage() {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [items, setItems] = useState<Item[]>(mockItems.filter((i) => !i.isArchived));
  const [activeGroupId, setActiveGroupId] = useState<string | null>(loadActiveGroupId);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addToGroupId, setAddToGroupId] = useState<string>(mockGroups[0].id);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [desktopView, setDesktopView] = useState<"columns" | "single">(loadViewMode);

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
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function openAddModal(groupId: string) {
    setAddToGroupId(groupId);
    setShowAddModal(true);
  }

  // --- Mobile: single tab view ---
  const tabItems = useMemo(() =>
    activeGroupId ? items.filter((i) => i.groupId === activeGroupId) : items,
    [items, activeGroupId]
  );

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

  const visibleItems = useMemo(() => applyFilters(tabItems, filters), [tabItems, filters]);
  const filterCount = activeFilterCount(filters);

  // --- Desktop: per-group filtered items ---
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((i) => i.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [items]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    items.forEach((i) => colors.add(i.colorTag ?? "none"));
    return Array.from(colors);
  }, [items]);

  const itemsByGroup = useMemo(() =>
    groups.map((g) => ({
      group: g,
      items: applyFilters(items.filter((i) => i.groupId === g.id), filters),
    })),
    [groups, items, filters]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900">My Items</h1>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 lg:hidden">
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
            onClick={() => openAddModal(activeGroupId ?? groups[0].id)}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
          >
            +
          </button>
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

          {/* Add — only shown in single view (columns have their own + per column) */}
          {desktopView === "single" && (
            <button
              onClick={() => openAddModal(activeGroupId ?? groups[0].id)}
              className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
            >
              +
            </button>
          )}

          {/* Filter */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-green-400 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filter
            {filterCount > 0 && (
              <span className="w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile: tabs + single column */}
      <div className="lg:hidden">
        <GroupTabs groups={groups} activeGroupId={activeGroupId} onChange={handleTabChange} onAddGroup={handleAddGroup} />
        <main className="px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto pb-24">
          {visibleItems.length === 0 ? (
            <p className="text-center text-gray-400 mt-12">
              {filterCount > 0 ? "No items match your filters." : "No items yet. Add one!"}
            </p>
          ) : (
            visibleItems.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => setEditingItem(item)} />
            ))
          )}
        </main>
      </div>

      {/* Desktop: columns view */}
      {desktopView === "columns" && (
        <div className="hidden lg:flex overflow-x-auto gap-6 px-6 py-6 pb-12 items-start min-h-[calc(100vh-8rem)]">
          {itemsByGroup.map(({ group, items: groupItems }) => (
            <GroupColumn
              key={group.id}
              title={group.name}
              items={groupItems}
              filterCount={filterCount}
              onItemClick={setEditingItem}
              onAddClick={() => openAddModal(group.id)}
            />
          ))}
          <AddGroupColumn onAdd={handleAddGroup} />
        </div>
      )}

      {/* Desktop: single column view */}
      {desktopView === "single" && (
        <div className="hidden lg:block">
          <GroupTabs groups={groups} activeGroupId={activeGroupId} onChange={handleTabChange} onAddGroup={handleAddGroup} />
          <main className="px-6 py-6 flex flex-col gap-3 max-w-xl mx-auto pb-12">
            {visibleItems.length === 0 ? (
              <p className="text-center text-gray-400 mt-12">
                {filterCount > 0 ? "No items match your filters." : "No items yet. Add one!"}
              </p>
            ) : (
              visibleItems.map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => setEditingItem(item)} />
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
          onClose={() => setShowAddModal(false)}
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
    </div>
  );
}
