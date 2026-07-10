import { useContext } from 'react'
import { ProfileContext } from '../../shared/context/ProfileContext'

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
