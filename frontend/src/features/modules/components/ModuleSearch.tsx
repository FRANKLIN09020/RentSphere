import { Box, InputAdornment, TextField } from '@mui/material'
import { CloseIcon, SearchIcon } from '../../../shared/ui/AppIcons'

export function ModuleSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <Box sx={{ minWidth: { md: 300 } }}>
      <TextField
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        size="small"
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            bgcolor: 'rgba(148,163,184,0.05)',
            transition: 'all 0.25s ease',
            '&.Mui-focused': {
              bgcolor: 'background.paper',
              boxShadow: (theme) => `0 0 0 3px ${theme.palette.action.focus}`,
            },
            '&:hover': {
              bgcolor: 'rgba(148,163,184,0.1)',
            },
          },
        }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', animation: value ? 'searchPulse 2s ease-in-out infinite' : 'none', '@keyframes searchPulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' } } }} />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <Box
                  onClick={() => onChange('')}
                  sx={{
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    color: 'text.secondary',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: 'rgba(148,163,184,0.2)', color: 'primary.main', transform: 'rotate(90deg)' },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 15 }} />
                </Box>
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
    </Box>
  )
}
