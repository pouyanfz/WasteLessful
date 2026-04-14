import { useState } from "react";
import { mockShoppingItems } from "../data/mockShoppingItems";
import { mockGroups } from "../data/mockGroups";
import { makeTimestamp } from "../data/mockTimestamp";
import type { ShoppingItem } from "../types";

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>(mockShoppingItems);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(1);
  const [newUnit, setNewUnit] = useState("pack");
  const [activeGroupId] = useState(mockGroups[0].id);

  const toBuy = items.filter((i) => i.status === "toBuy");
  const bought = items.filter((i) => i.status === "bought");

  function toggleStatus(id: string) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const now = makeTimestamp(new Date()) as never;
        return i.status === "toBuy"
          ? { ...i, status: "bought" as const, boughtBy: "user-1", boughtAt: now, updatedAt: now }
          : { ...i, status: "toBuy" as const, boughtBy: null, boughtAt: null, updatedAt: now };
      })
    );
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearBought() {
    setItems((prev) => prev.filter((i) => i.status !== "bought"));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const now = makeTimestamp(new Date()) as never;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: activeGroupId,
      name: newName.trim(),
      quantity: { amount: newAmount, unit: newUnit },
      linkedRecipeId: null,
      linkedItemId: null,
      linkedItemName: null,
      status: "toBuy",
      autoAdded: false,
      addedBy: "user-1",
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    };
    setItems((prev) => [newItem, ...prev]);
    setNewName("");
    setNewAmount(1);
    setNewUnit("pack");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900">Shopping List</h1>
      </header>

      {/* Add item form */}
      <form onSubmit={handleAdd} className="bg-white border-b border-gray-100 px-4 py-3 flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add item…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          type="number"
          min={1}
          value={newAmount}
          onChange={(e) => setNewAmount(Number(e.target.value))}
          className="w-14 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <input
          type="text"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          className="w-16 border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="w-10 h-10 rounded-full bg-green-500 text-white text-xl flex items-center justify-center shadow disabled:opacity-40"
        >
          +
        </button>
      </form>

      <main className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-6">
        {/* To buy */}
        {toBuy.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-1">
              To buy · {toBuy.length}
            </h2>
            {toBuy.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={toggleStatus} onDelete={deleteItem} />
            ))}
          </section>
        )}

        {/* Bought */}
        {bought.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Bought · {bought.length}
              </h2>
              <button onClick={clearBought} className="text-xs text-red-400 hover:text-red-600">
                Clear
              </button>
            </div>
            {bought.map((item) => (
              <ShoppingRow key={item.id} item={item} onToggle={toggleStatus} onDelete={deleteItem} />
            ))}
          </section>
        )}

        {items.length === 0 && (
          <p className="text-center text-gray-400 mt-12">Nothing on the list.</p>
        )}
      </main>
    </div>
  );
}

interface ShoppingRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function ShoppingRow({ item, onToggle, onDelete }: ShoppingRowProps) {
  const bought = item.status === "bought";
  return (
    <div className={`bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100 ${bought ? "opacity-60" : ""}`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          bought ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
        }`}
      >
        {bought && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${bought ? "line-through text-gray-400" : ""}`}>
          {item.name}
        </p>
        <p className="text-xs text-gray-400">
          {item.quantity.amount} {item.quantity.unit}
          {item.linkedItemName && !bought && (
            <span className="text-green-500"> · from {item.linkedItemName}</span>
          )}
        </p>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}
