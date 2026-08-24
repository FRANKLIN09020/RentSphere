import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'

const statusColors: Record<string, ChipProps['color']> = {
  active: 'success', available: 'success', accepted: 'success', approved: 'success', paid: 'success', resolved: 'success', settled: 'success', verified: 'success',
  pending: 'warning', maintenance: 'warning', processing: 'warning',
  error: 'error', expired: 'error', overdue: 'error', rejected: 'error',
  in_progress: 'info', open: 'info',
}
export function StatusChip({ status, label, ...props }: { status: string; label?: string } & Omit<ChipProps, 'label' | 'color'>) {
  const normalized = status.toLowerCase().replaceAll(' ', '_')
  return <Chip size="small" variant="outlined" color={statusColors[normalized] ?? 'default'} label={label ?? status.replaceAll('_', ' ')} {...props} />
}
