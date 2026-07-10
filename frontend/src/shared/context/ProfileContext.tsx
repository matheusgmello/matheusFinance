import React, { createContext, useContext, useState, useEffect } from 'react'
import { Profile } from '../../core/types'

interface ProfileContextValue {
  activeProfile: Profile | null
  setActiveProfile: (p: Profile | null) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<Profile | null>(() => {
    const stored = localStorage.getItem('activeProfile')
    if (stored) return JSON.parse(stored)
    // TEMP: admin default pra testes
    return { id: 1, nome: 'Admin', criadoEm: new Date().toISOString() }
  })

  useEffect(() => {
    if (activeProfile) localStorage.setItem('activeProfile', JSON.stringify(activeProfile))
    else localStorage.removeItem('activeProfile')
  }, [activeProfile])

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
