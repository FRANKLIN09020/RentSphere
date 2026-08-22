import { useDeferredValue, useMemo, useState } from 'react'
import type { ModuleConfig, RecordData } from '../types'

export function useModuleSearch(config: ModuleConfig, records: RecordData[]) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const searchableKeys = useMemo(() => {
    return Array.from(
      new Set([...config.tableColumns, ...config.fields.map((field) => field.name), 'id']),
    )
  }, [config.fields, config.tableColumns])

  const filteredRecords = useMemo(() => {
    const search = deferredQuery.trim().toLowerCase()
    if (!search) return records

    return records.filter((record) =>
      searchableKeys.some((key) =>
        String(record[key] ?? '').toLowerCase().includes(search),
      ),
    )
  }, [deferredQuery, records, searchableKeys])

  return { query, setQuery, filteredRecords }
}
