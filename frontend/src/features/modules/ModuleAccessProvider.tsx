import type { ReactNode } from 'react'
import { useAuth } from '../../shared/auth/useAuth'
import { visibleModules } from './moduleAccess'
import { moduleConfigs } from './moduleConfigs'
import { ModuleAccessContext } from './module-access-context'

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const role = session?.role
  const modules = visibleModules(role, moduleConfigs)
  const loading = false

  return <ModuleAccessContext.Provider value={{ modules, loading }}>{children}</ModuleAccessContext.Provider>
}
