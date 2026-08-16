import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { setupAxiosInterceptors } from '../../../core/api/axios'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mudar para tema dia' : 'Mudar para tema noite'}
      className="p-2 rounded-xl text-c-muted hover:text-c-primary hover:bg-bg-elevated transition-colors"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default function AppShell() {
  const { isAuthenticated, token, perfilId } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setupAxiosInterceptors(perfilId, token)
  }, [perfilId, token])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-bg-body">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-bg-card border-b border-c-border flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-c-muted hover:text-c-primary"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
