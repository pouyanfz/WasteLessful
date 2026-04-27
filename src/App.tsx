import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import loadingAnimation from './assets/loadingAnimation.gif'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import ItemsPage from './pages/ItemsPage'
import ShoppingListPage from './pages/ShoppingListPage'
import RecipesPage from './pages/RecipesPage'
import SettingsPage from './pages/SettingsPage'
import JoinPage from './pages/JoinPage'
import BottomNav from './components/BottomNav'

function applyTheme(theme: string) {
  const dark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('wl_theme', theme)
}

function ThemeWatcher() {
  const { userDoc } = useAppData()
  const theme = userDoc?.settings.theme ?? 'system'

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return null
}

function ConditionalBottomNav() {
  const { pathname } = useLocation()
  if (pathname === '/join') return null
  return <BottomNav />
}

function AppShell() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <img src={loadingAnimation} alt="" className="w-16 h-16" />
          <p className="text-sm text-gray-400">Loading Wastelessful…</p>
        </div>
      </div>
    )
  }

  return (
    <AppDataProvider>
      <ThemeWatcher />
      <BrowserRouter>
        {/* Full-screen flex column: content scrolls, nav sits below it — no fixed overlap */}
        <div className="flex flex-col h-dvh bg-white dark:bg-gray-900">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <Routes>
              <Route path="/" element={<ItemsPage />} />
              <Route path="/shopping" element={<ShoppingListPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/join" element={<JoinPage />} />
            </Routes>
          </div>
          <ConditionalBottomNav />
        </div>
      </BrowserRouter>
    </AppDataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
