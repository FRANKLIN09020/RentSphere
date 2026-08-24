import { Alert, Box, Button, CircularProgress, Skeleton, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

export function EmptyState({ title = 'Nothing here yet', description, action, icon }: { title?: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return <Box role="status" sx={{ textAlign: 'center', px: 2, py: { xs: 5, sm: 7 }, color: 'text.secondary' }}>{icon}<Typography component="h2" variant="h6" color="text.primary" sx={{ mt: icon ? 1 : 0 }}>{title}</Typography>{description && <Typography sx={{ mt: 0.75, mx: 'auto', maxWidth: 520 }}>{description}</Typography>}{action && <Box sx={{ mt: 2 }}>{action}</Box>}</Box>
}
export function LoadingState({ label = 'Loading', rows = 3 }: { label?: string; rows?: number }) {
  return <Stack role="status" aria-live="polite" spacing={1.25} sx={{ p: 2 }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={20} /><Typography>{label}…</Typography></Stack>{Array.from({ length: rows }, (_, index) => <Skeleton key={index} height={48} />)}</Stack>
}
export function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry?: () => void }) {
  return <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>Try again</Button> : undefined}>{message}</Alert>
}
