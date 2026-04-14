import { useRef, useState } from "react";
import type { Group } from "../types";

interface GroupTabsProps {
  groups: Group[];
  activeGroupId: string | null;
  onChange: (groupId: string | null) => void;
  onAddGroup: (name: string) => void;
}

export default function GroupTabs({ groups, activeGroupId, onChange, onAddGroup }: GroupTabsProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tabs = [{ id: null, name: "All" }, ...groups.map((g) => ({ id: g.id, name: g.name }))];

  function startAdding() {
    setAdding(true);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function confirm() {
    const name = input.trim();
    if (name) onAddGroup(name);
    setAdding(false);
    setInput("");
  }

  function cancel() {
    setAdding(false);
    setInput("");
  }

  return (
    <div className="bg-white border-b border-gray-100 px-4">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 max-w-lg mx-auto items-center">
        {tabs.map((tab) => {
          const isActive = activeGroupId === tab.id;
          return (
            <button
              key={tab.id ?? "all"}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.name}
            </button>
          );
        })}

        {/* Inline add input */}
        {adding ? (
          <div className="flex items-center gap-1 shrink-0 py-1.5">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); confirm(); }
                if (e.key === "Escape") cancel();
              }}
              placeholder="Group name"
              className="border border-green-400 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={confirm}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-green-500 text-white text-lg leading-none flex items-center justify-center disabled:opacity-40 shrink-0"
            >
              ✓
            </button>
            <button
              onClick={cancel}
              className="w-8 h-8 rounded-full border border-gray-200 text-gray-400 text-lg leading-none flex items-center justify-center shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={startAdding}
            className="shrink-0 w-8 h-8 ml-1 rounded-full border border-gray-200 text-gray-400 text-xl leading-none flex items-center justify-center hover:border-green-400 hover:text-green-500 transition-colors"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
