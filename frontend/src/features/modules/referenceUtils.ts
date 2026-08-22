import { formatMoney } from '../../shared/utils/format'
import type { RecordData } from './types'

type ReferenceData = Record<string, RecordData[]>

const referenceResourceMap: Record<string, string> = {
  organizationId: 'organizations',
  ownerId: 'users',
  userId: 'users',
  tenantId: 'tenants',
  unitId: 'units',
  buildingId: 'buildings',
  propertyId: 'properties',
  agreementId: 'agreements',
  invoiceId: 'invoices',
}

export function getReferenceResource(name: string): string | undefined {
  return referenceResourceMap[name]
}

export function getReferenceLabel(fieldName: string, value: unknown, references: ReferenceData): string {
  const resource = getReferenceResource(fieldName)
  if (!resource || value == null || value === '') return ''
  const record = references[resource]?.find((item) => String(item.id) === String(value))
  return record ? getReferenceRecordLabel(resource, record, references) : ''
}

export function getReferenceRecordLabel(resource: string, record: RecordData, references: ReferenceData): string {
  if (resource === 'organizations') return String(record.name ?? 'Organization')
  if (resource === 'users') return [record.name, record.email].map((value) => String(value ?? '').trim()).filter(Boolean).join(' | ') || 'User'
  if (resource === 'tenants') return String(record.fullName ?? record.phone ?? 'Tenant')
  if (resource === 'properties') return String(record.name ?? 'Property')
  if (resource === 'buildings') return String(record.name ?? 'Building')
  if (resource === 'units') return `Unit ${String(record.unitNumber ?? '-')}${record.rentAmount ? ` | ${formatMoney(Number(record.rentAmount))}` : ''}`
  if (resource === 'agreements') {
    const tenant: string = getReferenceLabel('tenantId', record.tenantId, references)
    const unit: string = getReferenceLabel('unitId', record.unitId, references)
    return [tenant || 'Agreement', unit, record.startDate as string].filter(Boolean).join(' | ')
  }
  if (resource === 'invoices') {
    const tenant: string = getReferenceLabel('tenantId', record.tenantId, references)
    return [tenant || 'Invoice', record.amount ? formatMoney(Number(record.amount)) : '', record.dueDate as string].filter(Boolean).join(' | ')
  }
  return String(record.name ?? record.title ?? record.id ?? resource)
}
