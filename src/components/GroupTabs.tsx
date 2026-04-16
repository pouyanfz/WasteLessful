import { useRef, useState } from 'react'
import type { Group } from '../types'
import { GROUP_COLORS } from '../data/groupColors'

interface GroupTabsProps {
  groups: Group[]
  activeGroupId: string | null
  onChange: (groupId: string | null) => void
  onAddGroup: (name: string) => void
  onReorder?: (groups: Group[]) => void
  onDeleteGroup?: (groupId: string, moveToGroupId: string | null) => void
  onUpdateGroupColor?: (groupId: string, color: string) => void
  archivedCount?: number
}

type PendingDelete = { groupId: string; groupName: string } | null

export default function GroupTabs({
  groups,
  activeGroupId,
  onChange,
  onAddGroup,
  onReorder,
  onDeleteGroup,
  onUpdateGroupColor,
  archivedCount,
}: GroupTabsProps) {
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [editingColorId, setEditingColorId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [deleteMode, setDeleteMode] = useState<'move' | 'delete'>('move')
  const [moveToId, setMoveToId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function startAdding() {
    setAdding(true)
    setInput('')
    setTimeout(() => {
      inputRef.current?.focus()
      scrollRef.current?.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      })
    }, 0)
  }

  function confirm() {
    const name = input.trim()
    if (name) onAddGroup(name)
    setAdding(false)
    setInput('')
  }

  function cancel() {
    setAdding(false)
    setInput('')
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...groups]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onReorder?.(next)
  }

  function initiateDelete(group: Group) {
    const others = groups.filter((g) => g.id !== group.id)
    setPendingDelete({ groupId: group.id, groupName: group.name })
    setMoveToId(others[0]?.id ?? '')
    setDeleteMode(others.length > 0 ? 'move' : 'delete')
  }

  function confirmDelete() {
    if (!pendingDelete) return
    onDeleteGroup?.(
      pendingDelete.groupId,
      deleteMode === 'move' ? moveToId : null,
    )
    setPendingDelete(null)
    setManageOpen(false)
  }

  const otherGroups = pendingDelete
    ? groups.filter((g) => g.id !== pendingDelete.groupId)
    : []

  return (
    <>
      <div className="bg-white border-b border-gray-100">
        <div className="flex items-center max-w-lg mx-auto">
          {/* Manage button — fixed far left */}
          <button
            onClick={() => setManageOpen(true)}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-green-500 transition-colors border-r border-gray-100"
            title="Manage groups"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>

          {/* Scrollable tabs */}
          <div className="relative flex-1 min-w-0">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto scrollbar-hide"
            >
              {/* All tab */}
              <button
                onClick={() => onChange(null)}
                className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeGroupId === null
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>

              {/* Group tabs */}
              {groups.map((g) => {
                const isActive = activeGroupId === g.id
                return (
                  <button
                    key={g.id}
                    onClick={() => onChange(g.id)}
                    style={
                      isActive && g.color
                        ? { borderColor: g.color, color: g.color }
                        : {}
                    }
                    className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isActive && !g.color
                        ? 'border-green-500 text-green-600'
                        : isActive
                          ? ''
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {g.color && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                    )}
                    {g.name}
                  </button>
                )
              })}

              {/* Archive tab — always last, visually distinct */}
              <button
                onClick={() => onChange('archived')}
                className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeGroupId === 'archived'
                    ? 'border-gray-400 text-gray-700'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Archive
                {archivedCount !== undefined && archivedCount > 0 && (
                  <span className="text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5 leading-5 font-semibold">
                    {archivedCount}
                  </span>
                )}
              </button>

              {/* Inline add input — appears at end of scroll area */}
              {adding && (
                <div className="flex items-center gap-1 shrink-0 py-1.5 px-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        confirm()
                      }
                      if (e.key === 'Escape') cancel()
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
              )}
            </div>

            {/* Gradient fade — hints at more tabs to the right */}
            {!adding && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            )}
          </div>

          {/* Add button — fixed right */}
          {!adding && (
            <button
              onClick={startAdding}
              className="shrink-0 w-10 h-10 flex items-center justify-center border-l border-gray-100 text-gray-400 text-xl leading-none hover:text-green-500 transition-colors"
              title="Add group"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Manage Groups Modal */}
      {manageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setManageOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                Manage Groups
              </h2>
              <button
                onClick={() => setManageOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {groups.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">
                No groups yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                {groups.map((g, i) => (
                  <li key={g.id} className="px-5 py-3 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      {/* Up / down reorder */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                          aria-label="Move up"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 4l8 8H4z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === groups.length - 1}
                          className="w-6 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
                          aria-label="Move down"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 20l-8-8h16z" />
                          </svg>
                        </button>
                      </div>

                      {/* Color dot — tap to change */}
                      <button
                        onClick={() =>
                          setEditingColorId(
                            editingColorId === g.id ? null : g.id,
                          )
                        }
                        className="w-5 h-5 rounded-full shrink-0 transition-all"
                        style={{
                          backgroundColor: g.color || '#e5e7eb',
                          boxShadow:
                            editingColorId === g.id
                              ? '0 0 0 2px white, 0 0 0 3.5px #9ca3af'
                              : 'none',
                        }}
                        title="Change color"
                      />

                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                        {g.name}
                      </span>

                      <button
                        onClick={() => initiateDelete(g)}
                        className="text-sm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Inline color picker */}
                    {editingColorId === g.id && (
                      <div className="flex gap-2 flex-wrap pl-14">
                        {/* No color swatch */}
                        <button
                          onClick={() => {
                            onUpdateGroupColor?.(g.id, '')
                            setEditingColorId(null)
                          }}
                          className="w-6 h-6 rounded-full border border-gray-300 bg-white transition-transform hover:scale-110 relative overflow-hidden"
                          title="No color"
                          style={
                            g.color === ''
                              ? {
                                  boxShadow:
                                    '0 0 0 2px white, 0 0 0 3.5px #9ca3af',
                                }
                              : {}
                          }
                        >
                          <span
                            className="absolute inset-0"
                            style={{
                              background:
                                'linear-gradient(to bottom right, transparent calc(50% - 0.5px), #d1d5db calc(50% - 0.5px), #d1d5db calc(50% + 0.5px), transparent calc(50% + 0.5px))',
                            }}
                          />
                        </button>
                        {GROUP_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              onUpdateGroupColor?.(g.id, c)
                              setEditingColorId(null)
                            }}
                            className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c,
                              outline:
                                g.color === c ? `2px solid ${c}` : 'none',
                              outlineOffset: '2px',
                            }}
                            title={c}
                          />
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setManageOpen(false)}
                className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-base font-semibold text-gray-800">
                Delete "{pendingDelete.groupName}"
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                What should happen to items in this group?
              </p>
            </div>

            <div className="px-5 pb-4 pt-2 flex flex-col gap-2">
              {otherGroups.length > 0 && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    deleteMode === 'move'
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setDeleteMode('move')}
                >
                  <input
                    type="radio"
                    checked={deleteMode === 'move'}
                    onChange={() => setDeleteMode('move')}
                    className="mt-0.5 accent-green-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Move items to another group
                    </p>
                    {deleteMode === 'move' && (
                      <select
                        value={moveToId}
                        onChange={(e) => setMoveToId(e.target.value)}
                        className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {otherGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>
              )}

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  deleteMode === 'delete'
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setDeleteMode('delete')}
              >
                <input
                  type="radio"
                  checked={deleteMode === 'delete'}
                  onChange={() => setDeleteMode('delete')}
                  className="accent-red-500"
                />
                <p className="text-sm font-medium text-gray-700">
                  Delete all items in this group
                </p>
              </label>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {deleteMode === 'move' ? 'Move & Delete' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
