import { useEffect, useState } from 'react'
import type { Group } from '../types'
import { getMemberProfiles, type MemberProfile } from '../firebase/users'

interface Props {
  group: Group
  currentUserId: string
  onRefreshCode: () => Promise<string>
  onRemoveMember: (memberId: string) => Promise<void>
  onClose: () => void
}

function Avatar({ profile }: { profile: MemberProfile }) {
  const initial = profile.displayName.charAt(0).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
      {profile.photoURL ? (
        <img
          src={profile.photoURL}
          alt={profile.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  )
}

export default function InviteModal({
  group,
  currentUserId,
  onRefreshCode,
  onRemoveMember,
  onClose,
}: Props) {
  const [code, setCode] = useState(group.inviteCode)
  const [members, setMembers] = useState<MemberProfile[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const isOwner = group.ownerId === currentUserId
  const inviteLink = `${window.location.origin}/join?code=${code}`

  useEffect(() => {
    getMemberProfiles(group.memberIds)
      .then(setMembers)
      .finally(() => setLoadingMembers(false))
  }, [group.memberIds.join(',')])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const newCode = await onRefreshCode()
      setCode(newCode)
    } finally {
      setRefreshing(false)
    }
  }

  async function handleCopyCode() {
    await navigator.clipboard.writeText(code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    try {
      await onRemoveMember(memberId)
      setMembers((prev) => prev.filter((m) => m.uid !== memberId))
    } finally {
      setRemovingId(null)
    }
  }

  const codeExpiry = group.inviteCodeExpiresAt
  const isExpired = codeExpiry && codeExpiry.toDate() < new Date()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Invite to {group.name}
            </h2>
            {codeExpiry && !isExpired && (
              <p className="text-xs text-gray-400 mt-0.5">
                Code expires {codeExpiry.toDate().toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
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

        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">
          {/* Invite code display */}
          <div className="flex flex-col gap-2">
            <div
              className={`flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border ${isExpired ? 'border-red-200' : 'border-gray-200'}`}
            >
              <span
                className={`text-xl font-mono font-bold tracking-widest ${isExpired ? 'text-red-400' : 'text-gray-800'}`}
              >
                {code}
              </span>
              {isExpired && (
                <span className="text-xs text-red-400 font-medium">
                  Expired
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {codeCopied ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
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
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
                {codeCopied ? 'Copied!' : 'Copy code'}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {linkCopied ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
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
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {isOwner && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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
                  className={refreshing ? 'animate-spin' : ''}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                {refreshing ? 'Refreshing…' : 'Generate new code'}
              </button>
            )}
          </div>

          {/* Members list */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Members ({members.length})
            </p>
            {loadingMembers ? (
              <div className="flex flex-col gap-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
                    <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-50">
                {members.map((m) => (
                  <li key={m.uid} className="flex items-center gap-3 py-2.5">
                    <Avatar profile={m} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {m.displayName}
                        {m.uid === currentUserId && (
                          <span className="ml-1.5 text-xs text-gray-400 font-normal">
                            you
                          </span>
                        )}
                      </p>
                      {m.uid === group.ownerId && (
                        <p className="text-xs text-gray-400">Owner</p>
                      )}
                    </div>
                    {isOwner && m.uid !== currentUserId && (
                      <button
                        onClick={() => handleRemove(m.uid)}
                        disabled={removingId === m.uid}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {removingId === m.uid ? '…' : 'Remove'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
