import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CircleIcon from '@mui/icons-material/Circle'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../shared/auth/useAuth'
import { http } from '../../shared/api/http'
import { AmbientBackdrop, PageMotion } from '../../shared/ui/Motion'
import { AppScrollbar } from '../../shared/ui/AppScrollbars'
import { AssistantWidget } from '../../features/assistant/AssistantWidget'
import { moduleConfigs } from '../../features/modules/moduleConfigs'
import { moduleSortOrder } from '../../features/modules/moduleAccess'
import { useModuleAccess } from '../../features/modules/useModuleAccess'
import { formatRole, getEmailInitials } from '../../shared/utils/format'
import { useColorMode } from '../../shared/theme/color-mode-context'
import { useNotifications } from '../../shared/hooks/useNotifications'
import { useLanguage } from '../../shared/i18n/language-context'
import type { AppLanguage } from '../../shared/i18n/language-context'
import {
  AgreementIcon,
  ApartmentIcon,
  ApprovalIcon,
  BuildingIcon,
  CloseIcon,
  ComplaintIcon,
  DashboardIcon,
  InvoiceIcon,
  LogoutIcon,
  MenuIcon,
  MoneyIcon,
  OrganizationIcon,
  PeopleIcon,
  ProfileIcon,
  ShieldIcon,
  UnitIcon,
} from '../../shared/ui/AppIcons'

type NavItem = { to: string; label: string; icon: ReactNode }
type NavSection = { label: string; items: NavItem[] }
type LanguageOption = { code: AppLanguage; label: string }

const mainLinks: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
]

const managementModules = ['properties', 'buildings', 'units', 'tenants']
const financeModules = ['agreements', 'invoices', 'payments']
const operationsModules = ['complaints', 'deposit-disputes', 'rent-increases']
const platformModules = ['organizations', 'users']

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
]
const LANGUAGE_NAMES: Record<AppLanguage, string> = { en: 'English', ta: 'தமிழ்', hi: 'हिन्दी', kn: 'ಕನ್ನಡ' }

const SIDEBAR_WIDTH_EXPANDED = 276
const SIDEBAR_WIDTH_COLLAPSED = 88
const SIDEBAR_COLLAPSE_KEY = 'rentsphere-sidebar-collapsed'

