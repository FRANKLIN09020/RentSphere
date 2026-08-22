import { createContext } from 'react'
import type { AuthSession, LoginPayload } from './types'

export type AuthContextValue = {
  session: AuthSession | null
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
