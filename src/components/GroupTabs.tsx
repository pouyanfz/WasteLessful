import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Group } from '../types'
import { GROUP_COLORS } from '../data/groupColors'

interface GroupTabsProps {
  groups: Group[]
  activeGroupId: string | null
  groupNicknames?: Record<string, string>
  onChange: (groupId: string | null) => void
  onAddGroup: (name: string) => void
  onReorder?: (groups: Group[]) => void
  onDeleteGroup?: (groupId: string, moveToGroupId: string | null) => void
  onUpdateGroup?: (groupId: string, data: { color?: string }) => void
  onSetNickname?: (groupId: string, nickname: string) => void
  onInvite?: (group: Group) => void
  archivedCount?: number
  /** When provided, externally controls the manage modal open state */
  openManage?: boolean
  onManageClose?: () => void
}

type PendingDelete = { groupId: string; groupName: string } | null

export default function GroupTabs({
  groups,
  activeGroupId,
  groupNicknames = {},
  onChange,
  onAddGroup,
  onReorder,
  onDeleteGroup,
  onUpdateGroup,
  onSetNickname,
  onInvite,
  archivedCount,
  openManage,
  onManageClose,
}: GroupTabsProps) {
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    if (openManage) setManageOpen(true)
  }, [openManage])
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null)
  const [deleteMode, setDeleteMode] = useState<'move' | 'delete'>('move')
  const [moveToId, setMoveToId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editNameRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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

  function displayName(g: Group) {
    return groupNicknames[g.id] ?? g.name
  }

  function startEditing(g: Group) {
    setEditingGroupId(g.id)
    setEditName(groupNicknames[g.id] ?? '')
    setEditColor(g.color ?? '')
    setTimeout(() => editNameRef.current?.focus(), 0)
  }

  function cancelEditing() {
    setEditingGroupId(null)
    setEditName('')
    setEditColor('')
  }

  function saveEditing(g: Group) {
    // Nickname is always saved (empty string = clear nickname, fall back to group's real name)
    onSetNickname?.(g.id, editName)
    if (editColor !== (g.color ?? ''))
      onUpdateGroup?.(g.id, { color: editColor })
    cancelEditing()
  }

  function initiateDelete(group: Group) {
    cancelEditing()
    const others = groups.filter((g) => g.id !== group.id)
    setPendingDelete({ groupId: group.id, groupName: group.name })
    setMoveToId(others[0]?.id ?? '')
    setDeleteMode(others.length > 0 ? 'move' : 'delete')
  }

  function closeManage() {
    setManageOpen(false)
    onManageClose?.()
  }

  function confirmDelete() {
    if (!pendingDelete) return
    onDeleteGroup?.(
      pendingDelete.groupId,
      deleteMode === 'move' ? moveToId : null,
    )
    setPendingDelete(null)
    closeManage()
  }

  const otherGroups = pendingDelete
    ? groups.filter((g) => g.id !== pendingDelete.groupId)
    : []

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center max-w-lg mx-auto">
          {/* Manage button — fixed far left */}
          <button
            onClick={() => setManageOpen(true)}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors border-r border-gray-100 dark:border-gray-700"
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
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>

              {/* Group tabs */}
              {groups.map((g) => {
                const isActive = activeGroupId === g.id
                const isShared = g.memberIds.length > 1
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
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {g.color && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                    )}
                    {displayName(g)}
                    {isShared && (
                      <span
                        role="button"
                        tabIndex={0}
                        title="View members"
                        onClick={(e) => {
                          e.stopPropagation()
                          onInvite?.(g)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            onInvite?.(g)
                          }
                        }}
                        className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Archive tab — always last, visually distinct */}
              <button
                onClick={() => onChange('archived')}
                className={`shrink-0 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeGroupId === 'archived'
                    ? 'border-gray-400 text-gray-700 dark:text-gray-200'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
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
                  <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 leading-5 font-semibold">
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
                    className="border border-green-400 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
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
                    className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-lg leading-none flex items-center justify-center shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Gradient fade — hints at more tabs to the right */}
            {!adding && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Add button — fixed right */}
          {!adding && (
            <button
              onClick={startAdding}
              className="shrink-0 w-10 h-10 flex items-center justify-center border-l border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xl leading-none hover:text-green-500 transition-colors"
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
          onClick={() => {
            cancelEditing()
            closeManage()
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Manage Groups
              </h2>
              <button
                onClick={() => {
                  cancelEditing()
                  closeManage()
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-10">
                No groups yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[60vh] overflow-y-auto">
                {groups.map((g, i) => {
                  const isEditing = editingGroupId === g.id
                  return (
                    <li key={g.id} className="px-5 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        {/* Up / down reorder */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            className="w-6 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
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
                            className="w-6 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-20 transition-colors"
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

                        {/* Color dot — decorative only */}
                        <span
                          className="w-5 h-5 rounded-full shrink-0"
                          style={{ backgroundColor: g.color || '#e5e7eb' }}
                        />

                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex items-center gap-1.5">
                          {displayName(g)}
                          {g.memberIds.length > 1 && (
                            <span className="text-xs" title="Shared group">
                              👥
                            </span>
                          )}
                        </span>

                        {/* Edit (pencil) button */}
                        <button
                          onClick={() =>
                            isEditing ? cancelEditing() : startEditing(g)
                          }
                          className={`p-1.5 rounded transition-colors ${
                            isEditing
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title="Edit name and color"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>

                        {/* Invite button */}
                        {onInvite && (
                          <button
                            onClick={() => {
                              cancelEditing()
                              closeManage()
                              onInvite(g)
                            }}
                            className="p-1.5 rounded text-green-500 hover:text-green-700 hover:bg-green-50 transition-colors"
                            title="Invite people"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="8.5" cy="7" r="4" />
                              <line x1="20" y1="8" x2="20" y2="14" />
                              <line x1="23" y1="11" x2="17" y2="11" />
                            </svg>
                          </button>
                        )}

                        <button
                          onClick={() => initiateDelete(g)}
                          className="text-sm text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Inline edit panel */}
                      {isEditing && (
                        <div className="flex flex-col gap-3 pl-9 pt-1">
                          {/* Nickname input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">
                              Your nickname
                              <span className="text-gray-400 dark:text-gray-500 font-normal">
                                {' '}
                                (leave blank to use "{g.name}")
                              </span>
                            </label>
                            <input
                              ref={editNameRef}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditing(g)
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              placeholder={g.name}
                              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
                            />
                          </div>

                          {/* Color swatches */}
                          <div className="flex gap-2 flex-wrap">
                            {/* No color */}
                            <button
                              onClick={() => setEditColor('')}
                              className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-transform hover:scale-110 relative overflow-hidden shrink-0"
                              title="No color"
                              style={
                                editColor === ''
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
                                onClick={() => setEditColor(c)}
                                className="w-6 h-6 rounded-full transition-transform hover:scale-110 shrink-0"
                                style={{
                                  backgroundColor: c,
                                  outline:
                                    editColor === c ? `2px solid ${c}` : 'none',
                                  outlineOffset: '2px',
                                }}
                                title={c}
                              />
                            ))}
                          </div>

                          {/* Save / Cancel */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEditing(g)}
                              className="flex-1 py-1.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
              <button
                onClick={() => {
                  cancelEditing()
                  closeManage()
                }}
                className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Done
              </button>
              <button
                onClick={() => {
                  cancelEditing()
                  closeManage()
                  navigate('/join')
                }}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Join a group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 pt-5 pb-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Delete "{pendingDelete.groupName}"
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                What should happen to items in this group?
              </p>
            </div>

            <div className="px-5 pb-4 pt-2 flex flex-col gap-2">
              {otherGroups.length > 0 && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    deleteMode === 'move'
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Move items to another group
                    </p>
                    {deleteMode === 'move' && (
                      <select
                        value={moveToId}
                        onChange={(e) => setMoveToId(e.target.value)}
                        className="mt-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
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
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                onClick={() => setDeleteMode('delete')}
              >
                <input
                  type="radio"
                  checked={deleteMode === 'delete'}
                  onChange={() => setDeleteMode('delete')}
                  className="accent-red-500"
                />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Delete all items in this group
                </p>
              </label>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
