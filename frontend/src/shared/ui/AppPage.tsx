import { Box, Container } from '@mui/material'
import type { BoxProps } from '@mui/material'

export function AppPage({ children, sx, ...props }: BoxProps) {
  return <Box {...props} sx={[{ py: { xs: 2, sm: 3, lg: 4 } }, ...(Array.isArray(sx) ? sx : [sx])]}><Container maxWidth="xl">{children}</Container></Box>
}
