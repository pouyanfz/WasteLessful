import { useEffect, useRef, useState } from 'react'
import loadingAnimation from '../assets/loadingAnimation.gif'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import type { JoinResult } from '../context/AppDataContext'
import SignInModal from '../components/SignInModal'

type PageState =
  | { phase: 'loading' }
  | { phase: 'input'; error?: string }
  | { phase: 'joining' }
  | { phase: 'result'; result: JoinResult }

export default function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { firebaseUser, loading: authLoading } = useAuth()
  const { joinGroupByCode } = useAppData()

  const urlCode = searchParams.get('code') ?? ''
  const [codeInput, setCodeInput] = useState(urlCode)
  const [state, setState] = useState<PageState>({ phase: 'loading' })
  const [showSignIn, setShowSignIn] = useState(false)
  const hasAutoJoined = useRef(false)

  // Once auth is ready, auto-join if code was in URL
  useEffect(() => {
    if (authLoading) return
    if (urlCode && !hasAutoJoined.current) {
      hasAutoJoined.current = true
      attemptJoin(urlCode)
    } else if (!urlCode) {
      setState({ phase: 'input' })
    }
  }, [authLoading])

  async function attemptJoin(code: string) {
    if (!code.trim()) {
      setState({ phase: 'input', error: 'Please enter an invite code.' })
      return
    }
    setState({ phase: 'joining' })
    try {
      const result = await joinGroupByCode(code.trim())
      setState({ phase: 'result', result })
    } catch (err) {
      console.error('[JoinPage] join failed:', err)
      setState({
        phase: 'input',
        error: 'Something went wrong. Please try again.',
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    attemptJoin(codeInput)
  }

  if (state.phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <img src={loadingAnimation} alt="" className="w-16 h-16" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'result') {
    const { result } = state

    if (result.status === 'invalid') {
      return (
        <ResultScreen
          icon="❌"
          title="Invalid invite code"
          body="This code doesn't match any group. Check for typos or ask the owner for a new link."
          action={{
            label: 'Try again',
            onClick: () => setState({ phase: 'input' }),
          }}
        />
      )
    }

    if (result.status === 'expired') {
      return (
        <ResultScreen
          icon="⏱"
          title="Invite link expired"
          body={`The invite to "${result.groupName}" has expired. Ask the group owner to share a new one.`}
          action={{
            label: 'Try another code',
            onClick: () => setState({ phase: 'input' }),
          }}
        />
      )
    }

    if (result.status === 'already-member') {
      return (
        <ResultScreen
          icon="✓"
          title={`You're already in ${result.groupName}`}
          body="You already have access to this group."
          action={{ label: 'Go to app', onClick: () => navigate('/') }}
        />
      )
    }

    // joined
    return (
      <ResultScreen
        icon="🎉"
        title={`Joined ${result.groupName}!`}
        body="You've been added to the group. Your inventory is now shared."
        action={{ label: 'Open app', onClick: () => navigate('/') }}
      />
    )
  }

  const isJoining = state.phase === 'joining'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-5">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-1 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center mb-1">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Join a shared group
          </h1>
          <p className="text-sm text-gray-500 text-center">
            Enter the invite code or paste the link you received.
          </p>
        </div>

        {/* Anonymous warning */}
        {firebaseUser?.isAnonymous && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-700 leading-relaxed">
                You're joining as a guest.{' '}
                <button
                  onClick={() => setShowSignIn(true)}
                  className="font-medium underline"
                >
                  Sign in
                </button>{' '}
                to keep access across devices.
              </p>
            </div>
          </div>
        )}

        {/* Code input */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Invite code
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. A1B2C3D4"
              autoFocus={!urlCode}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="border border-gray-200 rounded-xl px-4 py-3 text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-400 uppercase"
            />
          </div>

          {state.phase === 'input' && state.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isJoining || !codeInput.trim()}
            className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isJoining && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isJoining ? 'Joining…' : 'Join group'}
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-gray-600 text-center transition-colors"
        >
          Back to app
        </button>
      </div>

      {showSignIn && (
        <SignInModal isUpgrade={true} onClose={() => setShowSignIn(false)} />
      )}
    </div>
  )
}

function ResultScreen({
  icon,
  title,
  body,
  action,
}: {
  icon: string
  title: string
  body: string
  action: { label: string; onClick: () => void }
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-4 text-center">
        <span className="text-4xl">{icon}</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{body}</p>
        </div>
        <button
          onClick={action.onClick}
          className="mt-2 w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
        >
          {action.label}
        </button>
      </div>
    </div>
  )
}
