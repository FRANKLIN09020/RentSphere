import { Box, Button, LinearProgress, Stack, Typography } from '@mui/material'
import type { ModuleConfig } from '../types'
import { AddIcon, RefreshIcon } from '../../../shared/ui/AppIcons'
import { getModuleProfile, getCategoryAccent } from '../moduleProfile'

const particles = [
  { left: 12, top: 18, size: 5, delay: 0 },
  { left: 22, top: 78, size: 4, delay: 1.2 },
  { left: 38, top: 12, size: 6, delay: 2.4 },
  { left: 55, top: 84, size: 4, delay: 0.8 },
  { left: 70, top: 16, size: 5, delay: 1.8 },
  { left: 84, top: 70, size: 6, delay: 3.1 },
  { left: 91, top: 34, size: 4, delay: 2.1 },
  { left: 8, top: 48, size: 4, delay: 3.6 },
]

export function ModuleToolbar({
  config,
  loading,
  error,
  lastUpdated,
  canCreate,
  onRefresh,
  onCreate,
}: {
  config: ModuleConfig
  loading: boolean
  error: string
  lastUpdated: Date | null
  canCreate: boolean
  onRefresh: () => void
  onCreate: () => void
}) {
  const profile = getModuleProfile(config)
  const accent = getCategoryAccent(profile.category)

  const liveLabel = loading
    ? 'Syncing'
    : error
      ? 'Error'
      : lastUpdated
        ? `Live · ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
        : 'Live'

  return (
    <Box
      sx={{
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'white',
        borderRadius: '22px',
        p: { xs: 2.5, md: 3.5 },
        overflow: 'hidden',
        position: 'relative',
        background: accent.gradient,
        isolation: 'isolate',
      }}
    >
      {/* Animated aurora wash */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          background: accent.gradient,
          animation: 'auroraShift 9s ease-in-out infinite alternate',
          '@keyframes auroraShift': {
            from: { opacity: 0.4, transform: 'scale(1) translateX(0)' },
            to: { opacity: 0.85, transform: 'scale(1.15) translateX(3%)' },
          },
        }}
      />

      {/* Floating particles */}
      {particles.map((p, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            left: `${p.left}%`,
            top: `${p.top}%`,
            bgcolor: 'rgba(255,255,255,0.35)',
            boxShadow: '0 0 14px rgba(255,255,255,0.45)',
            zIndex: -1,
            animation: 'particleFloat 7s ease-in-out infinite',
            animationDelay: `${p.delay}s`,
            '@keyframes particleFloat': {
              '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: 0.4 },
              '50%': { transform: 'translateY(-18px) translateX(6px)', opacity: 1 },
            },
          }}
        />
      ))}

      {/* Decorative grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          opacity: 0.08,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at 70% 20%, black, transparent 70%)',
        }}
      />

      {/* Orbs */}
      <Box sx={{ position: 'absolute', inset: 'auto -80px -80px auto', width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', zIndex: -1, animation: 'orbBreathe 6s ease-in-out infinite', '@keyframes orbBreathe': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.1)' } } }} />
      <Box sx={{ position: 'absolute', inset: '-50px auto auto -50px', width: 170, height: 170, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', zIndex: -1 }} />

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between', alignItems: { lg: 'center' }, position: 'relative' }}>
        <Box>
          <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', mb: 0.5 }}>
            {/* Rotating ring icon */}
            <Box sx={{ position: 'relative', width: 52, height: 52, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '14px',
                  padding: '2px',
                  background: 'conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.15), rgba(255,255,255,0.05), rgba(255,255,255,0.95))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  animation: 'ringSpin 5s linear infinite',
                  '@keyframes ringSpin': { to: { transform: 'rotate(360deg)' } },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 3,
                  borderRadius: '11px',
                  bgcolor: 'rgba(255,255,255,0.14)',
                  display: 'grid',
                  placeItems: 'center',
                  animation: 'iconBob 3.5s ease-in-out infinite',
                  '@keyframes iconBob': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-3px)' } },
                }}
              >
                {profile.icon}
              </Box>
            </Box>
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.5 }}>
                {profile.eyebrow}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15, textShadow: '0 2px 24px rgba(0,0,0,0.25)' }}>
                {profile.title}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.3,
              py: 0.7,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: error ? '#fca5a5' : '#fff',
              bgcolor: error ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.14)',
              border: '1px solid',
              borderColor: error ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)',
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: error ? '#fca5a5' : '#5eead4',
                boxShadow: `0 0 0 0 ${error ? 'rgba(252,165,165,0.6)' : 'rgba(94,234,212,0.6)'}`,
                animation: 'pulseDot 1.9s ease-out infinite',
                '@keyframes pulseDot': {
                  '0%': { boxShadow: `0 0 0 0 ${error ? 'rgba(252,165,165,0.6)' : 'rgba(94,234,212,0.6)'}` },
                  '100%': { boxShadow: `0 0 0 8px rgba(94,234,212,0)` },
                },
              }}
            />
            {liveLabel}
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.35)',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.8rem',
              transition: 'all 0.2s ease',
              '&:hover': { borderColor: 'rgba(255,255,255,0.6)', bgcolor: 'rgba(255,255,255,0.08)', transform: 'translateY(-2px)' },
            }}
          >
            {loading ? 'Refreshing' : 'Refresh'}
          </Button>
          {canCreate && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={onCreate}
              sx={{
                bgcolor: '#ffffff',
                color: '#0f766e',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#f0fdfa',
                  transform: 'translateY(-2px) scale(1.02)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
                },
              }}
            >
              New {profile.itemLabel}
            </Button>
          )}
        </Stack>
      </Stack>

      {loading && (
        <LinearProgress
          sx={{
            mt: 2,
            borderRadius: 2,
            height: 4,
            bgcolor: 'rgba(255,255,255,0.12)',
            '& .MuiLinearProgress-bar': {
              bgcolor: accent.dotColor,
              animation: 'progressShimmer 1.2s ease infinite',
              '@keyframes progressShimmer': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 },
              },
            },
          }}
        />
      )}
    </Box>
  )
}
