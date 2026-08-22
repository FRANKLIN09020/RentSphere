import { memo, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Avatar, Box, Button, Card, Chip, Stack, Typography } from '@mui/material'
import type { ModuleConfig, RecordData } from '../types'
import { DeleteIcon, DownloadIcon, EditIcon, LocationIcon } from '../../../shared/ui/AppIcons'
import { getModuleProfile, getCategoryAccent } from '../moduleProfile'
import { getInitials, formatDate, toTitle, getStatusColor, formatDetail, formatMoney } from '../../../shared/utils/format'
import { getReferenceLabel } from '../referenceUtils'
import { downloadFinancialRecord } from '../../../shared/utils/downloadDocument'
import { PayNowButton } from '../../payments/PayNowButton'
import { useAuth } from '../../../shared/auth/useAuth'

type ReferenceData = Record<string, RecordData[]>

function isRecordIdField(name: string) {
  return name === 'id'
}

function isReferenceField(name: string) {
  return name.endsWith('Id') && name !== 'id'
}

function isLiveStatus(status: string) {
  return ['OPEN', 'IN_PROGRESS', 'PENDING', 'OVERDUE'].includes(status)
}

export const ModuleRecordCard = memo(function ModuleRecordCard({
  config,
  references,
  record,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  index = 0,
  onPaid,
}: {
  config: ModuleConfig
  references: ReferenceData
  record: RecordData
  onEdit: (record: RecordData) => void
  onDelete: (id: unknown) => void
  canEdit: boolean
  canDelete: boolean
  index?: number
  onPaid?: () => void
}) {
  const { session } = useAuth()
  const profile = getModuleProfile(config)
  const accent = getCategoryAccent(profile.category)
  const imageUrl = String(record.imageUrl ?? '')
  const title = getRecordTitle(record, config, references)
  const subtitle = getRecordSubtitle(record, config, references)
  const details = getRecordDetails(record, config, references)
  const status = getRecordStatus(record, config)
  const statusColor = getStatusColor(status)
  const cardAccent = getCardAccent(title)
  const isProperty = config.resource === 'properties'
  const isFinancial = profile.category === 'financial'
  const isMaintenance = profile.category === 'maintenance'
  const isDownloadable = config.resource === 'invoices' || config.resource === 'payments'
  const live = isLiveStatus(status)
  const canPayInvoice = config.resource === 'invoices'
    && Boolean(session?.role)
    && ['PENDING', 'OVERDUE'].includes(status.toUpperCase())

  const ref = useRef<HTMLDivElement>(null)

  function moveSpotlight(event: MouseEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || !ref.current) return
    ref.current.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`)
    ref.current.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`)
  }

  return (
    <Card
      ref={ref}
      onMouseMove={moveSpotlight}
      className="module-record-card"
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transformStyle: 'preserve-3d',
        animation: 'cardPop 0.55s cubic-bezier(.22,1,.36,1) both',
        animationDelay: `${Math.min(index * 0.055, 0.5)}s`,
        '@keyframes cardPop': {
          from: { opacity: 0, transform: 'translateY(26px) scale(0.96) rotateX(4deg)' },
          to: { opacity: 1, transform: 'none' },
        },
        transition: 'transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease, border-color 0.3s ease',
        cursor: 'default',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.012)',
          boxShadow: `0 28px 64px ${cardAccent.fg}26, 0 8px 24px rgba(15,23,42,0.08)`,
          borderColor: accent.cardBorder,
          '& .card-spotlight': { opacity: 1 },
          '& .card-actions': { opacity: 1, transform: 'translateX(0)' },
        },
      }}
    >
      {/* Cursor spotlight */}
      <Box
        className="card-spotlight"
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          background: `radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${cardAccent.fg}1f, transparent 65%)`,
        }}
      />

      {imageUrl && (
        <Box
          sx={{
            width: '100%',
            height: 120,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            transition: 'transform 0.5s cubic-bezier(.22,1,.36,1)',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)',
            },
          }}
        />
      )}

      {!imageUrl && (
        <Box
          sx={{
            height: 4,
            background: `linear-gradient(90deg, ${accent.dotColor}, ${cardAccent.fg})`,
            backgroundSize: '200% 100%',
            animation: 'topBarSlide 6s ease infinite',
            '@keyframes topBarSlide': {
              '0%': { backgroundPosition: '0% 50%' },
              '100%': { backgroundPosition: '200% 50%' },
            },
          }}
        />
      )}

      <Box sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                bgcolor: cardAccent.bg,
                color: cardAccent.fg,
                fontWeight: 800,
                fontSize: 16,
                flexShrink: 0,
                boxShadow: `0 6px 16px ${cardAccent.fg}33`,
                transition: 'transform 0.3s cubic-bezier(.22,1,.36,1)',
              }}
            >
              {getInitials(title)}
            </Avatar>
            {live && (
              <Box
                sx={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  bgcolor: statusColor === 'success' ? '#15803d' : statusColor === 'error' ? '#b91c1c' : statusColor === 'warning' ? '#b45309' : '#0d9488',
                  border: '2.5px solid #fff',
                  boxShadow: `0 0 0 0 ${statusColor === 'error' ? 'rgba(185,28,28,0.5)' : statusColor === 'warning' ? 'rgba(180,83,9,0.5)' : 'rgba(13,148,136,0.5)'}`,
                  animation: 'statusPulse 1.8s ease-out infinite',
                  '@keyframes statusPulse': {
                    '0%': { boxShadow: `0 0 0 0 ${statusColor === 'error' ? 'rgba(185,28,28,0.45)' : statusColor === 'warning' ? 'rgba(180,83,9,0.45)' : 'rgba(13,148,136,0.45)'}` },
                    '100%': { boxShadow: '0 0 0 7px rgba(13,148,136,0)' },
                  },
                }}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  fontSize: '0.95rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                }}
              >
                {title}
              </Typography>
              <Chip
                size="small"
                label={status}
                color={statusColor}
                sx={{
                  height: 22,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  borderRadius: '6px',
                  flexShrink: 0,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.smallIcon} {subtitle}
            </Typography>
          </Box>
        </Stack>

        {details.length > 0 && (
          <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
            {details.map((detail, detailIndex) => (
              <Chip
                key={detail.label}
                size="small"
                label={`${detail.label}: ${detail.value}`}
                variant="outlined"
                sx={{
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  height: 24,
                  fontWeight: 600,
                  borderColor: 'rgba(148,163,184,0.3)',
                  animation: 'detailFade 0.4s ease both',
                  animationDelay: `${0.15 + detailIndex * 0.05}s`,
                  '@keyframes detailFade': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
                }}
              />
            ))}
          </Stack>
        )}

        {isMaintenance && record.status != null && (
          <Box sx={{ mt: 1.5, px: 1.5, py: 0.8, borderRadius: '10px', bgcolor: accent.accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: `${accent.dotColor}26` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Priority</Typography>
            <Chip
              size="small"
              label={String(record.status) === 'OPEN' ? 'Urgent' : String(record.status) === 'IN_PROGRESS' ? 'In progress' : 'Resolved'}
              color={String(record.status) === 'OPEN' ? 'error' : String(record.status) === 'IN_PROGRESS' ? 'warning' : 'success'}
              sx={{ height: 22, fontWeight: 700, fontSize: '0.65rem', borderRadius: '6px' }}
            />
          </Box>
        )}

        {isProperty && record.city != null && (
          <Box sx={{ mt: 1.5, px: 1.5, py: 0.8, borderRadius: '10px', bgcolor: accent.accentBg, display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: `${accent.dotColor}26` }}>
            <LocationIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {[String(record.city ?? ''), String(record.state ?? '')].filter(Boolean).join(', ')}
            </Typography>
          </Box>
        )}

        {isFinancial && record.amount != null && (
          <Box
            sx={{
              mt: 1.5,
              px: 1.5,
              py: 0.8,
              borderRadius: '10px',
              bgcolor: accent.accentBg,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid',
              borderColor: `${accent.dotColor}26`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${accent.dotColor}22, transparent)`,
                transform: 'translateX(-100%)',
                animation: 'shineSweep 3.5s ease-in-out infinite',
                '@keyframes shineSweep': { '0%': { transform: 'translateX(-100%)' }, '60%, 100%': { transform: 'translateX(100%)' } },
              },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', position: 'relative' }}>Amount</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'warning.main', position: 'relative' }}>
              {formatMoney(record.amount)}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1.2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {getRecordMeta(record)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {canPayInvoice && (
              <PayNowButton
                invoiceId={String(record.id)}
                amount={Number(record.amount)}
                onPaid={onPaid}
              />
            )}
            {(canEdit || canDelete || isDownloadable) && (
            <Stack direction="row" spacing={0.5} className="card-actions" sx={{ opacity: 0.85, transform: 'translateX(4px)', transition: 'opacity 0.25s ease, transform 0.25s ease' }}>
              {isDownloadable && (
                <Button
                  size="small"
                  onClick={() => downloadFinancialRecord(config, record, references)}
                  title={`Download ${config.resource === 'invoices' ? 'invoice' : 'receipt'} PDF`}
                  aria-label={`Download ${config.resource === 'invoices' ? 'invoice' : 'receipt'} PDF`}
                  sx={{ minWidth: 32, width: 32, height: 32, borderRadius: '9px', p: 0, color: 'text.secondary', bgcolor: 'rgba(13,148,136,0.08)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(13,148,136,0.16)', color: 'primary.main', transform: 'scale(1.1) translateY(-2px)' } }}
                >
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
              {canEdit && (
                <Button size="small" onClick={() => onEdit(record)} sx={{ minWidth: 32, width: 32, height: 32, borderRadius: '9px', p: 0, color: 'text.secondary', bgcolor: 'rgba(148,163,184,0.08)', transition: 'all 0.2s ease', '&:hover': { bgcolor: cardAccent.bg, color: cardAccent.fg, transform: 'scale(1.1) rotate(-4deg)' } }}>
                  <EditIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
              {canDelete && (
                <Button size="small" color="error" onClick={() => onDelete(record.id)} sx={{ minWidth: 32, width: 32, height: 32, borderRadius: '9px', p: 0, bgcolor: 'rgba(185,28,28,0.06)', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(185,28,28,0.14)', transform: 'scale(1.1) rotate(4deg)' } }}>
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </Button>
              )}
            </Stack>
          )}
          </Stack>
        </Stack>
      </Box>
    </Card>
  )
})

function getRecordTitle(record: RecordData, config: ModuleConfig, references: ReferenceData) {
  const candidates = ['name', 'fullName', 'title', 'email', 'unitNumber', ...config.tableColumns]
  for (const key of candidates) {
    const value = record[key]
    if (value == null || value === '') continue
    if (isReferenceField(key)) {
      return getReferenceLabel(key, value, references) || formatId(value)
    }
    return String(value)
  }
  return 'Untitled record'
}

function getRecordSubtitle(record: RecordData, config: ModuleConfig, references: ReferenceData) {
  if (config.resource === 'properties') {
    return [record.city, record.state].map((value) => String(value ?? '').trim()).filter(Boolean).join(', ') || 'Location pending'
  }
  if (config.resource === 'users') {
    return [record.role, record.email].map((value) => String(value ?? '').trim()).filter(Boolean).join(' | ') || 'Access details pending'
  }
  if (config.resource === 'organizations') {
    return [record.email, record.phone].map((value) => String(value ?? '').trim()).filter(Boolean).join(' | ') || 'Contact details pending'
  }
  return config.tableColumns
    .filter((column) => !isRecordIdField(column))
    .slice(0, 2)
    .map((key) => formatDisplayValue(key, record[key], references))
    .filter(Boolean)
    .join(' | ') || 'Details pending'
}

function getRecordDetails(record: RecordData, config: ModuleConfig, references: ReferenceData) {
  return config.tableColumns
    .filter((column) => column !== 'imageUrl' && !isRecordIdField(column))
    .slice(0, 6)
    .map((column) => ({ label: toTitle(column), value: formatCardDetailValue(column, record[column], references) }))
    .filter((detail) => detail.value !== '-')
}

function getRecordMeta(record: RecordData) {
  if (record.updatedAt) return `Updated ${formatDate(record.updatedAt)}`
  if (record.createdAt) return `Created ${formatDate(record.createdAt)}`
  return 'Record'
}

function getRecordStatus(record: RecordData, config: ModuleConfig) {
  if (config.resource === 'properties') return record.imageUrl ? 'Photo ready' : 'Needs photo'
  return String(record.status ?? record.role ?? 'Active')
}

function formatDisplayValue(fieldName: string, value: unknown, references: ReferenceData) {
  if (isReferenceField(fieldName)) {
    return getReferenceLabel(fieldName, value, references) || formatId(value)
  }
  if (fieldName === 'amount' || fieldName === 'rentAmount') {
    return formatMoney(value)
  }
  if (/phone$/i.test(fieldName)) {
    return String(value ?? '').trim() || '-'
  }
  return formatDetail(value)
}

function formatCardDetailValue(fieldName: string, value: unknown, references: ReferenceData) {
  if (isReferenceField(fieldName)) {
    return getReferenceLabel(fieldName, value, references) || formatId(value)
  }
  return formatDisplayValue(fieldName, value, references)
}

function formatId(value: unknown) {
  if (value == null || value === '') return '-'
  return String(value)
}

function getCardAccent(value: string) {
  const colors = [
    { bg: '#ecfeff', fg: '#0e7490' },
    { bg: '#f0fdf4', fg: '#15803d' },
    { bg: '#ccfbf1', fg: '#0f766e' },
    { bg: '#eff6ff', fg: '#1d4ed8' },
    { bg: '#faf5ff', fg: '#7c3aed' },
    { bg: '#fef2f2', fg: '#b91c1c' },
  ]
  const index = value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}
