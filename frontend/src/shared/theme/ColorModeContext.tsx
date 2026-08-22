import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createTheme, ThemeProvider, responsiveFontSizes } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type ColorMode = 'light' | 'dark'
const STORAGE_KEY = 'rentsphere-color-mode'

type ColorModeContextValue = {
  mode: ColorMode
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null)

export function useColorMode() {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used within <ColorModeProvider>')
  return ctx
}

function getInitialMode(): ColorMode {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Build the MUI theme for a given mode. Keep RentSphere's teal/emerald identity
// in both modes so the brand doesn't shift, only the surface/text tokens invert.
function buildTheme(mode: ColorMode) {
  return responsiveFontSizes(
    createTheme({
      palette: {
        mode,
        primary: { main: '#0d9488', dark: '#0f766e', light: '#2dd4bf' },
        secondary: { main: '#7c3aed' },
        success: { main: '#22c55e' },
        ...(mode === 'light'
          ? {
              background: { default: '#f5f7fa', paper: '#ffffff' },
            }
          : {
              background: { default: '#0b1220', paper: '#111a2e' },
              text: { primary: '#e5e7eb', secondary: '#9fb0c7' },
            }),
      },
      shape: { borderRadius: 10 },
      typography: {
        fontFamily: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      },
    }),
  )
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(getInitialMode)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
    document.documentElement.setAttribute('data-color-scheme', mode)
  }, [mode])

  const value = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [mode],
  )

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}