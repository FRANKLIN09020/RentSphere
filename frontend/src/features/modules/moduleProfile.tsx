import type { ReactNode } from 'react'
import type { ModuleConfig } from './types'
import {
  AgreementIcon,
  ApartmentIcon,
  BuildingIcon,
  ComplaintIcon,
  InvoiceIcon,
  LocationIcon,
  MoneyIcon,
  OrganizationIcon,
  PeopleIcon,
  SearchIcon,
  ShieldIcon,
  UnitIcon,
} from '../../shared/ui/AppIcons'

export type ModuleCategory = 'property' | 'people' | 'financial' | 'legal' | 'maintenance' | 'inventory'

export type ModuleProfile = {
  itemLabel: string
  itemLabelPlural: string
  searchPlaceholder: string
  icon: ReactNode
  smallIcon: ReactNode
  category: ModuleCategory
}

const categoryAccents: Record<ModuleCategory, {
  gradient: string
  dotColor: string
  cardBorder: string
  accentBg: string
  badgeBg: string
}> = {
  property: {
    gradient: 'linear-gradient(135deg, var(--rs-nav-end) 0%, var(--rs-primary) 58%, var(--rs-primary-soft) 130%)',
    dotColor: 'var(--rs-primary)',
    cardBorder: 'color-mix(in srgb, var(--rs-primary) 28%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-primary) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-primary) 14%, transparent)',
  },
  people: {
    gradient: 'linear-gradient(135deg, var(--rs-nav) 0%, var(--rs-accent) 58%, var(--rs-violet) 130%)',
    dotColor: 'var(--rs-accent)',
    cardBorder: 'color-mix(in srgb, var(--rs-accent) 25%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-accent) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-accent) 12%, transparent)',
  },
  financial: {
    gradient: 'linear-gradient(135deg, var(--rs-nav) 0%, #5c3d0e 58%, var(--rs-warning) 130%)',
    dotColor: 'var(--rs-warning)',
    cardBorder: 'color-mix(in srgb, var(--rs-warning) 25%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-warning) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-warning) 12%, transparent)',
  },
  legal: {
    gradient: 'linear-gradient(135deg, var(--rs-nav) 0%, #3b1f5e 58%, var(--rs-violet) 130%)',
    dotColor: 'var(--rs-violet)',
    cardBorder: 'color-mix(in srgb, var(--rs-violet) 25%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-violet) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-violet) 12%, transparent)',
  },
  maintenance: {
    gradient: 'linear-gradient(135deg, var(--rs-nav) 0%, #4c0519 58%, var(--rs-error) 130%)',
    dotColor: 'var(--rs-error)',
    cardBorder: 'color-mix(in srgb, var(--rs-error) 25%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-error) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-error) 12%, transparent)',
  },
  inventory: {
    gradient: 'linear-gradient(135deg, var(--rs-nav-end) 0%, var(--rs-primary-hover) 58%, var(--rs-primary) 130%)',
    dotColor: 'var(--rs-primary-soft)',
    cardBorder: 'color-mix(in srgb, var(--rs-primary-soft) 28%, transparent)',
    accentBg: 'color-mix(in srgb, var(--rs-primary-soft) 8%, transparent)',
    badgeBg: 'color-mix(in srgb, var(--rs-primary-soft) 14%, transparent)',
  },
}

export function getCategoryAccent(category: ModuleCategory) {
  return categoryAccents[category]
}

export function getModuleCategory(resource: string): ModuleCategory {
  if (resource === 'properties' || resource === 'buildings') return 'property'
  if (resource === 'users' || resource === 'tenants' || resource === 'organizations') return 'people'
  if (resource === 'payments' || resource === 'invoices' || resource === 'rent-increases') return 'financial'
  if (resource === 'agreements' || resource === 'deposit-disputes') return 'legal'
  if (resource === 'complaints') return 'maintenance'
  return 'inventory'
}

export function getModuleProfile(config: ModuleConfig): ModuleProfile {
  const category = getModuleCategory(config.resource)

  if (config.resource === 'properties') {
    return {
      itemLabel: 'property',
      itemLabelPlural: 'properties',
      searchPlaceholder: 'Search name, city, address',
      icon: <ApartmentIcon />,
      smallIcon: <LocationIcon fontSize="small" />,
      category,
    }
  }

  if (config.resource === 'users') {
    return {
      itemLabel: 'user',
      itemLabelPlural: 'users',
      searchPlaceholder: 'Search name, email, role',
      icon: <PeopleIcon />,
      smallIcon: <SearchIcon fontSize="small" />,
      category,
    }
  }

  if (config.resource === 'organizations') {
    return {
      itemLabel: 'organization',
      itemLabelPlural: 'organizations',
      searchPlaceholder: 'Search name, email, address',
      icon: <OrganizationIcon />,
      smallIcon: <LocationIcon fontSize="small" />,
      category,
    }
  }

  if (config.resource === 'units') {
    return {
      itemLabel: 'unit',
      itemLabelPlural: 'units',
      searchPlaceholder: 'Search unit number, building, status',
      icon: <UnitIcon />,
      smallIcon: <BuildingIcon fontSize="small" />,
      category,
    }
  }

  if (config.resource === 'buildings') {
    return {
      itemLabel: 'building',
      itemLabelPlural: 'buildings',
      searchPlaceholder: 'Search name, property',
      icon: <BuildingIcon />,
      smallIcon: <LocationIcon fontSize="small" />,
      category,
    }
  }

  const title = config.title.toLowerCase()
  return {
    itemLabel: title.endsWith('s') ? title.slice(0, -1) : title,
    itemLabelPlural: title,
    searchPlaceholder: `Search ${title}`,
    icon: getGenericModuleIcon(config.resource),
    smallIcon: <SearchIcon fontSize="small" />,
    category,
  }
}

function getGenericModuleIcon(resource: string) {
  const icons: Record<string, ReactNode> = {
    buildings: <BuildingIcon />,
    units: <UnitIcon />,
    tenants: <PeopleIcon />,
    agreements: <AgreementIcon />,
    invoices: <InvoiceIcon />,
    payments: <MoneyIcon />,
    complaints: <ComplaintIcon />,
    'deposit-disputes': <ShieldIcon />,
    'rent-increases': <MoneyIcon />,
  }
  return icons[resource] ?? <ApartmentIcon />
}
