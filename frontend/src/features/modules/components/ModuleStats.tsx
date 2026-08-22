import { Box, Stack, Typography } from '@mui/material'
import type { ModuleConfig, RecordData } from '../types'
import { getModuleProfile, getCategoryAccent } from '../moduleProfile'

const statusColors: Record<string, string> = {
  PAID: '#15803d',
  SUCCESS: '#15803d',
  RESOLVED: '#15803d',
  ACTIVE: '#15803d',
  AVAILABLE: '#0d9488',
  VERIFIED: '#0d9488',
  ACCEPTED: '#15803d',
  SETTLED: '#15803d',
  PENDING: '#b45309',
  OPEN: '#b91c1c',
  IN_PROGRESS: '#2563eb',
  OVERDUE: '#b91c1c',
  MAINTENANCE: '#b45309',
  REJECTED: '#b91c1c',
  EXPIRED: '#64748b',
}

export function ModuleStats({
  config,
  records,
  loading,
}: {
  config: ModuleConfig
  records: RecordData[]
  loading: boolean
}) {
  const profile = getModuleProfile(config)
  const accent = getCategoryAccent(profile.category)
  const selectField = config.fields.find((field) => field.kind === 'select' && field.options?.length)
  const total = records.length

  const groups = selectField?.options
    ? selectField.options
        .map((option) => ({
          label: option,
          count: records.filter((record) => record[selectField.name] === option).length,
        }))
        .filter((group) => group.count > 0)
    : []

  const max = Math.max(...groups.map((group) => group.count), 1)

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        animation: 'statsFade 0.5s ease both',
        animationDelay: '0.08s',
        '@keyframes statsFade': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
      }}
    >
      {/* Total card */}
      <Box
        sx={{
          minWidth: { sm: 180 },
          flexShrink: 0,
          borderRadius: '16px',
          p: 2,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          background: accent.gradient,
        }}
      >
        <Box sx={{ position: 'absolute', inset: 'auto -30px -30px auto', width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.12)' }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
          Total {profile.itemLabelPlural}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, mt: 0.25 }}>
          {loading ? '…' : total}
        </Typography>
      </Box>

      {/* Breakdown */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(auto-fill, minmax(150px, 1fr))' },
          gap: 1.5,
        }}
      >
        {(groups.length ? groups : [{ label: selectField ? 'No records' : 'All records', count: total }]).map((group, index) => {
          const color = statusColors[group.label] ?? accent.dotColor
          return (
            <Box
              key={group.label}
              sx={{
                borderRadius: '14px',
                border: '1px solid',
                borderColor: 'rgba(148,163,184,0.22)',
                bgcolor: 'rgba(255,255,255,0.7)',
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                animation: 'statCardPop 0.5s cubic-bezier(.22,1,.36,1) both',
                animationDelay: `${0.12 + index * 0.07}s`,
                '@keyframes statCardPop': {
                  from: { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
                  to: { opacity: 1, transform: 'none' },
                },
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 28px ${color}22` },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 3px ${color}22`, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {group.label}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>{group.count}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {Math.round((group.count / max) * 100)}%
                </Typography>
              </Stack>
              <Box sx={{ mt: 1, height: 5, borderRadius: 999, bgcolor: 'rgba(148,163,184,0.16)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(group.count / max) * 100}%`,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    transition: 'width 0.6s cubic-bezier(.22,1,.36,1)',
                    animation: 'barGrow 0.6s cubic-bezier(.22,1,.36,1) both',
                    animationDelay: `${0.2 + index * 0.07}s`,
                    '@keyframes barGrow': { from: { width: 0 }, to: { width: `${(group.count / max) * 100}%` } },
                  }}
                />
              </Box>
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}
