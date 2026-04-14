import { useRef, useState } from "react";
import type { Group } from "../types";

interface GroupTabsProps {
  groups: Group[];
  activeGroupId: string | null;
  onChange: (groupId: string | null) => void;
  onAddGroup: (name: string) => void;
  onReorder?: (groups: Group[]) => void;
}

export default function GroupTabs({ groups, activeGroupId, onChange, onAddGroup, onReorder }: GroupTabsProps) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [reordering, setReordering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  function move(index: number, dir: -1 | 1) {
    const next = [...groups];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onReorder?.(next);
  }

  return (
    <div className="bg-white border-b border-gray-100 px-4">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 max-w-lg mx-auto items-center">
        {/* All tab — hidden during reorder */}
        {!reordering && (
          <button
            onClick={() => onChange(null)}
            className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeGroupId === null
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            All
          </button>
        )}

        {/* Group tabs */}
        {groups.map((g, i) => (
          <div key={g.id} className="flex items-center shrink-0">
            {reordering ? (
              <div className="flex items-center gap-1 py-2 px-2">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm"
                >
                  ‹
                </button>
                <span className="text-sm font-medium text-gray-700 px-1 whitespace-nowrap">{g.name}</span>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === groups.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-30 text-sm"
                >
                  ›
                </button>
              </div>
            ) : (
              <button
                onClick={() => onChange(g.id)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeGroupId === g.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {g.name}
              </button>
            )}
          </div>
        ))}

        {/* Reorder toggle */}
        {!adding && onReorder && groups.length > 1 && (
          <button
            onClick={() => setReordering((r) => !r)}
            className={`shrink-0 w-8 h-8 ml-1 rounded-full flex items-center justify-center transition-colors ${
              reordering
                ? "bg-green-500 text-white"
                : "border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500"
            }`}
            title={reordering ? "Done reordering" : "Reorder tabs"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
        )}

        {/* Inline add input */}
        {!reordering && (
          adding ? (
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
          )
        )}
      </div>
    </div>
  );
}
