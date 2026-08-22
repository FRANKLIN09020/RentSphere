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
  eyebrow: string
  title: string
  description: string
  inventoryTitle: string
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
    gradient: 'linear-gradient(135deg, #042f2e 0%, #0f766e 58%, #2dd4bf 130%)',
    dotColor: '#14b8a6',
    cardBorder: 'rgba(20,184,166,0.28)',
    accentBg: 'rgba(20,184,166,0.08)',
    badgeBg: 'rgba(20,184,166,0.14)',
  },
  people: {
    gradient: 'linear-gradient(135deg, #0b1220 0%, #1e3a5f 58%, #7c3aed 130%)',
    dotColor: '#6366f1',
    cardBorder: 'rgba(99,102,241,0.25)',
    accentBg: 'rgba(99,102,241,0.08)',
    badgeBg: 'rgba(99,102,241,0.12)',
  },
  financial: {
    gradient: 'linear-gradient(135deg, #0b1220 0%, #5c3d0e 58%, #d97706 130%)',
    dotColor: '#f59e0b',
    cardBorder: 'rgba(245,158,11,0.25)',
    accentBg: 'rgba(245,158,11,0.08)',
    badgeBg: 'rgba(245,158,11,0.12)',
  },
  legal: {
    gradient: 'linear-gradient(135deg, #0b1220 0%, #3b1f5e 58%, #8b5cf6 130%)',
    dotColor: '#a78bfa',
    cardBorder: 'rgba(139,92,246,0.25)',
    accentBg: 'rgba(139,92,246,0.08)',
    badgeBg: 'rgba(139,92,246,0.12)',
  },
  maintenance: {
    gradient: 'linear-gradient(135deg, #0b1220 0%, #4c0519 58%, #f43f5e 130%)',
    dotColor: '#fb7185',
    cardBorder: 'rgba(244,63,94,0.25)',
    accentBg: 'rgba(244,63,94,0.08)',
    badgeBg: 'rgba(244,63,94,0.12)',
  },
  inventory: {
    gradient: 'linear-gradient(135deg, #042f2e 0%, #134e4a 58%, #14b8a6 130%)',
    dotColor: '#2dd4bf',
    cardBorder: 'rgba(45,212,191,0.28)',
    accentBg: 'rgba(45,212,191,0.08)',
    badgeBg: 'rgba(45,212,191,0.14)',
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
      eyebrow: 'Portfolio',
      title: 'Property Management',
      description: 'Manage property details, photos, and location information in one place.',
      inventoryTitle: 'Property inventory',
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
      eyebrow: 'Access',
      title: 'User Management',
      description: 'Manage people, login identities, roles, and contact information.',
      inventoryTitle: 'User directory',
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
      eyebrow: 'Operations',
      title: 'Organization Management',
      description: 'Keep company and family rental groups organized with contact and address records.',
      inventoryTitle: 'Organization registry',
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
      eyebrow: 'Inventory',
      title: 'Unit Management',
      description: 'Track every rentable unit, its rent, occupancy status, and the building it belongs to.',
      inventoryTitle: 'Unit inventory',
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
      eyebrow: 'Portfolio',
      title: 'Building Management',
      description: 'Manage buildings, their floor counts, and the property each one belongs to.',
      inventoryTitle: 'Building inventory',
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
    eyebrow: 'Module',
    title: `${config.title} Management`,
    description: config.description,
    inventoryTitle: `${config.title} records`,
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
