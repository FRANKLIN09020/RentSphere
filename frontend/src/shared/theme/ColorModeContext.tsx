import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from '../../app/theme'
import { ColorModeContext } from './color-mode-context'
import type { ColorMode, ColorModeContextValue, ResolvedColorMode } from './color-mode-context'

const STORAGE_KEY = 'rentsphere-color-mode'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'
function storedMode(): ColorMode {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}
function systemMode(): ResolvedColorMode { return typeof window !== 'undefined' && window.matchMedia?.(MEDIA_QUERY).matches ? 'dark' : 'light' }

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(storedMode)
  const [preferredMode, setPreferredMode] = useState<ResolvedColorMode>(systemMode)
  const resolvedMode = mode === 'system' ? preferredMode : mode
  useEffect(() => {
    const media = window.matchMedia(MEDIA_QUERY)
    const onChange = (event: MediaQueryListEvent) => setPreferredMode(event.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.dataset.colorScheme = resolvedMode
    document.documentElement.style.colorScheme = resolvedMode
  }, [mode, resolvedMode])
  const value = useMemo<ColorModeContextValue>(() => ({ mode, resolvedMode, setMode, toggleColorMode: () => setMode(resolvedMode === 'light' ? 'dark' : 'light') }), [mode, resolvedMode])
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode])
  return <ColorModeContext.Provider value={value}><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></ColorModeContext.Provider>
}
