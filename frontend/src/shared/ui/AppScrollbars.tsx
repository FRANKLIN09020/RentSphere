import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

const scrollbarOptions = (axis: 'x' | 'y') => ({
  overflow: {
    x: axis === 'x' ? 'scroll' as const : 'hidden' as const,
    y: axis === 'y' ? 'scroll' as const : 'hidden' as const,
  },
  scrollbars: {
    theme: 'os-theme-rentsphere',
    visibility: 'auto' as const,
    autoHide: 'scroll' as const,
    autoHideDelay: 650,
    dragScroll: true,
    clickScroll: true,
  },
})

export function AppScrollbars({ children }: { children: ReactNode }) {
  return children
}

export function AppScrollbar({
  children,
  axis = 'y',
  sx,
}: {
  children: ReactNode
  axis?: 'x' | 'y'
  sx?: SxProps<Theme>
}) {
  return (
    <OverlayScrollbarsComponent
      element={Box}
      options={scrollbarOptions(axis)}
      defer
      sx={sx}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}
