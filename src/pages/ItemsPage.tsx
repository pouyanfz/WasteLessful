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

function loadActiveGroupId(): string | null {
  const val = localStorage.getItem(STORAGE_KEY);
  if (!val || val === "null") return null;
  return val;
}

function saveActiveGroupId(id: string | null) {
  localStorage.setItem(STORAGE_KEY, id ?? "null");
}

export default function ItemsPage() {
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [items, setItems] = useState<Item[]>(mockItems.filter((i) => !i.isArchived));
  const [activeGroupId, setActiveGroupId] = useState<string | null>(loadActiveGroupId);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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

  // Items for the active tab
  const tabItems = useMemo(() =>
    activeGroupId ? items.filter((i) => i.groupId === activeGroupId) : items,
    [items, activeGroupId]
  );

  // All unique categories in the current tab (for filter options)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    tabItems.forEach((i) => i.categories.forEach((c) => cats.add(c)));
    return Array.from(cats).sort();
  }, [tabItems]);

  const visibleItems = useMemo(() => applyFilters(tabItems, filters), [tabItems, filters]);

  const filterCount = activeFilterCount(filters);

  // Default groupId when adding: active tab group, or first group if on "All"
  const defaultAddGroupId = activeGroupId ?? groups[0].id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900">My Items</h1>
        <div className="flex items-center gap-3">
          {/* Filter button */}
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

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow"
          >
            +
          </button>
        </div>
      </header>

      {/* Group tabs */}
      <GroupTabs groups={groups} activeGroupId={activeGroupId} onChange={handleTabChange} onAddGroup={handleAddGroup} />

      {/* Item list */}
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

      {showAddModal && (
        <AddItemModal
          defaultGroupId={defaultAddGroupId}
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
          availableCategories={availableCategories}
          onChange={setFilters}
          onClose={() => setShowFilterSheet(false)}
        />
      )}
    </div>
  );
}
