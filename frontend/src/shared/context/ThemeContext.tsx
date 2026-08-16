import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeKey = 'noite' | 'dia'

export interface ThemeDefinition {
  key: ThemeKey
  label: string
  dark: boolean
  preview: string
  accent: string
  description: string
}

export const THEMES: ThemeDefinition[] = [
  {
    key: 'noite',
    label: 'Noite',
    dark: true,
    preview: '#0d0d0f',
    accent: '#3D7DFA',
    description: 'Quadro de partidas à noite — grafite e âmbar',
  },
  {
    key: 'dia',
    label: 'Dia',
    dark: false,
    preview: '#e7e8ea',
    accent: '#1F55C4',
    description: 'Alumínio escovado sob luz de terminal diurno',
  },
]

const OLD_DARK_KEYS = new Set(['slate-dark', 'midnight-blue', 'forest', 'obsidian', 'crimson'])

interface ThemeContextValue {
  themeKey: ThemeKey
  themeDefinition: ThemeDefinition
  setTheme: (key: ThemeKey) => void
  isDark: boolean
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DEFAULT_THEME: ThemeKey = 'noite'

function resolveInitialTheme(): ThemeKey {
  const saved = localStorage.getItem('appTheme')
  if (saved === 'noite' || saved === 'dia') return saved
  if (saved) return OLD_DARK_KEYS.has(saved) ? 'noite' : 'dia'
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(resolveInitialTheme)
  const themeDefinition = THEMES.find(t => t.key === theme)!

  useEffect(() => {
    const el = document.documentElement
    Array.from(el.classList).forEach(cls => {
      if (cls.startsWith('theme-')) el.classList.remove(cls)
    })
    el.classList.add(`theme-${theme}`)
    el.classList.toggle('dark', themeDefinition.dark)
    localStorage.setItem('appTheme', theme)
  }, [theme, themeDefinition.dark])

  const setTheme = (key: ThemeKey) => setThemeState(key)
  const toggleTheme = () => setTheme(theme === 'noite' ? 'dia' : 'noite')

  return (
    <ThemeContext.Provider value={{
      themeKey: theme,
      themeDefinition,
      setTheme,
      isDark: themeDefinition.dark,
      theme: themeDefinition.dark ? 'dark' : 'light',
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
