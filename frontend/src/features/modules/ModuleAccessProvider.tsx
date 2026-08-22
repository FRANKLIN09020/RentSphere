import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import { visibleModules } from './moduleAccess'
import { moduleConfigs } from './moduleConfigs'
import { ModuleAccessContext } from './module-access-context'
import type { ModuleConfig } from './types'

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const role = session?.role
  const isOwner = role === 'OWNER'

  const [ownerState, setOwnerState] = useState<{ modules: ModuleConfig[]; loading: boolean }>({
    modules: [],
    loading: true,
  })

  const modules = isOwner ? ownerState.modules : visibleModules(role, moduleConfigs)
  const loading = isOwner ? ownerState.loading : false

  useEffect(() => {
    if (!isOwner) return

    let cancelled = false
    async function loadRelatedModules() {
      setOwnerState({ modules: [], loading: true })
      const allowed = visibleModules(role, moduleConfigs)
      const results = await Promise.allSettled(
        allowed.map(async (module) => {
          const response = await http.get<unknown[]>(`/${module.resource}`)
          return { resource: module.resource, count: Array.isArray(response.data) ? response.data.length : 0 } as const
        }),
      )
      if (cancelled) return
      const withData = new Set(
        results
          .filter((result): result is PromiseFulfilledResult<{ readonly resource: string; readonly count: number }> =>
            result.status === 'fulfilled' && result.value.count > 0)
          .map((result) => result.value.resource),
      )
      setOwnerState({ modules: allowed.filter((module) => withData.has(module.resource)), loading: false })
    }
    void loadRelatedModules()
    return () => {
      cancelled = true
    }
  }, [isOwner, role])

  return <ModuleAccessContext.Provider value={{ modules, loading }}>{children}</ModuleAccessContext.Provider>
}
