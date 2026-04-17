import { useState } from 'react'
import { version } from '../../package.json'
import { useNavigate } from 'react-router-dom'
import type { UserSettings } from '../types'
import { useAuth } from '../context/AuthContext'
import { useAppData } from '../context/AppDataContext'
import SignInModal from '../components/SignInModal'

type Section =
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'inventory'
  | 'support'

// ─── Primitives ───────────────────────────────────────────────────────────────

function PageShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </header>
      <div className="px-4 py-6 flex flex-col gap-6 max-w-lg mx-auto">
        {children}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {children}
    </div>
  )
}

function Row({
  label,
  sublabel,
  last = false,
  children,
}: {
  label: string
  sublabel?: string
  last?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-3.5 ${!last ? 'border-b border-gray-100' : ''}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-800">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${value ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-6' : 'left-1'}`}
      />
    </button>
  )
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={disabled || value <= min}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-30 transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
      <span
        className={`text-sm font-medium w-8 text-center ${disabled ? 'text-gray-300' : 'text-gray-700'}`}
      >
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={disabled || value >= max}
        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-green-400 hover:text-green-600 disabled:opacity-30 transition-colors"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-400 px-1">{children}</p>
}

// ─── Sub-pages ────────────────────────────────────────────────────────────────

function AccountSection({ onBack }: { onBack: () => void }) {
  const { firebaseUser, signOut, deleteAccount, updateDisplayName } = useAuth()
  const { userDoc } = useAppData()
  const [showSignIn, setShowSignIn] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [busy, setBusy] = useState(false)

  const isAnon = firebaseUser?.isAnonymous ?? true
  const displayName =
    userDoc?.displayName ?? firebaseUser?.displayName ?? 'Guest'
  const email = userDoc?.email ?? firebaseUser?.email ?? null
  const photo = userDoc?.photoURL ?? firebaseUser?.photoURL ?? null

  async function handleSaveName() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setBusy(true)
    await updateDisplayName(trimmed)
    setEditingName(false)
    setBusy(false)
  }

  async function handleSignOut() {
    setBusy(true)
    await signOut()
    setBusy(false)
    onBack()
  }

  async function handleDelete() {
    setBusy(true)
    await deleteAccount()
    setBusy(false)
    onBack()
  }

  return (
    <PageShell title="Account" onBack={onBack}>
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 py-4">
        {photo ? (
          <img
            src={photo}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-400">
            {isAnon ? (
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            {isAnon ? 'Guest' : displayName}
          </p>
          {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
          {isAnon && (
            <p className="text-xs text-gray-400 mt-0.5">
              Data saved on this device only
            </p>
          )}
        </div>
      </div>

      {isAnon ? (
        <>
          <Card>
            <button
              onClick={() => setShowSignIn(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-green-600 hover:bg-gray-50 transition-colors"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign in / Create account
            </button>
          </Card>
          <Note>
            Sign in to sync your data across devices and share groups with
            family or roommates. Your existing items will be kept.
          </Note>
        </>
      ) : (
        <>
          {/* Display name editor */}
          <div>
            <SectionLabel>Display name</SectionLabel>
            <Card>
              {editingName ? (
                <div className="px-4 py-3 flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                    placeholder="Your name"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={busy || !nameInput.trim()}
                    className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNameInput(displayName)
                    setEditingName(true)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-800">{displayName}</span>
                  <span className="text-xs text-green-600">Edit</span>
                </button>
              )}
            </Card>
            <Note>This is how others will see you in shared groups.</Note>
          </div>

          <Card>
            <button
              onClick={handleSignOut}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Sign out
            </button>
          </Card>

          <Card>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete account
              </button>
            ) : (
              <div className="px-4 py-4 flex flex-col gap-3">
                <p className="text-sm text-gray-700 font-medium">
                  Delete your account?
                </p>
                <p className="text-xs text-gray-400">
                  This cannot be undone. Your data will be removed.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {busy ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {showSignIn && (
        <SignInModal isUpgrade={true} onClose={() => setShowSignIn(false)} />
      )}
    </PageShell>
  )
}

function AppearanceSection({
  settings,
  update,
  onBack,
}: {
  settings: UserSettings
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  const themes: { value: UserSettings['theme']; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]

  return (
    <PageShell title="Appearance" onBack={onBack}>
      <div>
        <SectionLabel>Theme</SectionLabel>
        <Card>
          <div className="flex p-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => update('theme', t.value)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                  settings.theme === t.value
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Note>
        "System" follows your device's appearance setting. Dark mode will take
        effect in a future update.
      </Note>
    </PageShell>
  )
}

function NotificationsSection({
  settings,
  update,
  onBack,
}: {
  settings: UserSettings
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <PageShell title="Notifications" onBack={onBack}>
      <div>
        <SectionLabel>Expiry</SectionLabel>
        <Card>
          <Row label="Notify when item expires">
            <Toggle
              value={settings.notifyOnExpired}
              onChange={(v) => update('notifyOnExpired', v)}
            />
          </Row>
          <Row label="Warn me this many days before" last>
            <div className="flex items-center gap-1.5">
              <Stepper
                value={settings.notifyDaysBeforeExpiry}
                min={1}
                max={30}
                onChange={(v) => update('notifyDaysBeforeExpiry', v)}
              />
              <span className="text-xs text-gray-400">days</span>
            </div>
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>Quantity</SectionLabel>
        <Card>
          <Row label="Notify when low quantity">
            <Toggle
              value={settings.notifyOnLowQuantity}
              onChange={(v) => update('notifyOnLowQuantity', v)}
            />
          </Row>
          <Row label="Low quantity threshold" last>
            <div className="flex items-center gap-1.5">
              <Stepper
                value={settings.lowQuantityThreshold}
                min={5}
                max={75}
                step={5}
                onChange={(v) => update('lowQuantityThreshold', v)}
                disabled={!settings.notifyOnLowQuantity}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>Usage</SectionLabel>
        <Card>
          <Row label="Nudge me if an item goes unused">
            <Toggle
              value={settings.notifyUnusedAfterDays !== null}
              onChange={(v) => update('notifyUnusedAfterDays', v ? 14 : null)}
            />
          </Row>
          <Row label="After this many days" last>
            <div className="flex items-center gap-1.5">
              <Stepper
                value={settings.notifyUnusedAfterDays ?? 14}
                min={1}
                max={90}
                onChange={(v) => update('notifyUnusedAfterDays', v)}
                disabled={settings.notifyUnusedAfterDays === null}
              />
              <span className="text-xs text-gray-400">days</span>
            </div>
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>Other</SectionLabel>
        <Card>
          <Row label="Weekly summary report">
            <Toggle
              value={settings.weeklyReport}
              onChange={(v) => update('weeklyReport', v)}
            />
          </Row>
          <Row label="Group member activity" last>
            <Toggle
              value={settings.getGroupNotifications}
              onChange={(v) => update('getGroupNotifications', v)}
            />
          </Row>
        </Card>
      </div>

      <Note>
        Push notifications require a signed-in account and will be enabled in a
        future update.
      </Note>
    </PageShell>
  )
}

function InventorySection({
  settings,
  update,
  onBack,
}: {
  settings: UserSettings
  update: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <PageShell title="Inventory" onBack={onBack}>
      <div>
        <SectionLabel>Shopping list</SectionLabel>
        <Card>
          <Row
            label="Auto-add when item expires"
            sublabel="Adds to your shopping list automatically"
          >
            <Toggle
              value={settings.autoAddToShoppingListOnExpiry}
              onChange={(v) => update('autoAddToShoppingListOnExpiry', v)}
            />
          </Row>
          <Row
            label="Auto-add when low quantity"
            sublabel="Based on your quantity threshold"
            last
          >
            <Toggle
              value={settings.autoAddToShoppingListOnLowQuantity}
              onChange={(v) => update('autoAddToShoppingListOnLowQuantity', v)}
            />
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>Archive</SectionLabel>
        <Card>
          <Row
            label="Auto-delete archived items after"
            sublabel={
              settings.archiveRetentionDays === null
                ? 'Items stay forever'
                : `Deleted after ${settings.archiveRetentionDays} days`
            }
          >
            <div className="flex items-center gap-2 shrink-0">
              {settings.archiveRetentionDays !== null && (
                <div className="flex items-center gap-1.5">
                  <Stepper
                    value={settings.archiveRetentionDays}
                    min={1}
                    max={365}
                    onChange={(v) => update('archiveRetentionDays', v)}
                  />
                  <span className="text-xs text-gray-400">days</span>
                </div>
              )}
              <Toggle
                value={settings.archiveRetentionDays !== null}
                onChange={(v) => update('archiveRetentionDays', v ? 30 : null)}
              />
            </div>
          </Row>
          <Row
            label="Max items in archive"
            sublabel={
              settings.archiveMaxItems === null
                ? 'No limit'
                : `Oldest removed beyond ${settings.archiveMaxItems}`
            }
            last
          >
            <div className="flex items-center gap-2 shrink-0">
              {settings.archiveMaxItems !== null && (
                <Stepper
                  value={settings.archiveMaxItems}
                  min={10}
                  max={500}
                  step={10}
                  onChange={(v) => update('archiveMaxItems', v)}
                />
              )}
              <Toggle
                value={settings.archiveMaxItems !== null}
                onChange={(v) => update('archiveMaxItems', v ? 50 : null)}
              />
            </div>
          </Row>
        </Card>
      </div>
    </PageShell>
  )
}

function SupportSection({ onBack }: { onBack: () => void }) {
  return (
    <PageShell title="Support" onBack={onBack}>
      <Card>
        {[
          {
            label: 'Send feedback',
            href: 'https://github.com/pouyanfz/WasteLess',
          },
          {
            label: 'Report a bug',
            href: 'https://github.com/pouyanfz/WasteLess/issues',
          },
          { label: 'Privacy policy', href: '#' },
          { label: 'Contact me', href: 'mailto:pouyan.fz@gmail.com' },
        ].map((link, i, arr) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between px-4 py-3.5 text-sm text-gray-800 hover:bg-gray-50 transition-colors ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            {link.label}
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
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </a>
        ))}
      </Card>

      <div className="flex flex-col items-center gap-1 py-4">
        <p className="text-sm font-semibold text-gray-400">Wastelessful</p>
        <p className="text-xs text-gray-400">Version {version}</p>
      </div>
    </PageShell>
  )
}

// ─── Top-level list ───────────────────────────────────────────────────────────

const SECTIONS: {
  id: Section
  label: string
  color: string
  icon: React.ReactNode
  subtitle: (s: UserSettings) => string
}[] = [
  {
    id: 'account',
    label: 'Account',
    color: 'bg-blue-500',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    subtitle: () => 'Sign in to sync your data',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    color: 'bg-purple-500',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    subtitle: (s) =>
      `Theme: ${s.theme.charAt(0).toUpperCase() + s.theme.slice(1)}`,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    color: 'bg-orange-500',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    subtitle: (s) => `Warn ${s.notifyDaysBeforeExpiry}d before expiry`,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    color: 'bg-green-500',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    subtitle: (s) =>
      s.autoAddToShoppingListOnExpiry || s.autoAddToShoppingListOnLowQuantity
        ? 'Auto-add to shopping list on'
        : 'Auto-add disabled',
  },
  {
    id: 'support',
    label: 'Support',
    color: 'bg-gray-400',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    subtitle: () => 'Help, feedback & about',
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate()
  const { userDoc, updateSettings } = useAppData()
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null)

  const settings = localSettings ?? userDoc?.settings ?? null

  function update<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    if (!settings) return
    const next = { ...settings, [key]: value }
    setLocalSettings(next)
    updateSettings({ [key]: value })
  }

  if (activeSection === 'account')
    return <AccountSection onBack={() => setActiveSection(null)} />
  if (activeSection === 'appearance' && settings)
    return (
      <AppearanceSection
        settings={settings}
        update={update}
        onBack={() => setActiveSection(null)}
      />
    )
  if (activeSection === 'notifications' && settings)
    return (
      <NotificationsSection
        settings={settings}
        update={update}
        onBack={() => setActiveSection(null)}
      />
    )
  if (activeSection === 'inventory' && settings)
    return (
      <InventorySection
        settings={settings}
        update={update}
        onBack={() => setActiveSection(null)}
      />
    )
  if (activeSection === 'support')
    return <SupportSection onBack={() => setActiveSection(null)} />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {SECTIONS.map((section, i) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${
                i < SECTIONS.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`w-9 h-9 rounded-xl ${section.color} flex items-center justify-center shrink-0`}
              >
                {section.icon}
              </div>

              {/* Label + subtitle */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {section.label}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {settings ? section.subtitle(settings) : ''}
                </p>
              </div>

              {/* Chevron */}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          v{__APP_VERSION__} · build {__GIT_HASH__}
        </p>
      </div>
    </div>
  )
}
