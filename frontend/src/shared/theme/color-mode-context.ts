import { createContext, useContext } from 'react'

export type ColorMode = 'light' | 'dark' | 'system'
export type ResolvedColorMode = 'light' | 'dark'
export type ColorModeContextValue = { mode: ColorMode; resolvedMode: ResolvedColorMode; setMode: (mode: ColorMode) => void; toggleColorMode: () => void }
export const ColorModeContext = createContext<ColorModeContextValue | null>(null)
export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (!context) throw new Error('useColorMode must be used within <ColorModeProvider>')
  return context
}
