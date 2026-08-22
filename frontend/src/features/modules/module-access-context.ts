import { createContext } from 'react'
import type { ModuleConfig } from './types'

export type ModuleAccessValue = {
  modules: ModuleConfig[]
  loading: boolean
}

export const ModuleAccessContext = createContext<ModuleAccessValue>({ modules: [], loading: false })
