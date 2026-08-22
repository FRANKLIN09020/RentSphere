import { Box } from '@mui/material'
import { useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'

export function AmbientBackdrop() {
  return (
    <Box className="ambient-backdrop" aria-hidden="true">
      <span className="ambient-orb ambient-orb-one" />
      <span className="ambient-orb ambient-orb-two" />
      <span className="ambient-grid" />
    </Box>
  )
}

export function PageMotion({ children }: { children: ReactNode }) {
  return <Box className="page-motion">{children}</Box>
}

export function SpotlightSurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  function moveSpotlight(event: MouseEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || !ref.current) return
    ref.current.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
    ref.current.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
  }

  return (
    <Box ref={ref} className={`spotlight-surface ${className}`} onMouseMove={moveSpotlight}>
      {children}
    </Box>
  )
}
