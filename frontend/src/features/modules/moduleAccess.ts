import type { UserRole } from '../../shared/auth/types'
import type { ModuleConfig } from './types'

const adminModules = new Set(['organizations', 'users', 'properties', 'buildings', 'units', 'tenants', 'agreements', 'invoices', 'payments', 'complaints', 'deposit-disputes', 'rent-increases', 'applications-approvals'])

// Owners operate rental records inside their organization. Platform identity and
// organization administration are reserved for administrators.
const ownerModules = new Set(['properties', 'buildings', 'units', 'tenants', 'agreements', 'invoices', 'complaints', 'deposit-disputes', 'rent-increases', 'applications-approvals'])

// Keep the tenant workspace focused on frequent self-service tasks. Apartment
// discovery owns property/unit browsing, payments owns invoices, and approval
// status owns request tracking. Disputes and rent administration remain staff
// workflows instead of exposing management-style modules to tenants.
const tenantModules = new Set(['payments', 'complaints', 'deposit-disputes', 'rent-increases'])

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

export function canReadModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  if (role === 'ADMIN') return adminModules.has(resource)
  if (role === 'OWNER') return ownerModules.has(resource)
  if (role === 'TENANT') return tenantModules.has(resource)
  return false
}

export function canCreateModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  // Payments are created only by the verified Razorpay checkout flow.
  if (resource === 'payments') return false
  if (role === 'ADMIN') return adminModules.has(resource)
  if (role === 'OWNER') return ownerModules.has(resource)
  if (role === 'TENANT') return resource === 'complaints'
  return false
}

export function canManageModule(role: UserRole | undefined, resource: string) {
  if (!role) return false
  // Owners cannot alter the payment ledger, but administrators retain cleanup access.
  if (resource === 'payments') return role === 'ADMIN'
  if (role === 'ADMIN') return adminModules.has(resource)
  if (role === 'OWNER') return ownerModules.has(resource)
  return false
}

export function canEditModule(role: UserRole | undefined, resource: string) {
  if (role === 'TENANT' && resource === 'rent-increases') return true
  return canManageModule(role, resource)
}

export function visibleModules(role: UserRole | undefined, modules: ModuleConfig[]) {
  return modules.filter((module) => canReadModule(role, module.resource))
}

export function moduleSortOrder(resource: string) {
  const index = moduleOrder.indexOf(resource)
  return index === -1 ? moduleOrder.length : index
}
