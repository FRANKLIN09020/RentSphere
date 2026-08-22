import { useContext } from 'react'
import { ModuleAccessContext } from './module-access-context'

export function useModuleAccess() {
  return useContext(ModuleAccessContext)
}
