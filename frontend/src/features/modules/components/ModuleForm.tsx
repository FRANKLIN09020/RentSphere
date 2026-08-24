import type { FormEvent } from 'react'
import { Alert, Box, Button, Card, Grid, Stack, Typography } from '@mui/material'
import type { FieldConfig, ModuleConfig, RecordData } from '../types'
import { SaveIcon } from '../../../shared/ui/AppIcons'
import { ModuleField } from './ModuleField'
import { getModuleProfile, getCategoryAccent } from '../moduleProfile'

type ReferenceData = Record<string, RecordData[]>

export function ModuleForm({
  config,
  references,
  editing,
  form,
  message,
  error,
  visibleFields,
  canCreate,
  onFieldChange,
  onSubmit,
  onClear,
}: {
  config: ModuleConfig
  references: ReferenceData
  editing: RecordData | null
  form: RecordData
  message: string
  error: string
  visibleFields: FieldConfig[]
  canCreate: boolean
  onFieldChange: (name: string, value: string) => void
  onSubmit: (event: FormEvent) => void
  onClear: () => void
}) {
  if (!canCreate && !editing) return null

  const profile = getModuleProfile(config)
  const accent = getCategoryAccent(profile.category)
  const isEditing = Boolean(editing)

  return (
    <Card
      sx={{
        position: { lg: 'sticky' },
        top: { lg: 96 },
        overflow: 'hidden',
        animation: 'slideIn 0.4s cubic-bezier(.22,1,.36,1)',
        '@keyframes slideIn': {
          from: { opacity: 0, transform: 'translateX(-16px) translateY(8px)' },
          to: { opacity: 1, transform: 'none' },
        },
      }}
    >
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${accent.dotColor}, transparent)` }} />
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5} component="form" onSubmit={onSubmit}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                width: 38,
                height: 38,
                borderRadius: '11px',
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                background: accent.gradient,
                boxShadow: `0 6px 18px ${accent.dotColor}44`,
                animation: 'formIconPulse 3s ease-in-out infinite',
                '@keyframes formIconPulse': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.06)' } },
              }}
            >
              {profile.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                {isEditing ? `Edit ${profile.itemLabel}` : `Add ${profile.itemLabel}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isEditing ? `Update this ${profile.itemLabel}` : `Create a new ${profile.itemLabel}`}
              </Typography>
            </Box>
          </Stack>

          {message && (
            <Alert severity="success" sx={{ borderRadius: '10px', py: 0.5, animation: 'alertIn 0.3s ease', '@keyframes alertIn': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'none' } } }}>{message}</Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ borderRadius: '10px', py: 0.5, animation: 'alertIn 0.3s ease', '@keyframes alertIn': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'none' } } }}>{error}</Alert>
          )}

          <Grid container spacing={1.5}>
            {visibleFields.map((field, index) => (
              <Grid key={field.name} size={{ xs: 12, sm: field.full ? 12 : 6, lg: 12 }} sx={{ animation: 'fieldIn 0.35s ease both', animationDelay: `${0.06 + index * 0.04}s`, '@keyframes fieldIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } } }}>
                <ModuleField
                  resource={config.resource}
                  field={field}
                  references={references}
                  form={form}
                  value={form[field.name]}
                  onChange={(value) => onFieldChange(field.name, value)}
                />
              </Grid>
            ))}
          </Grid>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SaveIcon />}
              sx={{
                borderRadius: '10px',
                fontWeight: 700,
                background: accent.gradient,
                transition: 'all 0.22s ease',
                '&:hover': { transform: 'translateY(-2px) scale(1.01)', boxShadow: `0 10px 26px ${accent.dotColor}55` },
              }}
            >
              {isEditing ? `Update ${profile.itemLabel}` : `Save ${profile.itemLabel}`}
            </Button>
            <Button
              variant="outlined"
              type="button"
              onClick={onClear}
              sx={{ borderRadius: '10px', fontWeight: 700, transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)' } }}
            >
              Clear
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Card>
  )
}
