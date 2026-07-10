import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Menu, Palette } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useTheme, THEMES, ThemeKey } from '../../context/ThemeContext'
import { setupAxiosInterceptors } from '../../../core/api/axios'

function ThemePopover() {
  const { themeKey: theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const darkThemes = THEMES.filter(t => t.dark)
  const lightThemes = THEMES.filter(t => !t.dark)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Trocar tema"
        className={`p-2 rounded-xl transition-colors ${
          open
            ? 'bg-bg-elevated text-c-primary'
            : 'text-c-muted hover:text-c-primary hover:bg-bg-elevated'
        }`}
      >
        <Palette size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-bg-card border border-c-border rounded-2xl shadow-xl z-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-c-muted uppercase tracking-wider">
            Escolha o tema
          </p>

          <div>
            <p className="text-xs text-c-muted mb-2">Escuros</p>
            <div className="grid grid-cols-5 gap-2">
              {darkThemes.map(t => (
                <button
                  key={t.key}
                  title={t.label}
                  onClick={() => { setTheme(t.key as ThemeKey); setOpen(false) }}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                    theme === t.key
                      ? 'ring-2 ring-accent-500 bg-accent-500/10'
                      : 'hover:bg-bg-elevated'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-white/10 flex-shrink-0"
                    style={{ backgroundColor: t.preview }}
                  >
                    <div
                      className="w-3 h-1.5 rounded-sm mt-1.5 ml-1"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  <span className="text-[11px] text-c-muted leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-c-border" />

          <div>
            <p className="text-xs text-c-muted mb-2">Claros</p>
            <div className="grid grid-cols-5 gap-2">
              {lightThemes.map(t => (
                <button
                  key={t.key}
                  title={t.label}
                  onClick={() => { setTheme(t.key as ThemeKey); setOpen(false) }}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                    theme === t.key
                      ? 'ring-2 ring-accent-500 bg-accent-500/10'
                      : 'hover:bg-bg-elevated'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-black/10 flex-shrink-0"
                    style={{ backgroundColor: t.preview }}
                  >
                    <div
                      className="w-3 h-1.5 rounded-sm mt-1.5 ml-1"
                      style={{ backgroundColor: t.accent }}
                    />
                  </div>
                  <span className="text-[11px] text-c-muted leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const { isAuthenticated, token, perfilId } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setupAxiosInterceptors(perfilId, token)
  }, [perfilId, token])

  // TEMP: bypass login para testes
  // if (!isAuthenticated) return <Navigate to="/login" replace />

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
          <ThemePopover />
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
