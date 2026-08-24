import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export function PageHeader({ title, eyebrow, actions }: { title: string; description?: string; eyebrow?: string; actions?: ReactNode }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' }, mb: 3 }}>
    <Box>{eyebrow && <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>{eyebrow}</Typography>}<Typography component="h1" variant="h4">{title}</Typography></Box>
    {actions && <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>{actions}</Stack>}
  </Stack>
}
