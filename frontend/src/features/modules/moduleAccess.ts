import type { UserRole } from '../../shared/auth/types'
import type { ModuleConfig } from './types'

// Management tier - ADMIN and OWNER share identical, full access to every module.
const managementModules = new Set(['organizations', 'users', 'properties', 'buildings', 'units', 'tenants', 'agreements', 'invoices', 'payments', 'complaints', 'deposit-disputes', 'rent-increases', 'applications-approvals'])

// Tenant modules - own record, browsing, and self-service workflows
const tenantModules = new Set(['properties', 'units', 'complaints', 'deposit-disputes', 'rent-increases', 'invoices', 'payments', 'applications-approvals'])

const moduleOrder = [
  'organizations',
  'users',
  'properties',
  'buildings',
  'units',
  'tenants',
  'agreements',
  'invoices',
  'payments',
  'complaints',
  'deposit-disputes',
  'rent-increases',
  'applications-approvals',
]

function isManager(role: UserRole | undefined) {
  return role === 'ADMIN' || role === 'OWNER'
}

export function canReadModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  if (isManager(role)) return managementModules.has(resource)
  if (role === 'TENANT') return tenantModules.has(resource)
  return false
}

export function canCreateModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  // Payments are created only by the verified Razorpay checkout flow.
  if (resource === 'payments') return false
  if (isManager(role)) return managementModules.has(resource)
  if (role === 'TENANT') return ['complaints', 'deposit-disputes'].includes(resource)
  return false
}

export function canManageModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  // Payment ledger entries are immutable from the UI.
  if (resource === 'payments') return false
  if (isManager(role)) return managementModules.has(resource)
  return false
}

export function canEditModule(role: UserRole | undefined, resource: string) {
  return canManageModule(role, resource) || (role === 'TENANT' && resource === 'rent-increases')
}

export function visibleModules(role: UserRole | undefined, modules: ModuleConfig[]) {
  return modules.filter((module) => canReadModule(role, module.resource))
}

export function moduleSortOrder(resource: string) {
  const index = moduleOrder.indexOf(resource)
  return index === -1 ? moduleOrder.length : index
}
