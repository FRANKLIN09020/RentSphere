import { alpha, createTheme, responsiveFontSizes } from '@mui/material/styles'
import type { PaletteMode, ThemeOptions } from '@mui/material/styles'

export type AppColorMode = PaletteMode

// RentSphere brand system. Change these values to rebrand the entire product.
export const brandColors = {
  primary: '#1E3A5F',
  primaryHover: '#142B47',
  primarySoft: '#7DA7D9',
  primarySurface: '#F2F6FB',
  accent: '#B7791F',
  accentSoft: '#F7E7C6',
  navigation: '#0B1728',
  navigationMid: '#172F4D',
  navigationEnd: '#10263F',
  success: '#15803D',
  warning: '#B45309',
  error: '#B91C1C',
  info: '#1D4ED8',
  violet: '#6D28D9',
  canvas: '#F4F7FA',
  paper: '#FBFDFF',
  ink: '#111827',
  muted: '#64748B',
  border: '#D9E2EC',
} as const

export const colorTokens = {
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 400: '#94a3b8', 500: '#64748b', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#0b1220' },
} as const

export const appSpacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const
export const appRadii = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const
export const appMotion = { fast: '120ms', standard: '180ms', slow: '260ms', easing: 'cubic-bezier(.22,1,.36,1)' } as const

const paletteByMode = (mode: AppColorMode): ThemeOptions['palette'] => ({
  mode,
  primary: { main: brandColors.primary, dark: brandColors.primaryHover, light: brandColors.primarySoft, contrastText: '#f8fffe' },
  secondary: { main: brandColors.accent, dark: '#8C5B17', light: brandColors.accentSoft },
  success: { main: mode === 'light' ? brandColors.success : '#4ade80' },
  warning: { main: mode === 'light' ? brandColors.warning : '#fbbf24' },
  error: { main: mode === 'light' ? brandColors.error : '#f87171' },
  info: { main: mode === 'light' ? brandColors.info : '#60a5fa' },
  background: mode === 'light' ? { default: brandColors.canvas, paper: brandColors.paper } : { default: brandColors.navigation, paper: '#121c30' },
  text: mode === 'light'
    ? { primary: brandColors.ink, secondary: brandColors.muted, disabled: alpha(brandColors.muted, 0.62) }
    : { primary: '#e8edf5', secondary: '#a9b8cc', disabled: alpha('#a9b8cc', 0.58) },
  divider: mode === 'light' ? brandColors.border : alpha('#94a3b8', 0.24),
  action: mode === 'light'
    ? { hover: alpha(brandColors.primary, 0.07), selected: alpha(brandColors.primary, 0.13), focus: alpha(brandColors.primary, 0.2), disabledBackground: alpha(colorTokens.slate[400], 0.16) }
    : { hover: alpha(brandColors.primarySoft, 0.09), selected: alpha(brandColors.primarySoft, 0.16), focus: alpha(brandColors.primarySoft, 0.22), disabledBackground: alpha('#94a3b8', 0.14) },
})

