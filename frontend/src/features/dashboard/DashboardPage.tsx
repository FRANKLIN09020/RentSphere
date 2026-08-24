import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { Link } from 'react-router-dom'
import { moduleConfigs } from '../modules/moduleConfigs'
import { useModuleAccess } from '../modules/useModuleAccess'
import { getErrorMessage, http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import {
  ApartmentIcon,
  PeopleIcon,
  RefreshIcon,
  UnitIcon,
  WarningIcon,
} from '../../shared/ui/AppIcons'
import type { RecordData } from '../modules/types'
import { formatMoney } from '../../shared/utils/format'
import { AnimatedNumber, AreaChart, BarChart, DonutChart, HorizontalBars, type ChartDatum } from './DashboardCharts'
import { brandColors } from '../../app/theme'

const rolePriorityModules = {
  ADMIN: ['properties', 'units', 'tenants', 'invoices', 'complaints'],
  OWNER: ['properties', 'units', 'tenants', 'invoices', 'complaints'],
  TENANT: ['apartments', 'payments', 'complaints', 'deposit-disputes', 'rent-increases'],
} as const

const tenantOwnedResources = new Set(['payments', 'complaints', 'deposit-disputes', 'rent-increases'])

const CHART_COLORS = {
  teal: brandColors.primary,
  blue: brandColors.info,
  green: brandColors.success,
  amber: brandColors.warning,
  red: brandColors.error,
  slate: brandColors.muted,
  violet: brandColors.violet,
} as const

const monthKey = (value: unknown) => {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 7)
}

const monthLabel = (key: string) => {
  const [year, month] = key.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const suffix = key === new Date().toISOString().slice(0, 7) ? ' (now)' : ''
  return `${names[Number(month) - 1]} ${year.slice(2)}${suffix}`
}

const cardEnter = (delay: number) => ({
  animation: 'cardEnter 0.65s cubic-bezier(.22,1,.36,1) both',
  animationDelay: `${delay}s`,
  '@keyframes cardEnter': {
    from: { opacity: 0, transform: 'translateY(24px) scale(0.97)' },
    to: { opacity: 1, transform: 'none' },
  },
})

const accentBarShimmer = {
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
    transform: 'translateX(-100%)',
    animation: 'barShimmer 3s ease-in-out infinite',
    '@keyframes barShimmer': {
      '0%': { transform: 'translateX(-100%)' },
      '60%, 100%': { transform: 'translateX(100%)' },
    },
  },
} as const