export function AppLayout() {
  const { session, logout } = useAuth()
  const { resolvedMode, toggleColorMode } = useColorMode()
  const { items: notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const { language, setLanguage, t } = useLanguage()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1',
  )
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null)
  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null)
  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null)
  const [organizationName, setOrganizationName] = useState('')

  const location = useLocation()
  const navigate = useNavigate()
  const roleLabel = formatRole(session?.role)
  const isTenant = session?.role === 'TENANT'
  const { modules: relatedModules } = useModuleAccess()

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    let active = true
    void http.get<{ organizationName?: string }>('/auth/me')
      .then((response) => {
        if (active) setOrganizationName(response.data.organizationName ?? '')
      })
      .catch(() => {
        if (active) setOrganizationName('')
      })
    return () => { active = false }
  }, [session?.email])

  const handleLanguageSelect = (code: AppLanguage) => {
    setLanguage(code)
    setLangAnchor(null)
  }

  const readableModules = useMemo(
    () => relatedModules.toSorted((left, right) => moduleSortOrder(left.resource) - moduleSortOrder(right.resource)),
    [relatedModules],
  )

  const approvalsLink: NavItem = {
    to: '/approvals',
    label: isTenant ? 'Approval status' : 'Applications & Approvals',
    icon: <ApprovalIcon />,
  }

  const apartmentsLink: NavItem = {
    to: '/apartments',
    label: 'Book Apartment',
    icon: <ApartmentIcon />,
  }

  const moduleByResource = useMemo(
    () => new Map(readableModules.map((module) => [module.resource, module])),
    [readableModules],
  )

  const toLink = (resource: string): NavItem | null => {
    const module = moduleByResource.get(resource)
    if (!module) return null
    return { to: `/${resource}`, label: module.title, icon: getModuleIcon(resource) }
  }

  const managementLinks = managementModules.map(toLink).filter((link): link is NavItem => link !== null)
  const financeLinks = financeModules.map(toLink).filter((link): link is NavItem => link !== null)
  const operationsLinks = operationsModules.map(toLink).filter((link): link is NavItem => link !== null)
  const platformLinks = platformModules.map(toLink).filter((link): link is NavItem => link !== null)

  const navSections: NavSection[] = [
    { label: 'Main', items: mainLinks },
    ...(isTenant ? [{ label: 'Booking', items: [apartmentsLink] }] : []),
    ...(managementLinks.length ? [{ label: 'Management', items: managementLinks }] : []),
    ...(financeLinks.length ? [{ label: 'Finance', items: financeLinks }] : []),
    ...(operationsLinks.length ? [{ label: 'Operations', items: operationsLinks }] : []),
    ...(platformLinks.length ? [{ label: 'Platform', items: platformLinks }] : []),
    { label: 'Workflow', items: [approvalsLink] },
  ]

  const pageMeta = useMemo(() => {
    if (location.pathname === '/') return { breadcrumb: roleLabel, title: 'Dashboard' }
    if (location.pathname === '/profile') return { breadcrumb: 'Account', title: 'My profile' }
    if (location.pathname === '/approvals') return { breadcrumb: 'Workflow', title: approvalsLink.label }
    if (location.pathname === '/apartments') return { breadcrumb: 'Booking', title: apartmentsLink.label }
    const module = moduleConfigs.find((item) => `/${item.resource}` === location.pathname)
    if (module) return { breadcrumb: '', title: module.title }
    return { breadcrumb: 'RentSphere', title: 'Workspace' }
  }, [location.pathname, roleLabel, approvalsLink.label, apartmentsLink.label])

  const currentLanguage = LANGUAGES.find((option) => option.code === language) ?? LANGUAGES[0]

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AmbientBackdrop />
      <Box sx={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0 }}>
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
            flexShrink: 0,
            height: '100%',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'var(--rs-nav)',
            backgroundImage: 'linear-gradient(180deg, var(--rs-nav) 0%, var(--rs-nav-mid) 58%, var(--rs-nav-end) 100%)',
            transition: 'width 0.25s cubic-bezier(.22,1,.36,1)',
            overflow: 'hidden',
          }}
        >
          <SidebarContent
            navSections={navSections}
            onNavigate={() => navigate('/')}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((prev) => !prev)}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppBar
            color="inherit"
            elevation={0}
            position="static"
            sx={{
              zIndex: 1100,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(18px)',
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: { xs: 64, md: 72 }, px: { xs: 1.5, md: 3 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0, flexShrink: 0 }}>
                <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} aria-label="Open menu">
                  <MenuIcon />
                </IconButton>
                <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                  <IconButton
                    onClick={() => setCollapsed((prev) => !prev)}
                    sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
                    aria-label="Toggle sidebar"
                  >
                    {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
                  </IconButton>
                </Tooltip>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.14, color: 'primary.main', lineHeight: 1.2 }}>
                    {t(pageMeta.breadcrumb)}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '1.15rem',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t(pageMeta.title)}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0, flexShrink: 0 }}>
                {/* Theme switch */}
                <Tooltip title={t(resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode')}>
                  <IconButton onClick={toggleColorMode} aria-label="Toggle color mode">
                    {resolvedMode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                  </IconButton>
                </Tooltip>

                {/* Language switcher */}
                <Tooltip title={t('Change language')}>
                  <IconButton onClick={(event) => setLangAnchor(event.currentTarget)} aria-label={t('Change language')}>
                    <TranslateRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={langAnchor}
                  open={Boolean(langAnchor)}
                  onClose={() => setLangAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 180 } } }}
                >
                  {LANGUAGES.map((option) => (
                    <MenuItem
                      key={option.code}
                      selected={option.code === currentLanguage.code}
                      onClick={() => handleLanguageSelect(option.code)}
                      sx={{ borderRadius: 1.5, mx: 0.75, my: 0.15, fontWeight: 700 }}
                    >
                      {LANGUAGE_NAMES[option.code]}
                    </MenuItem>
                  ))}
                </Menu>

                {/* Notifications */}
                <Tooltip title={t('Notifications')}>
                  <IconButton onClick={(event) => setNotifAnchor(event.currentTarget)} aria-label={t('Notifications')}>
                    <Badge badgeContent={unreadCount} color="error" max={9}>
                      <NotificationsRoundedIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={notifAnchor}
                  open={Boolean(notifAnchor)}
                  onClose={() => setNotifAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, width: 340, maxHeight: 420 } } }}
                >
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25 }}>
                    <Typography sx={{ fontWeight: 850 }}>{t('Notifications')}</Typography>
                    <Button size="small" onClick={markAllRead} disabled={unreadCount === 0} sx={{ textTransform: 'none', fontWeight: 700 }}>
                      {t('Mark all read')}
                    </Button>
                  </Stack>
                  <Divider />
                  {notifications.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
                      {t("You're all caught up.")}
                    </Typography>
                  )}
                  {notifications.map((item) => (
                    <MenuItem
                      key={item.id}
                      onClick={() => {
                        markRead(item.id)
                        setNotifAnchor(null)
                        if (item.targetPath) navigate(item.targetPath)
                      }}
                      sx={{ alignItems: 'flex-start', gap: 1, py: 1.1, whiteSpace: 'normal' }}
                    >
                      <CircleIcon
                        sx={{ fontSize: 8, mt: 0.7, color: item.read ? 'transparent' : 'primary.main', flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: item.read ? 600 : 800, fontSize: '0.88rem' }}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {item.detail}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.time}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>

                <Tooltip title={t('Profile')}>
                  <IconButton
                    onClick={(event) => setProfileAnchor(event.currentTarget)}
                    onMouseEnter={(event) => setProfileAnchor(event.currentTarget)}
                    aria-label={t('Profile')}
                    sx={{
                      ml: 0.5,
                      width: 48,
                      height: 48,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                      '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main', transform: 'translateY(-1px)', boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}` },
                    }}
                  >
                    <Badge overlap="circular" variant="dot" color="success" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} sx={{ '& .MuiBadge-badge': { width: 10, height: 10, minWidth: 10, border: '2px solid', borderColor: 'background.paper' } }}>
                      <Avatar sx={{ width: 38, height: 38, background: 'linear-gradient(135deg, var(--rs-primary), var(--rs-primary-hover))', color: 'primary.contrastText', fontWeight: 900, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }}>
                        {session?.email?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={profileAnchor}
                  open={Boolean(profileAnchor)}
                  onClose={() => setProfileAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { onMouseLeave: () => setProfileAnchor(null), sx: { borderRadius: 3, mt: 0.75, minWidth: 270, overflow: 'hidden' } } }}
                >
                  <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.dark', fontWeight: 900 }}>
                        {getEmailInitials(session?.email)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session?.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {t(roleLabel)}
                        </Typography>
                        {organizationName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
                            {organizationName}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                  <MenuItem
                    onClick={() => {
                      setProfileAnchor(null)
                      navigate('/')
                    }}
                    sx={{ borderRadius: 1.5, mx: 0.75, my: 0.15, gap: 1 }}
                  >
                    <DashboardIcon />
                    <Typography sx={{ fontWeight: 700 }}>{t('Dashboard')}</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setProfileAnchor(null)
                      navigate('/profile')
                    }}
                    sx={{ borderRadius: 1.5, mx: 0.75, my: 0.15, gap: 1 }}
                  >
                    <ProfileIcon />
                    <Typography sx={{ fontWeight: 700 }}>{t('My profile')}</Typography>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setProfileAnchor(null)
                      logout()
                    }}
                    sx={{ borderRadius: 1.5, mx: 0.75, my: 0.15, gap: 1, color: 'error.main', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <LogoutIcon />
                    <Typography sx={{ fontWeight: 700 }}>{t('Sign out')}</Typography>
                  </MenuItem>
                </Menu>
              </Stack>
            </Toolbar>
          </AppBar>

          <AppScrollbar
            sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
          >
            <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <PageMotion key={location.pathname}><Outlet /></PageMotion>
              </Box>

              <Box
                component="footer"
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  px: { xs: 2, md: 3 },
                  pr: { xs: 2, md: 13 },
                  py: { xs: 2.5, md: 2.25 },
                }}
              >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'center', maxWidth: 1480, mx: 'auto' }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 14, fontWeight: 900, borderRadius: 1.5 }}>
                  RS
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>RentSphere</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('Smart property management platform')}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 650, fontSize: '0.8rem' }}>
                  {t('Need help? Contact your property administrator or use the assistant.')}
                </Typography>
                {location.pathname !== '/' && (
                  <Button variant="outlined" size="small" onClick={() => navigate('/')} sx={{ textTransform: 'none', fontWeight: 750, borderRadius: 2, whiteSpace: 'nowrap' }}>
                    {t('Back to dashboard')}
                  </Button>
                )}
              </Stack>
            </Stack>

            <Box sx={{ maxWidth: 1480, mx: 'auto', mt: 1.5 }}>
              <Divider sx={{ borderColor: 'divider' }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1.25 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  © {new Date().getFullYear()} RentSphere. All rights reserved.
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'var(--rs-success)', boxShadow: '0 0 0 4px color-mix(in srgb, var(--rs-success) 16%, transparent)' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {t('All systems operational')}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
              </Box>
            </Box>
          </AppScrollbar>
        </Box>
      </Box>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: 292,
            boxSizing: 'border-box',
            bgcolor: 'var(--rs-nav)',
            color: '#e5e7eb',
            borderRight: 0,
            backgroundImage: 'linear-gradient(180deg, var(--rs-nav) 0%, var(--rs-nav-mid) 58%, var(--rs-nav-end) 100%)',
          },
        }}
      >
        <SidebarContent
          navSections={navSections}
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
          collapsed={false}
        />
      </Drawer>

      <AssistantWidget />
    </Box>
  )
}

function SidebarContent({
  navSections,
  onNavigate,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  navSections: NavSection[]
  onNavigate: () => void
  onClose?: () => void
  collapsed: boolean
  onToggleCollapse?: () => void
}) {
  const { t } = useLanguage()
  const sectionDelays = navSections.reduce<number[]>((delays) => {
    const start = delays.length ? delays[delays.length - 1] + navSections[delays.length - 1].items.length : 0
    delays.push(start)
    return delays
  }, [])

  return (
    <Stack
      spacing={2.25}
      sx={{
        height: '100%',
        p: collapsed ? 1.25 : 2.25,
        position: 'relative',
        overflow: 'hidden',
        transition: 'padding 0.25s ease',
        animation: 'sidebarIn 0.6s cubic-bezier(.22,1,.36,1) both',
        '@keyframes sidebarIn': { from: { opacity: 0, transform: 'translateX(-28px)' }, to: { opacity: 1, transform: 'none' } },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: '-80px -80px auto auto',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--rs-primary-soft) 22%, transparent), transparent 70%)',
          pointerEvents: 'none',
          animation: 'navGlow 7s ease-in-out infinite',
          '@keyframes navGlow': { '0%,100%': { opacity: 0.5, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.2)' } },
        }}
      />

      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          position: 'relative',
          animation: 'logoIn 0.6s cubic-bezier(.22,1,.36,1) 0.1s both',
          '@keyframes logoIn': { from: { opacity: 0, transform: 'translateY(-10px)' }, to: { opacity: 1, transform: 'none' } },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', cursor: 'pointer', minWidth: 0 }} onClick={onNavigate}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: '#ffffff',
              fontWeight: 950,
              borderRadius: 2,
              animation: 'logoPulse 2.8s ease-in-out infinite',
              '@keyframes logoPulse': { '0%,100%': { boxShadow: '0 10px 26px color-mix(in srgb, var(--rs-primary) 40%, transparent)' }, '50%': { boxShadow: '0 10px 34px color-mix(in srgb, var(--rs-primary-soft) 70%, transparent)' } },
              transition: 'transform 0.25s ease',
              '&:hover': { transform: 'rotate(-8deg) scale(1.08)' },
            }}
          >
            RS
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.1, color: '#ffffff' }}>RentSphere</Typography>
              <Typography variant="caption" sx={{ color: '#9fb0c7', fontWeight: 700 }}>Property management</Typography>
            </Box>
          )}
        </Stack>
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close menu" sx={{ color: '#cbd5e1', transition: 'transform 0.2s ease, color 0.2s ease', '&:hover': { transform: 'rotate(90deg)', color: '#ffffff' } }}>
            <CloseIcon />
          </IconButton>
        )}
        {onToggleCollapse && !collapsed && (
          <Tooltip title="Collapse sidebar">
            <IconButton onClick={onToggleCollapse} size="small" sx={{ color: '#9fb0c7', '&:hover': { color: '#ffffff' } }}>
              <ChevronLeftRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {onToggleCollapse && collapsed && (
        <Tooltip title="Expand sidebar" placement="right">
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{ alignSelf: 'center', color: '#9fb0c7', border: '1px solid rgba(255,255,255,0.14)', '&:hover': { color: '#ffffff' } }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        <AppScrollbar sx={{ pr: 0.5, minHeight: 0 }}>
          {navSections.map((section, sectionIndex) => {
            const delayBase = 0.28 + sectionDelays[sectionIndex] * 0.055
            return (
              <Box key={section.label} sx={{ mb: 2, animation: 'sectionIn 0.5s ease both', animationDelay: `${delayBase}s`, '@keyframes sectionIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
                {!collapsed && (
                  <Typography variant="caption" sx={{ color: '#9fb0c7', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.14, fontSize: '0.62rem', px: 1 }}>
                    {t(section.label)}
                  </Typography>
                )}
                <List dense disablePadding sx={{ mt: collapsed ? 0 : 0.6 }}>
                  {section.items.map((link, index) => (
                    <SidebarLink key={link.to} link={link} onNavigate={onNavigate} delay={delayBase + 0.08 + index * 0.055} collapsed={collapsed} />
                  ))}
                </List>
              </Box>
            )
          })}
        </AppScrollbar>
      </Box>
{/* 
      {!collapsed && (
        <Box
          sx={{
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 2,
            p: 1.5,
            bgcolor: 'color-mix(in srgb, var(--rs-primary) 18%, transparent)',
            overflow: 'hidden',
            animation: 'statusIn 0.6s cubic-bezier(.22,1,.36,1) both',
            animationDelay: `${0.34 + sectionDelays.length * 0.055}s`,
            '@keyframes statusIn': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 0 5px rgba(34,197,94,0.16)', animation: 'onlinePulse 1.8s ease-out infinite', '@keyframes onlinePulse': { '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.5)' }, '100%': { boxShadow: '0 0 0 8px rgba(34,197,94,0)' } } }} />
            <Typography sx={{ fontWeight: 850, color: '#ffffff' }}>System online</Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: '#9fb0c7', mt: 0.35 }}>Connected to RentSphere API</Typography>
        </Box>
      )} */}

      {/* <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          position: 'relative',
          animation: 'statusIn 0.6s cubic-bezier(.22,1,.36,1) both',
          animationDelay: `${0.42 + sectionDelays.length * 0.055}s`,
          '&:hover .sidebar-user-avatar': { transform: 'scale(1.08) rotate(-6deg)' },
        }}
      >
        <Tooltip title={collapsed ? `${email ?? ''} · ${roleLabel}` : ''} placement="right">
          <Avatar className="sidebar-user-avatar" sx={{ width: 34, height: 34, bgcolor: 'primary.dark', fontWeight: 900, color: '#ffffff', transition: 'transform 0.25s ease', boxShadow: '0 6px 16px color-mix(in srgb, var(--rs-primary) 35%, transparent)' }}>
            {getEmailInitials(email)}
          </Avatar>
        </Tooltip>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9fb0c7', fontWeight: 700 }}>{roleLabel}</Typography>
          </Box>
        )}
      </Stack> */}
    </Stack>
  )
}

function SidebarLink({ link, onNavigate, delay = 0, collapsed }: { link: NavItem; onNavigate: () => void; delay?: number; collapsed: boolean }) {
  const { t } = useLanguage()
  const button = (
    <ListItemButton
      component={NavLink}
      to={link.to}
      end={link.to === '/'}
      onClick={onNavigate}
      sx={{
        borderRadius: 2,
        color: '#cbd5e1',
        mb: 0.4,
        minHeight: 42,
        justifyContent: collapsed ? 'center' : 'flex-start',
        px: collapsed ? 1 : 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.25s ease, transform 0.25s cubic-bezier(.22,1,.36,1), color 0.25s ease, box-shadow 0.25s ease',
        animation: 'linkIn 0.5s cubic-bezier(.22,1,.36,1) both',
        animationDelay: `${delay}s`,
        '@keyframes linkIn': { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'none' } },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          width: 3,
          height: 0,
          transform: 'translateY(-50%)',
          borderRadius: '0 4px 4px 0',
          background: 'linear-gradient(180deg, var(--rs-primary), var(--rs-primary-soft))',
          boxShadow: '0 0 12px color-mix(in srgb, var(--rs-primary-soft) 55%, transparent)',
          transition: 'height 0.3s cubic-bezier(.22,1,.36,1)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)',
          transform: 'translateX(-100%)',
          transition: 'transform 0.45s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          color: '#ffffff',
          bgcolor: 'rgba(255,255,255,0.08)',
          transform: collapsed ? 'none' : 'translateX(4px)',
          '&::after': { transform: 'translateX(100%)' },
          '& .MuiListItemIcon-root': { transform: 'scale(1.15) rotate(-6deg)' },
        },
        '&.active': {
          color: '#ffffff',
          bgcolor: 'color-mix(in srgb, var(--rs-primary) 30%, transparent)',
          '&::before': { height: '70%' },
          '& .MuiListItemIcon-root': { color: 'var(--rs-primary-soft)' },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, color: 'inherit', transition: 'transform 0.25s cubic-bezier(.22,1,.36,1), color 0.25s ease' }}>
        {link.icon}
      </ListItemIcon>
      {!collapsed && <ListItemText primary={<Typography sx={{ fontWeight: 760, fontSize: '0.9rem' }}>{t(link.label)}</Typography>} />}
    </ListItemButton>
  )

  if (!collapsed) return button

  return (
    <Tooltip title={t(link.label)} placement="right">
      {button}
    </Tooltip>
  )
}

function getModuleIcon(resource: string) {
  const icons: Record<string, ReactNode> = {
    organizations: <OrganizationIcon />,
    users: <PeopleIcon />,
    properties: <ApartmentIcon />,
    buildings: <BuildingIcon />,
    units: <UnitIcon />,
    tenants: <PeopleIcon />,
    agreements: <AgreementIcon />,
    invoices: <InvoiceIcon />,
    payments: <MoneyIcon />,
    complaints: <ComplaintIcon />,
    'deposit-disputes': <ShieldIcon />,
    'rent-increases': <MoneyIcon />,
  }
  return icons[resource] ?? <ApartmentIcon />
}
