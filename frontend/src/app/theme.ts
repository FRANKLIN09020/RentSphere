import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f3f6fa',
      paper: '#ffffff',
    },
    primary: {
      main: '#0d9488',
      dark: '#0f766e',
      light: '#5eead4',
    },
    secondary: {
      main: '#475569',
    },
    info: {
      main: '#2563eb',
    },
    text: {
      primary: '#111827',
      secondary: '#64748b',
    },
    divider: '#d9e2ec',
    success: {
      main: '#15803d',
    },
    warning: {
      main: '#b45309',
    },
    error: {
      main: '#b91c1c',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: [
      'Inter',
      'ui-sans-serif',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 760,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 740,
      letterSpacing: 0,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#0d9488 transparent',
        },
        '*::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#0d9488',
          borderRadius: 999,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#0f766e',
        },
        '*::-webkit-scrollbar-button': {
          display: 'none',
          width: 0,
          height: 0,
        },
        '*::-webkit-scrollbar-corner': {
          background: 'transparent',
        },
      },
    },

    MuiButton: {

      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 11,
          minHeight: 40,
          boxShadow: 'none',
          transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 14px 28px rgba(13, 148, 136, 0.28)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(148, 163, 184, 0.22)',
          borderRadius: 18,
          boxShadow: '0 20px 55px rgba(15, 23, 42, 0.07)',
          backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,250,252,.92))',
          backdropFilter: 'blur(18px)',
          transition: 'transform 220ms cubic-bezier(.22,1,.36,1), box-shadow 220ms ease, border-color 220ms ease',
          '&:hover': {
            borderColor: 'rgba(13, 148, 136, 0.28)',
            boxShadow: '0 26px 65px rgba(15, 23, 42, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 750,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: 11,
            transition: 'boxShadow 180ms ease, transform 180ms ease',
            '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(13,148,136,.14)' },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})