export function DashboardPage() {
  const { session } = useAuth()
  const { modules: relatedModules } = useModuleAccess()
  const [moduleData, setModuleData] = useState<Record<string, RecordData[]>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled(
        relatedModules.map(async (module) => {
          const endpoint = session?.role === 'TENANT' && tenantOwnedResources.has(module.resource)
            ? `/${module.resource}/me`
            : `/${module.resource}`
          const response = await http.get<RecordData[]>(endpoint)
          return [module.resource, response.data] as const
        }),
      )
      const entries = results
        .filter((result): result is PromiseFulfilledResult<readonly [string, RecordData[]]> => result.status === 'fulfilled')
        .map((result) => result.value)
      setModuleData(Object.fromEntries(entries))
      setUpdatedAt(new Date())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [relatedModules, session?.role])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadDashboard()
    }, 0)
    const timer = window.setInterval(() => {
      void loadDashboard()
    }, 20000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(timer)
    }
  }, [loadDashboard])

  const totals = useMemo(() => {
    const count = (resource: string) => moduleData[resource]?.length ?? 0
    const invoices = moduleData.invoices ?? []
    const complaints = moduleData.complaints ?? []
    const payments = moduleData.payments ?? []
    const depositDisputes = moduleData['deposit-disputes'] ?? []
    const rentIncreases = moduleData['rent-increases'] ?? []
    const units = moduleData.units ?? []
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'PAID').length
    const openComplaints = complaints.filter((complaint) => complaint.status !== 'RESOLVED').length
    const availableUnits = units.filter((unit) => unit.status === 'AVAILABLE').length

    const invoiceAmount = (status: string) =>
      invoices
        .filter((invoice) => invoice.status === status)
        .reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0)

    return {
      properties: count('properties'),
      tenants: count('tenants'),
      availableUnits,
      openComplaints,
      invoiceHealth: invoices.length ? Math.round((paidInvoices / invoices.length) * 100) : 0,
      totalRecords: Object.values(moduleData).reduce((sum, records) => sum + records.length, 0),
      collected: invoiceAmount('PAID'),
      outstanding: invoiceAmount('PENDING') + invoiceAmount('OVERDUE'),
      totalUnits: units.length,
      unitsOccupied: units.filter((unit) => unit.status === 'OCCUPIED').length,
      unitsMaintenance: units.filter((unit) => unit.status === 'MAINTENANCE').length,
      payments: payments.length,
      openDepositDisputes: depositDisputes.filter((dispute) => !['SETTLED', 'REJECTED'].includes(String(dispute.status))).length,
      activeRentIncreases: rentIncreases.filter((increase) => !['ACCEPTED', 'CANCELLED'].includes(String(increase.status))).length,
    }
  }, [moduleData])

  const unitDistribution = useMemo<ChartDatum[]>(() => {
    const units = moduleData.units ?? []
    return [
      { label: 'Occupied', value: units.filter((unit) => unit.status === 'OCCUPIED').length, color: CHART_COLORS.blue },
      { label: 'Available', value: units.filter((unit) => unit.status === 'AVAILABLE').length, color: CHART_COLORS.green },
      { label: 'Maintenance', value: units.filter((unit) => unit.status === 'MAINTENANCE').length, color: CHART_COLORS.amber },
    ]
  }, [moduleData])

  const invoiceDistribution = useMemo<ChartDatum[]>(() => {
    const invoices = moduleData.invoices ?? []
    return [
      { label: 'Paid', value: invoices.filter((invoice) => invoice.status === 'PAID').length, color: CHART_COLORS.green },
      { label: 'Pending', value: invoices.filter((invoice) => invoice.status === 'PENDING').length, color: CHART_COLORS.amber },
      { label: 'Overdue', value: invoices.filter((invoice) => invoice.status === 'OVERDUE').length, color: CHART_COLORS.red },
    ]
  }, [moduleData])

  const complaintDistribution = useMemo<ChartDatum[]>(() => {
    const complaints = moduleData.complaints ?? []
    return [
      { label: 'Open', value: complaints.filter((complaint) => complaint.status === 'OPEN').length, color: CHART_COLORS.red },
      { label: 'In progress', value: complaints.filter((complaint) => complaint.status === 'IN_PROGRESS').length, color: CHART_COLORS.amber },
      { label: 'Resolved', value: complaints.filter((complaint) => complaint.status === 'RESOLVED').length, color: CHART_COLORS.green },
    ]
  }, [moduleData])

  const revenueTrend = useMemo(() => {
    const payments = moduleData.payments ?? []
    const buckets = new Map<string, number>()
    payments.forEach((payment) => {
      if (payment.status === 'FAILED') return
      const key = monthKey(payment.paymentDate)
      if (!key) return
      buckets.set(key, (buckets.get(key) ?? 0) + Number(payment.amount ?? 0))
    })
    if (!buckets.size) return []
    return [...buckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, value]) => ({ label: monthLabel(key), value }))
  }, [moduleData])

  const readableModules = useMemo(() => relatedModules, [relatedModules])

  const moduleBars = useMemo<ChartDatum[]>(() => {
    const palette = [CHART_COLORS.teal, CHART_COLORS.blue, CHART_COLORS.violet, CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.slate]
    return readableModules.map((module, index) => ({
      label: module.title,
      value: moduleData[module.resource]?.length ?? 0,
      color: palette[index % palette.length],
    }))
  }, [moduleData, readableModules])
  const quickModules = (rolePriorityModules[session?.role ?? 'TENANT'] ?? [])
    .filter((resource) => resource === 'apartments' || readableModules.some((module) => module.resource === resource))

  const statCards = session?.role === 'TENANT'
    ? [
      { label: 'Payments', value: totals.payments, icon: <ApartmentIcon />, color: CHART_COLORS.teal },
      { label: 'Open complaints', value: totals.openComplaints, icon: <WarningIcon />, color: CHART_COLORS.amber },
      { label: 'Deposit cases', value: totals.openDepositDisputes, icon: <UnitIcon />, color: CHART_COLORS.blue },
      { label: 'Rent notices', value: totals.activeRentIncreases, icon: <PeopleIcon />, color: CHART_COLORS.violet },
    ]
    : [
      { label: 'Properties', value: totals.properties, icon: <ApartmentIcon />, color: CHART_COLORS.teal },
      { label: 'Tenants', value: totals.tenants, icon: <PeopleIcon />, color: CHART_COLORS.blue },
      { label: 'Available units', value: totals.availableUnits, icon: <UnitIcon />, color: CHART_COLORS.green },
      { label: 'Open complaints', value: totals.openComplaints, icon: <WarningIcon />, color: CHART_COLORS.red },
    ]

  const iconTile = (icon: ReactNode, color: string) => (
    <Box
      sx={{
        color,
        display: 'grid',
        placeItems: 'center',
        width: 46,
        height: 46,
        borderRadius: 3,
        bgcolor: `${color}1a`,
        fontSize: 24,
        transition: 'transform 0.3s cubic-bezier(.22,1,.36,1)',
        animation: 'kpiIconBob 3.5s ease-in-out infinite',
        '@keyframes kpiIconBob': { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-4px) rotate(4deg)' } },
        '&:hover': { transform: 'rotate(12deg) scale(1.1)' },
      }}
    >
      {icon}
    </Box>
  )

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1480 }}>
      <Stack spacing={2.5}>
        {/* Hero banner */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid color-mix(in srgb, var(--rs-primary) 18%, transparent)',
            borderRadius: '18px',
            p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(120deg, #ffffff 0%, var(--rs-primary-surface) 60%, #f3f6fa 100%)',
            animation: 'bannerIn 0.7s cubic-bezier(.22,1,.36,1) both',
            '@keyframes bannerIn': {
              from: { opacity: 0, transform: 'translateY(-18px)' },
              to: { opacity: 1, transform: 'none' },
            },
          }}
        >
          {/* Animated gradient blobs */}
          <Box
            sx={{
              position: 'absolute',
              inset: 'auto -80px -80px auto',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, color-mix(in srgb, var(--rs-primary-soft) 28%, transparent), transparent 70%)',
              animation: 'blobDrift 8s ease-in-out infinite',
              '@keyframes blobDrift': {
                '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                '50%': { transform: 'translate(-30px, -20px) scale(1.15)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: '-70px auto auto -70px',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.16), transparent 70%)',
              animation: 'blobDrift2 10s ease-in-out infinite',
              '@keyframes blobDrift2': {
                '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                '50%': { transform: 'translate(24px, 20px) scale(1.1)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: '0 auto 0 0',
              width: 6,
              background: 'linear-gradient(180deg, var(--rs-primary), var(--rs-primary-soft))',
              animation: 'accentPulse 2.5s ease-in-out infinite',
              '@keyframes accentPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
            }}
          />
          <Stack direction="row" sx={{ justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip
                label={updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Preparing data'}
                color={error ? 'error' : undefined}
                sx={{
                  fontWeight: 800,
                  bgcolor: error ? undefined : 'rgba(255,255,255,0.92)',
                  color: error ? undefined : 'var(--rs-primary)',
                  border: error ? undefined : '1px solid color-mix(in srgb, var(--rs-primary) 35%, transparent)',
                  animation: 'bannerIn 0.6s ease 0.25s both',
                }}
              />
              <Button
                variant="contained"
                startIcon={<RefreshIcon sx={{ animation: loading ? 'refreshSpin 0.9s linear infinite' : 'none', '@keyframes refreshSpin': { to: { transform: 'rotate(360deg)' } } }} />}
                onClick={loadDashboard}
                disabled={loading}
                sx={{ animation: 'bannerIn 0.6s ease 0.3s both' }}
              >
                {loading ? 'Refreshing' : 'Refresh'}
              </Button>
            </Stack>
          </Stack>
          {loading && (
            <LinearProgress
              sx={{
                mt: 2.5,
                borderRadius: 2,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, var(--rs-primary), var(--rs-primary-soft))',
                  backgroundSize: '200% 100%',
                  animation: 'progressFlow 1.4s linear infinite',
                  '@keyframes progressFlow': { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
                },
              }}
            />
          )}
        </Box>

        {error && <Alert severity="error" sx={{ animation: 'bannerIn 0.5s ease both' }}>{error}</Alert>}

        {/* KPI cards */}
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, xl: 3 }} sx={{ ...cardEnter(0.15 + index * 0.08) }}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 22px 48px rgba(15,23,42,0.12)`,
                    '& .kpi-bars': { transform: 'scaleY(1.08)', transformOrigin: 'bottom' },
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{stat.label}</Typography>
                      <Typography variant="h4">
                        <AnimatedNumber value={stat.value} />
                      </Typography>
                    </Box>
                    {iconTile(stat.icon, stat.color)}
                  </Stack>
                  <Box className="kpi-bars" sx={{ display: 'flex', gap: 0.5, mt: 1.5, alignItems: 'flex-end', height: 22, transition: 'transform 0.25s ease' }}>
                    {Array.from({ length: 8 }).map((_, bar) => (
                      <Box
                        key={bar}
                        sx={{
                          flex: 1,
                          borderRadius: '2px 2px 0 0',
                          bgcolor: `${stat.color}40`,
                          height: `${35 + ((bar * 17 + index * 29) % 60)}%`,
                          animation: `kpiBarGrow 0.5s ${0.25 + index * 0.08 + bar * 0.04}s cubic-bezier(.22,1,.36,1) both`,
                          '@keyframes kpiBarGrow': { from: { height: 0 } },
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          {/* Revenue trend */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ ...cardEnter(0.45) }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'primary.main', ...accentBarShimmer }} />
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="h6">Revenue trend</Typography>
                      <Typography color="text.secondary">Successful payment volume by month.</Typography>
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ textAlign: 'right' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                          Collected
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'success.main' }}>
                          <AnimatedNumber value={totals.collected} format={(n) => formatMoney(Math.round(n))} />
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                          Outstanding
                        </Typography>
                        <Typography variant="h6" sx={{ color: 'error.main' }}>
                          <AnimatedNumber value={totals.outstanding} format={(n) => formatMoney(Math.round(n))} />
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                  {revenueTrend.length > 1 ? (
                    <AreaChart data={revenueTrend} color={CHART_COLORS.teal} />
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                      Not enough payment history to build a trend yet.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Occupancy donut */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ ...cardEnter(0.55) }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'var(--rs-info)', ...accentBarShimmer }} />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Occupancy</Typography>
                    <Typography color="text.secondary">Unit status distribution.</Typography>
                  </Box>
                  <DonutChart
                    data={unitDistribution}
                    centerTitle={<AnimatedNumber value={totals.totalUnits} />}
                    centerSubtitle="units"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Occupancy rate</Typography>
                      <Typography variant="h6">
                        <AnimatedNumber value={totals.totalUnits ? (totals.unitsOccupied / totals.totalUnits) * 100 : 0} format={(n) => `${Math.round(n)}%`} />
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>In maintenance</Typography>
                      <Typography variant="h6">
                        <AnimatedNumber value={totals.unitsMaintenance} />
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          {/* Module records bar chart */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ ...cardEnter(0.65) }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'var(--rs-violet)', ...accentBarShimmer }} />
              <CardContent>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="h6">Records by module</Typography>
                    <Typography color="text.secondary">
                      <AnimatedNumber value={totals.totalRecords} /> records across the system.
                    </Typography>
                  </Box>
                  <BarChart data={moduleBars} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Invoice status donut */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ ...cardEnter(0.75) }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'success.main', ...accentBarShimmer }} />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Invoice status</Typography>
                    <Typography color="text.secondary">Payment health for daily review.</Typography>
                  </Box>
                  <DonutChart
                    data={invoiceDistribution}
                    size={164}
                    centerTitle={<AnimatedNumber value={totals.invoiceHealth} format={(n) => `${Math.round(n)}%`} />}
                    centerSubtitle="health"
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Collected</Typography>
                      <Typography variant="h6" sx={{ color: 'success.main' }}>
                        <AnimatedNumber value={totals.collected} format={(n) => formatMoney(Math.round(n))} />
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>Outstanding</Typography>
                      <Typography variant="h6" sx={{ color: 'error.main' }}>
                        <AnimatedNumber value={totals.outstanding} format={(n) => formatMoney(Math.round(n))} />
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Complaints horizontal bars */}
          <Grid size={{ xs: 12, md: 6, lg: 4 }} sx={{ ...cardEnter(0.85) }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'var(--rs-warning)', ...accentBarShimmer }} />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6">Complaints & maintenance</Typography>
                    <Typography color="text.secondary">Distribution by resolution stage.</Typography>
                  </Box>
                  <HorizontalBars data={complaintDistribution} />
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
                    {quickModules.map((resource, index) => {
                      let content: ReactNode = null
                      if (resource === 'apartments') {
                        content = (
                          <Button key={resource} component={Link} to="/apartments" variant="outlined" size="small">
                            Browse Apartments
                          </Button>
                        )
                      } else {
                        const module = moduleConfigs.find((item) => item.resource === resource)
                        if (module) {
                          content = (
                            <Button key={resource} component={Link} to={`/${resource}`} variant="outlined" size="small">
                              {module.title}
                            </Button>
                          )
                        }
                      }
                      return (
                        <Box
                          key={resource}
                          sx={{ animation: 'quickIn 0.5s cubic-bezier(.22,1,.36,1) both', animationDelay: `${1 + index * 0.06}s`, '@keyframes quickIn': { from: { opacity: 0, transform: 'translateY(10px) scale(0.9)' }, to: { opacity: 1, transform: 'none' } } }}
                        >
                          {content}
                        </Box>
                      )
                    })}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  )
}