export function createAppTheme(mode: AppColorMode) {
  const base = createTheme({
    palette: paletteByMode(mode), spacing: 8, shape: { borderRadius: appRadii.md },
    breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
    shadows: ['none', `0 1px 3px ${alpha(colorTokens.slate[900], mode === 'light' ? 0.08 : 0.22)}`, `0 4px 14px ${alpha(colorTokens.slate[900], mode === 'light' ? 0.09 : 0.24)}`, `0 10px 28px ${alpha(colorTokens.slate[900], mode === 'light' ? 0.1 : 0.26)}`, `0 18px 48px ${alpha(colorTokens.slate[900], mode === 'light' ? 0.12 : 0.3)}`, ...Array(20).fill(`0 24px 64px ${alpha(colorTokens.slate[900], mode === 'light' ? 0.14 : 0.34)}`)] as ThemeOptions['shadows'],
    typography: {
      fontFamily: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'].join(','),
      h1: { fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1 }, h2: { fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, lineHeight: 1.15 }, h3: { fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 800, lineHeight: 1.2 },
      h4: { fontWeight: 800, lineHeight: 1.2 }, h5: { fontWeight: 760 }, h6: { fontWeight: 740 }, body1: { lineHeight: 1.6 }, body2: { lineHeight: 1.55 }, button: { textTransform: 'none', fontWeight: 700 },
    },
  })
  const focusRing = `0 0 0 3px ${alpha(base.palette.primary.main, 0.24)}`
  return responsiveFontSizes(createTheme(base, { components: {
    MuiCssBaseline: { styleOverrides: { ':root': {
      colorScheme: mode,
      '--rs-primary': brandColors.primary,
      '--rs-primary-hover': brandColors.primaryHover,
      '--rs-primary-soft': brandColors.primarySoft,
      '--rs-primary-surface': brandColors.primarySurface,
      '--rs-accent': brandColors.accent,
      '--rs-accent-soft': brandColors.accentSoft,
      '--rs-nav': brandColors.navigation,
      '--rs-nav-mid': brandColors.navigationMid,
      '--rs-nav-end': brandColors.navigationEnd,
      '--rs-success': brandColors.success,
      '--rs-warning': brandColors.warning,
      '--rs-error': brandColors.error,
      '--rs-info': brandColors.info,
      '--rs-violet': brandColors.violet,
      '--rs-border': brandColors.border,
    }, body: { backgroundColor: base.palette.background.default }, '*:focus-visible': { outline: `3px solid ${alpha(base.palette.primary.main, 0.48)}`, outlineOffset: 2 }, '@media (prefers-reduced-motion: reduce)': { '*, *::before, *::after': { animationDuration: '0.01ms !important', animationIterationCount: '1 !important', transitionDuration: '0.01ms !important', scrollBehavior: 'auto !important' } } } },
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 40, borderRadius: appRadii.md, transition: `background-color ${appMotion.standard} ease, border-color ${appMotion.standard} ease, transform ${appMotion.standard} ${appMotion.easing}`, '&:hover': { transform: 'translateY(-1px)' }, '&:focus-visible': { boxShadow: focusRing }, '&.Mui-disabled': { transform: 'none' } }, sizeLarge: { minHeight: 48 } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: 40, minHeight: 40, '&:focus-visible': { boxShadow: focusRing } }, sizeSmall: { minWidth: 36, minHeight: 36 } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${base.palette.divider}`, borderRadius: appRadii.lg, backgroundImage: 'none', boxShadow: base.shadows[2] } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: appRadii.lg }, root: { backgroundImage: 'none' } } },
    MuiAppBar: { defaultProps: { elevation: 0 }, styleOverrides: { root: { backgroundImage: 'none', borderBottom: `1px solid ${base.palette.divider}` } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none', borderColor: base.palette.divider } } },
    MuiDialog: { defaultProps: { fullWidth: true }, styleOverrides: { paper: { maxHeight: 'calc(100dvh - 32px)', margin: 16, border: `1px solid ${base.palette.divider}` } } },
    MuiMenu: { defaultProps: { marginThreshold: 12 }, styleOverrides: { paper: { border: `1px solid ${base.palette.divider}`, boxShadow: base.shadows[4] }, list: { padding: 6 } } },
    MuiMenuItem: { styleOverrides: { root: { minHeight: 40, borderRadius: appRadii.sm, '&.Mui-selected': { backgroundColor: base.palette.action.selected } } } },
    MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: appRadii.md, backgroundColor: base.palette.background.paper, transition: `box-shadow ${appMotion.standard} ease`, '&.Mui-focused': { boxShadow: focusRing } }, notchedOutline: { borderColor: base.palette.divider }, input: { '&::placeholder': { color: base.palette.text.secondary, opacity: 0.8 } } } },
    MuiSelect: { defaultProps: { size: 'small' } }, MuiTable: { styleOverrides: { root: { backgroundColor: base.palette.background.paper } } }, MuiTableContainer: { styleOverrides: { root: { maxWidth: '100%', border: `1px solid ${base.palette.divider}`, borderRadius: appRadii.md } } },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: base.palette.action.hover } } }, MuiTableCell: { styleOverrides: { root: { borderColor: base.palette.divider }, head: { color: base.palette.text.primary, fontWeight: 750 } } }, MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: base.palette.action.hover }, '&.Mui-selected': { backgroundColor: base.palette.action.selected } } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: appRadii.pill } } }, MuiTab: { styleOverrides: { root: { minHeight: 44, textTransform: 'none', fontWeight: 700 } } }, MuiChip: { styleOverrides: { root: { fontWeight: 700 }, outlined: { borderColor: base.palette.divider } } },
    MuiTooltip: { defaultProps: { arrow: true }, styleOverrides: { tooltip: { fontSize: '0.75rem', borderRadius: appRadii.sm } } }, MuiAlert: { styleOverrides: { root: { borderRadius: appRadii.md, alignItems: 'center' } } }, MuiSnackbar: { defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } } },
    MuiPaginationItem: { styleOverrides: { root: { minWidth: 40, height: 40, '&:focus-visible': { boxShadow: focusRing } } } }, MuiSkeleton: { defaultProps: { animation: 'wave' }, styleOverrides: { root: { backgroundColor: alpha(base.palette.text.secondary, 0.13) } } },
  } }))
}

export const theme = createAppTheme('light')
