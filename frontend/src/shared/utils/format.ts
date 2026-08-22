import type { ReactNode } from 'react'

export function formatRole(role?: string) {
  if (!role) return 'User'
  return role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatMoney(value: unknown) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '-'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export function getInitials(value: string) {
  const initials = value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return initials || 'RF'
}

export function getEmailInitials(email?: string) {
  return String(email ?? 'RF')
    .split('@')[0]
    .split(/[.\-_]/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RF'
}

export function getRoleColor(role?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (role === 'ADMIN') return 'primary'
  if (role === 'OWNER') return 'info'
  if (role === 'TENANT') return 'success'
  return 'default'
}

export function getModuleIcon(resource: string, icons: Record<string, ReactNode>): ReactNode {
  return icons[resource] ?? null
}

export function formatDate(value: unknown) {
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return 'recently'
  return date.toLocaleDateString()
}

export function toTitle(value: string) {
  return value
    .replace(/Id$/, ' ID')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

export function getStatusColor(status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (['PAID', 'SUCCESS', 'RESOLVED', 'ACTIVE', 'AVAILABLE', 'ADMIN', 'OWNER'].includes(status)) return 'success'
  if (['PENDING', 'OPEN', 'IN_PROGRESS', 'TENANT', 'Needs photo'].includes(status)) return 'warning'
  if (['FAILED', 'OVERDUE', 'TERMINATED', 'REJECTED', 'MAINTENANCE'].includes(status)) return 'error'
  return 'primary'
}

export function formatDetail(value: unknown) {
  if (value == null || value === '') return '-'
  const text = String(value)
  if (/^\d+(\.\d+)?$/.test(text) && Number(text) >= 100) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(text))
  }
  if (text.length > 24) return `${text.slice(0, 22)}...`
  return text
}
