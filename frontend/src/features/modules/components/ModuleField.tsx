import type { ChangeEvent } from 'react'
import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useAuth } from '../../../shared/auth/useAuth'
import type { FieldConfig, RecordData } from '../types'
import { getReferenceLabel, getReferenceResource, getReferenceRecordLabel } from '../referenceUtils'

type ReferenceData = Record<string, RecordData[]>

function getRelationLabel(fieldName: string) {
  const labels: Record<string, string> = {
    organizationId: 'Organization',
    ownerId: 'Owner',
  }
  if (labels[fieldName]) return labels[fieldName]
  return fieldName
    .replace(/Id$/, ' ID')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (char) => char.toUpperCase())
}

function referenceLabelPlural(resource: string) {
  const labels: Record<string, string> = {
    organizations: 'organizations',
    users: 'users',
    tenants: 'tenants',
    units: 'units',
    buildings: 'buildings',
    properties: 'properties',
    agreements: 'agreements',
    invoices: 'invoices',
  }
  return labels[resource] ?? resource
}

export function ModuleField({
  field,
  references,
  form,
  value,
  onChange,
}: {
  field: FieldConfig
  references: ReferenceData
  form: RecordData
  value: unknown
  onChange: (value: string) => void
}) {
  const { session } = useAuth()
  const fieldValue = value == null ? '' : String(value)
  const referenceResource = getReferenceResource(field.name)
  const referenceOptions = referenceResource ? references[referenceResource] ?? [] : []

  function filterRelationOptions(options: RecordData[]) {
    if (field.name === 'tenantId' && session?.role === 'TENANT') {
      return options
    }
    if (field.name === 'propertyId' && form.organizationId) {
      return options.filter((item) => String(item.organizationId) === String(form.organizationId))
    }
    if (field.name === 'ownerId') {
      return options.filter((item) =>
        String(item.role ?? '').toUpperCase() === 'OWNER'
        && (!form.organizationId || String(item.organizationId) === String(form.organizationId)),
      )
    }
    if (field.name === 'buildingId' && form.propertyId) {
      return options.filter((item) => String(item.propertyId) === String(form.propertyId))
    }
    if (field.name === 'unitId' && form.buildingId) {
      return options.filter((item) => String(item.buildingId) === String(form.buildingId))
    }
    if (field.name === 'tenantId' && form.unitId) {
      return options.filter((item) => String(item.unitId) === String(form.unitId))
    }
    return options
  }

  const filteredReferenceOptions = filterRelationOptions(referenceOptions)

  function handleImageFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  if (referenceResource) {
    if (!referenceOptions.length) {
      return (
        <TextField
          fullWidth
          label={getRelationLabel(field.name)}
          value={fieldValue}
          required={field.required}
          helperText={`No ${referenceLabelPlural(referenceResource)} found yet. Create one first, then select it here.`}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    }

    const noFilteredOptions = referenceOptions.length > 0 && filteredReferenceOptions.length === 0

    return (
      <TextField
        select
        fullWidth
        label={getRelationLabel(field.name)}
        value={fieldValue}
        required={field.required}
        helperText={noFilteredOptions ? 'No matching records found for the current selection.' : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value="">Select {getRelationLabel(field.name).toLowerCase()}</MenuItem>
        {fieldValue && !filteredReferenceOptions.some((option) => String(option.id) === fieldValue) && (
          <MenuItem value={fieldValue}>{getReferenceLabel(field.name, fieldValue, references) || fieldValue}</MenuItem>
        )}
        {filteredReferenceOptions.map((option) => (
          <MenuItem key={String(option.id)} value={String(option.id)}>
            {getReferenceRecordLabel(referenceResource, option, references)}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  if (field.kind === 'select') {
    return (
      <TextField
        select
        fullWidth
        label={field.label}
        value={fieldValue}
        required={field.required}
        onChange={(event) => onChange(event.target.value)}
      >
        <MenuItem value="">Select</MenuItem>
        {field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
      </TextField>
    )
  }

  if (field.kind === 'image') {
    return (
      <Stack spacing={1.25}>
        <TextField
          fullWidth
          type="url"
          label={field.label}
          value={fieldValue}
          required={field.required}
          helperText="Paste an image URL or choose a file to preview it instantly."
          onChange={(event) => onChange(event.target.value)}
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" component="label" size="small">
            Choose image
            <input hidden accept="image/*" type="file" onChange={handleImageFile} />
          </Button>
          {fieldValue && (
            <Button variant="text" color="error" size="small" onClick={() => onChange('')}>
              Remove
            </Button>
          )}
        </Stack>
        {fieldValue && (
          <Box
            sx={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover',
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src={fieldValue}
              alt={`${field.label} preview`}
              sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}
      </Stack>
    )
  }

  const isDateField = field.kind === 'date' || field.kind === 'datetime-local'

  return (
    <TextField
      fullWidth
      multiline={field.kind === 'textarea'}
      minRows={field.kind === 'textarea' ? 4 : undefined}
      type={field.kind && field.kind !== 'textarea' ? field.kind : 'text'}
      label={field.label}
      value={fieldValue}
      required={field.required}
      onChange={(event) => {
        const nextValue = event.target.value
        onChange(isDateField ? sanitizeDateValue(nextValue) : nextValue)
      }}
      slotProps={isDateField ? { inputLabel: { shrink: true } } : undefined}
    />
  )
}

function sanitizeDateValue(value: string) {
  if (!value) return ''
  const minDate = getMinDateString()
  return value < minDate ? minDate : value
}

function getMinDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

