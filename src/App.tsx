import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import loadingAnimation from './assets/loadingAnimation.gif'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppDataProvider } from './context/AppDataContext'
import ItemsPage from './pages/ItemsPage'
import ShoppingListPage from './pages/ShoppingListPage'
import RecipesPage from './pages/RecipesPage'
import SettingsPage from './pages/SettingsPage'
import JoinPage from './pages/JoinPage'
import BottomNav from './components/BottomNav'

function ConditionalBottomNav() {
  const { pathname } = useLocation()
  if (pathname === '/join') return null
  return <BottomNav />
}

function AppShell() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <img src={loadingAnimation} alt="" className="w-16 h-16" />
          <p className="text-sm text-gray-400">Loading Wastelessful…</p>
        </div>
      </div>
    )
  }

  return (
    <AppDataProvider>
      <BrowserRouter>
        {/* Full-screen flex column: content scrolls, nav sits below it — no fixed overlap */}
        <div className="flex flex-col h-dvh">
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
