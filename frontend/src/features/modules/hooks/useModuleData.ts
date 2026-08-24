import { useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage, http } from '../../../shared/api/http'
import { useAuth } from '../../../shared/auth/useAuth'
import type { ModuleConfig, RecordData } from '../types'
import { getReferenceResource } from '../referenceUtils'

type ReferenceData = Record<string, RecordData[]>

export function useModuleData(config: ModuleConfig) {
  const { session } = useAuth()
  const role = session?.role
  const [records, setRecords] = useState<RecordData[]>([])
  const [references, setReferences] = useState<ReferenceData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const referenceResources = useMemo(() => {
    const names = [...config.fields.map((field) => field.name), ...config.tableColumns]
    return Array.from(new Set(names.map(getReferenceResource).filter(Boolean)))
  }, [config.fields, config.tableColumns])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const tenantOwnedResources = new Set(['invoices', 'payments', 'complaints', 'deposit-disputes', 'rent-increases'])
      const endpoint = role === 'TENANT' && tenantOwnedResources.has(config.resource)
        ? `/${config.resource}/me`
        : `/${config.resource}`
      const response = await http.get<RecordData[]>(endpoint)
      setRecords(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [config.resource, role])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadRecords()
    }, 0)
    const timer = window.setInterval(() => {
      void loadRecords()
    }, 15000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [loadRecords])

  useEffect(() => {
    let cancelled = false

    if (!referenceResources.length) {
      Promise.resolve().then(() => {
        if (!cancelled) setReferences({})
      })
      return () => { cancelled = true }
    }

    async function loadReferences() {
      if (session?.role === 'TENANT') {
        const [profileResult, tenantResult] = await Promise.allSettled([
          http.get<RecordData>('/auth/me'),
          http.get<RecordData>('/tenants/me'),
        ])
        if (cancelled) return
        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : undefined
        const tenant = tenantResult.status === 'fulfilled' ? tenantResult.value.data : undefined
        const organizationId = profile?.organizationId ?? tenant?.organizationId
        let unit: RecordData | undefined
        if (tenant?.unitId) {
          try {
            unit = (await http.get<RecordData>(`/units/${tenant.unitId}`)).data
          } catch {
            unit = undefined
          }
        }
        if (!cancelled) {
          setReferences({
            organizations: organizationId ? [{
              id: organizationId,
              name: profile?.organizationName ?? 'My organization',
            }] : [],
            tenants: tenant ? [tenant] : [],
            units: unit ? [unit] : [],
          })
        }
        return
      }
      const results = await Promise.allSettled(
        referenceResources.map(async (resource) => {
          const response = await http.get<RecordData[]>(`/${resource}`)
          return [resource, response.data] as const
        }),
      )
      if (!cancelled) {
        setReferences(Object.fromEntries(
          results
            .filter((result): result is PromiseFulfilledResult<readonly [string, RecordData[]]> => result.status === 'fulfilled')
            .map((result) => result.value),
        ))
      }
    }

    void loadReferences()
    return () => { cancelled = true }
  }, [referenceResources, session])

  return { records, references, loading, error, lastUpdated, loadRecords }
}
