export type UserRole = 'ADMIN' | 'OWNER' | 'TENANT'

export type AuthSession = {
  token: string
  email: string
  role: UserRole
  organizationId?: string
}

export type LoginPayload = {
  email: string
  password: string
}
