import { Box, Typography } from '@mui/material'
import { SearchIcon } from '../../../shared/ui/AppIcons'

const floaters = [
  { left: '20%', top: '22%', size: 10, delay: 0 },
  { left: '72%', top: '28%', size: 7, delay: 1.4 },
  { left: '60%', top: '62%', size: 9, delay: 0.7 },
  { left: '28%', top: '66%', size: 6, delay: 2.1 },
  { left: '46%', top: '34%', size: 5, delay: 1.9 },
]

export function ModuleEmptyState({
  itemLabel,
  itemLabelPlural,
}: {
  itemLabel: string
  itemLabelPlural: string
}) {
  return (
    <Box
      sx={{
        py: 7,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 0.45s ease',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'none' },
        },
      }}
    >
      {/* Floating dots */}
      {floaters.map((floater, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            width: floater.size,
            height: floater.size,
            borderRadius: '50%',
            left: floater.left,
            top: floater.top,
            bgcolor: 'color-mix(in srgb, var(--rs-primary) 14%, transparent)',
            animation: 'emptyFloat 5s ease-in-out infinite',
            animationDelay: `${floater.delay}s`,
            '@keyframes emptyFloat': {
              '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.5 },
              '50%': { transform: 'translateY(-16px) scale(1.15)', opacity: 1 },
            },
          }}
        />
      ))}

      <Box
        sx={{
          position: 'relative',
          width: 72,
          height: 72,
          mx: 'auto',
          mb: 2.5,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            padding: '2px',
            background: 'conic-gradient(from 0deg, var(--rs-primary), transparent, var(--rs-primary), transparent, var(--rs-primary))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            animation: 'emptyRing 8s linear infinite',
            '@keyframes emptyRing': { to: { transform: 'rotate(360deg)' } },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 3,
            borderRadius: '17px',
            bgcolor: 'color-mix(in srgb, var(--rs-primary) 6%, transparent)',
            display: 'grid',
            placeItems: 'center',
            animation: 'emptyBob 3.5s ease-in-out infinite',
            '@keyframes emptyBob': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
          }}
        >
          <SearchIcon sx={{ fontSize: 30, color: 'primary.main' }} />
        </Box>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        No {itemLabelPlural} found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Create a {itemLabel} or adjust your search to get started.
      </Typography>
    </Box>
  )
}
