import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface Props {
  email: string | null
  onDone: () => void
}

export default function UsernameSetupModal({ email, onDone }: Props) {
  const { updateDisplayName } = useAuth()
  const [name, setName] = useState(email ? email.split('@')[0] : '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    await updateDisplayName(trimmed)
    localStorage.removeItem('wl_needs_username')
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            What should we call you?
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            This is how others see you in shared groups. You can change it anytime in Settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder={email ?? 'Your name'}
            className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}
