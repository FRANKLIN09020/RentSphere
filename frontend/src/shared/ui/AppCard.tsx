import { Card, CardContent } from '@mui/material'
import type { CardProps } from '@mui/material'

export function AppCard({ children, sx, ...props }: CardProps) {
  return <Card {...props} sx={[{ height: '100%' }, ...(Array.isArray(sx) ? sx : [sx])]}><CardContent>{children}</CardContent></Card>
}
