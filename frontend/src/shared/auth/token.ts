import type { UserRole } from './types'

type JwtPayload = {
  sub?: string
  role?: UserRole
  organizationId?: string
  exp?: number
}

export function decodeSession(token: string) {
  const payload = decodeJwt(token)
  return {
    token,
    email: payload.sub ?? 'user',
    role: payload.role ?? 'TENANT',
    organizationId: payload.organizationId ?? undefined,
  }
}

export function isExpired(token: string) {
  const payload = decodeJwt(token)
  if (!payload.exp) return false
  return payload.exp * 1000 < Date.now()
}

function decodeJwt(token: string): JwtPayload {
  const [, payload] = token.split('.')
  if (!payload) return {}

  try {
    return JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/')))
  } catch {
    return {}
  }
}
