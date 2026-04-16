import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

type Mode = 'choose' | 'email-signin' | 'email-signup'

interface Props {
  /** When true the user is anonymous — we try to link/upgrade first */
  isUpgrade: boolean
  onClose: () => void
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export default function SignInModal({ isUpgrade, onClose }: Props) {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function run(fn: () => Promise<void>) {
    setError('')
    setLoading(true)
    try {
      await fn()
      onClose()
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      if (code === 'auth/email-already-in-use')
        setError('That email already has an account. Try signing in instead.')
      else if (
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential'
      )
        setError('Incorrect email or password.')
      else if (code === 'auth/weak-password')
        setError('Password must be at least 6 characters.')
      else if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      )
        setError('')
      else if (code !== '') setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // For anonymous users: try to link; if the account already exists, sign in instead
  async function handleGoogle() {
    run(async () => {
      if (isUpgrade) {
        try {
          await auth.upgradeWithGoogle()
        } catch (e: unknown) {
          if (
            (e as { code?: string }).code === 'auth/credential-already-in-use'
          ) {
            await auth.signInGoogle()
          } else {
            throw e
          }
        }
      } else {
        await auth.signInGoogle()
      }
    })
  }

  async function handleApple() {
    run(async () => {
      if (isUpgrade) {
        try {
          await auth.upgradeWithApple()
        } catch (e: unknown) {
          if (
            (e as { code?: string }).code === 'auth/credential-already-in-use'
          ) {
            await auth.signInApple()
          } else {
            throw e
          }
        }
      } else {
        await auth.signInApple()
      }
    })
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'email-signup') {
      run(() =>
        isUpgrade
          ? auth.upgradeWithEmail(email, password, name)
          : auth.createAccount(email, password, name),
      )
    } else {
      run(() => auth.signInEmail(email, password))
    }
  }

  const title =
    mode === 'choose'
      ? 'Sign in'
      : mode === 'email-signup'
        ? 'Create account'
        : 'Sign in with email'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* ── Choose mode ── */}
        {mode === 'choose' && (
          <div className="flex flex-col gap-3">
            {isUpgrade && (
              <p className="text-sm text-gray-500 -mt-2">
                Link an account to keep your data when switching devices.
              </p>
            )}

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <button
              onClick={handleApple}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              <AppleIcon />
              Continue with Apple
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              onClick={() => {
                setMode('email-signin')
                setError('')
              }}
              className="w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign in with email
            </button>

            <button
              onClick={() => {
                setMode('email-signup')
                setError('')
              }}
              className="w-full text-sm text-green-600 hover:underline py-1"
            >
              New here? Create account
            </button>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* ── Email sign-in ── */}
        {mode === 'email-signin' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {resetSent && (
              <p className="text-sm text-green-600">
                Reset email sent! Check your inbox.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('choose')
                  setError('')
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('email-signup')
                  setError('')
                }}
                className="text-sm text-green-600 hover:underline"
              >
                Create account instead
              </button>
            </div>

            <button
              type="button"
              disabled={loading || !email}
              onClick={async () => {
                setError('')
                setResetSent(false)
                setLoading(true)
                try {
                  await auth.resetPassword(email)
                  setResetSent(true)
                } catch {
                  setError(
                    'Could not send reset email. Check the address and try again.',
                  )
                } finally {
                  setLoading(false)
                }
              }}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 text-center"
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* ── Email sign-up ── */}
        {mode === 'email-signup' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="e.g. Alex"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('choose')
                  setError('')
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('email-signin')
                  setError('')
                }}
                className="text-sm text-green-600 hover:underline"
              >
                Already have an account?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
