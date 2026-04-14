import { useState } from "react";
import { mockItems } from "../data/mockItems";
import ItemCard from "../components/ItemCard";

export default function ItemsPage() {
  const [items] = useState(mockItems.filter((i) => !i.isArchived));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">My Items</h1>
        <button
          className="w-9 h-9 rounded-full bg-green-500 text-white flex items-center justify-center text-xl leading-none shadow"
          onClick={() => alert("AddItemModal coming soon")}
        >
          +
        </button>
      </header>

      {/* Item list */}
      <main className="px-4 py-4 flex flex-col gap-3 max-w-lg mx-auto">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 mt-12">No items yet. Add one!</p>
        ) : (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        )}
      </main>
    </div>
  );
}
