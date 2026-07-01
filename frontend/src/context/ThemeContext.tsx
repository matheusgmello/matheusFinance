import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeKey =
  | 'slate-dark'
  | 'midnight-blue'
  | 'forest'
  | 'obsidian'
  | 'crimson'
  | 'cloud'
  | 'sage'
  | 'lavender'
  | 'sand'
  | 'arctic'

export interface ThemeDefinition {
  key: ThemeKey
  label: string
  dark: boolean          // adiciona class "dark" no <html>
  preview: string        // cor de fundo para o preview
  accent: string         // cor de destaque para o preview
  description: string
}

export const THEMES: ThemeDefinition[] = [
  {
    key: 'slate-dark',
    label: 'Slate Dark',
    dark: true,
    preview: '#0f172a',
    accent: '#10b981',
    description: 'Escuro clássico com verde esmeralda',
  },
  {
    key: 'midnight-blue',
    label: 'Midnight Blue',
    dark: true,
    preview: '#0a0e28',
    accent: '#0ea5e9',
    description: 'Azul profundo da meia-noite',
  },
  {
    key: 'forest',
    label: 'Forest',
    dark: true,
    preview: '#05140c',
    accent: '#10b981',
    description: 'Verde floresta escuro e profundo',
  },
  {
    key: 'obsidian',
    label: 'Obsidian',
    dark: true,
    preview: '#09090b',
    accent: '#8b5cf6',
    description: 'Cinza carvão com destaque violeta',
  },
  {
    key: 'crimson',
    label: 'Crimson',
    dark: true,
    preview: '#19050a',
    accent: '#f43f5e',
    description: 'Bordô escuro com destaque carmesim',
  },
  {
    key: 'cloud',
    label: 'Cloud',
    dark: false,
    preview: '#f8fafc',
    accent: '#3b82f6',
    description: 'Claro e minimalista com azul limpo',
  },
  {
    key: 'sage',
    label: 'Sage',
    dark: false,
    preview: '#f0fdf4',
    accent: '#14b8a6',
    description: 'Verde sálvia suave e natural',
  },
  {
    key: 'lavender',
    label: 'Lavender',
    dark: false,
    preview: '#faf5ff',
    accent: '#8b5cf6',
    description: 'Lilás delicado com destaque violeta',
  },
  {
    key: 'sand',
    label: 'Sand',
    dark: false,
    preview: '#fffbeb',
    accent: '#f59e0b',
    description: 'Areia quente com destaque âmbar',
  },
  {
    key: 'arctic',
    label: 'Arctic',
    dark: false,
    preview: '#f0f9ff',
    accent: '#0ea5e9',
    description: 'Azul gelo claro e sereno',
  },
]

// compat: exporta AccentColor e ACCENT_THEMES para não quebrar outros imports
export type AccentColor = ThemeKey
export const ACCENT_THEMES = THEMES.map(t => ({
  key: t.key,
  label: t.label,
  color: t.accent,
}))

interface ThemeContextValue {
  themeKey: ThemeKey        // chave completa do tema (ex: 'slate-dark')
  themeDefinition: ThemeDefinition
  setTheme: (key: ThemeKey) => void
  isDark: boolean
  // compat: 'light' | 'dark' para componentes que usam theme === 'dark'
  theme: 'light' | 'dark'
  accentColor: ThemeKey
  setAccentColor: (c: ThemeKey) => void
  toggleTheme: () => void
  themeMode: 'light' | 'dark'
  setThemeMode: (m: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DEFAULT_THEME: ThemeKey = 'slate-dark'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem('appTheme') as ThemeKey | null
    // migração: se havia accentColor + themeMode antigos, mapear para tema
    if (!saved) {
      const oldMode = localStorage.getItem('themeMode')
      const oldAccent = localStorage.getItem('accentColor')
      if (oldMode === 'light') {
        return oldAccent === 'amber' ? 'sand'
          : oldAccent === 'sky' || oldAccent === 'cyan' ? 'arctic'
          : oldAccent === 'violet' || oldAccent === 'indigo' ? 'lavender'
          : 'cloud'
      }
      // dark
      return oldAccent === 'violet' || oldAccent === 'indigo' ? 'obsidian'
        : oldAccent === 'rose' || oldAccent === 'pink' ? 'crimson'
        : oldAccent === 'sky' || oldAccent === 'blue' || oldAccent === 'cyan' ? 'midnight-blue'
        : 'slate-dark'
    }
    return THEMES.find(t => t.key === saved) ? saved : DEFAULT_THEME
  })

  const themeDefinition = THEMES.find(t => t.key === theme)!

  // Aplica a classe do tema e dark no <html>
  useEffect(() => {
    const el = document.documentElement
    // remove todos os temas antigos (accent e novos)
    const allClasses = Array.from(el.classList)
    allClasses.forEach(cls => {
      if (cls.startsWith('theme-')) el.classList.remove(cls)
    })
    el.classList.add(`theme-${theme}`)
    el.classList.toggle('dark', themeDefinition.dark)
    localStorage.setItem('appTheme', theme)
  }, [theme, themeDefinition.dark])

  const setTheme = (key: ThemeKey) => setThemeState(key)

  // compat
  const toggleTheme = () => {
    setTheme(themeDefinition.dark ? 'cloud' : 'slate-dark')
  }
  const isDark = themeDefinition.dark

  return (
    <ThemeContext.Provider value={{
      themeKey: theme,
      themeDefinition,
      setTheme,
      isDark,
      theme: isDark ? 'dark' : 'light',   // compat para theme === 'dark'
      accentColor: theme,
      setAccentColor: setTheme,
      toggleTheme,
      themeMode: isDark ? 'dark' : 'light',
      setThemeMode: (m) => setTheme(m === 'dark' ? 'slate-dark' : 'cloud'),
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
