import { useEffect, useMemo, useState } from 'react'
import { http, UNAUTHORIZED_EVENT } from '../api/http'
import { decodeSession, isExpired } from './token'
import { tokenStorage } from './tokenStorage'
import type { AuthSession, LoginPayload } from './types'
import { AuthContext } from './auth-context'

function loadSession() {
  const token = tokenStorage.getToken()
  if (!token || isExpired(token)) {
    tokenStorage.removeToken()
    return null
  }
  return decodeSession(token)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  async function login(payload: LoginPayload) {
    const response = await http.post<{ token: string }>('/auth/login', payload)
    tokenStorage.setToken(response.data.token)
    setSession(decodeSession(response.data.token))
  }

  function logout() {
    tokenStorage.removeToken()
    setSession(null)
  }

  useEffect(() => {
    function onUnauthorized() {
      setSession(null)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
