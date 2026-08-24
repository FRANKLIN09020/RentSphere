import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, Grid, MenuItem, Stack, TablePagination, TextField, Typography } from '@mui/material'
import { useAuth } from '../../shared/auth/useAuth'
import { canCreateModule, canEditModule, canManageModule } from './moduleAccess'
import type { ModuleConfig } from './types'
import { getModuleProfile, getCategoryAccent } from './moduleProfile'
import { useModuleData } from './hooks/useModuleData'
import { useModuleForm } from './hooks/useModuleForm'
import { useModuleSearch } from './hooks/useModuleSearch'
import { ModuleToolbar } from './components/ModuleToolbar'
import { ModuleForm } from './components/ModuleForm'
import { ModuleRecordCard } from './components/ModuleRecordCard'
import { ModuleSearch } from './components/ModuleSearch'
import { ModuleEmptyState } from './components/ModuleEmptyState'
import { ModuleStats } from './components/ModuleStats'

function isRecordIdField(name: string) {
  return name === 'id'
}

export function ModulePage({ config }: { config: ModuleConfig }) {
  const { session } = useAuth()
  const profile = getModuleProfile(config)
  const accent = getCategoryAccent(profile.category)
  const { records, references, loading, error: loadError, lastUpdated, loadRecords } = useModuleData(config)
  const {
    editing, form, message, error: formError,
    startCreate, startEdit, setField, handleSubmit, handleDelete,
  } = useModuleForm(config.resource, loadRecords, {
    organizationId: session?.organizationId,
  })
  const { query, setQuery, filteredRecords } = useModuleSearch(config, records)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(8)

  useEffect(() => {
    const organizationId = String(form.organizationId ?? '')
    if (config.resource === 'properties') {
      autoSelectRelatedRecord(
        organizationId,
        form.ownerId,
        (references.users ?? []).filter((user) => String(user.role ?? '').toUpperCase() === 'OWNER'),
        'ownerId',
        setField,
      )
    } else if (config.resource === 'buildings') {
      autoSelectRelatedRecord(organizationId, form.propertyId, references.properties ?? [], 'propertyId', setField)
    } else if (config.resource === 'units') {
      autoSelectRelatedRecord(organizationId, form.buildingId, references.buildings ?? [], 'buildingId', setField)
    }
  }, [
    config.resource,
    form.organizationId,
    form.ownerId,
    form.propertyId,
    form.buildingId,
    references.users,
    references.properties,
    references.buildings,
    setField,
  ])

  const filterFields = useMemo(() => config.fields.filter((field) =>
    field.kind === 'select' && records.some((record) => record[field.name] != null && record[field.name] !== ''),
  ), [config.fields, records])
  const refinedRecords = useMemo(() => filteredRecords.filter((record) =>
    filterFields.every((field) => !filters[field.name]
      || String(record[field.name] ?? '').toUpperCase() === filters[field.name].toUpperCase()),
  ), [filteredRecords, filterFields, filters])
  const pagedRecords = refinedRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const visibleFields = useMemo(
    () => config.fields.filter((field) => {
      if (isRecordIdField(field.name)) return false
      if (session?.role === 'TENANT' && config.resource === 'rent-increases') {
        return field.name === 'tenantResponse' || field.name === 'status'
      }
      if (session?.role === 'TENANT' && config.resource === 'complaints') {
        return field.name === 'title' || field.name === 'description'
      }
      if (!editing && field.name === 'organizationId' && session?.organizationId && config.resource !== 'organizations') {
        return false
      }
      return true
    }).map((field) => session?.role === 'TENANT'
      && config.resource === 'rent-increases'
      && field.name === 'status'
      ? { ...field, options: ['ACCEPTED', 'DISPUTED'] }
      : field),
    [config.fields, editing, session?.organizationId, session?.role, config.resource],
  )

  const canCreate = canCreateModule(session?.role, config.resource)
  const canEdit = canEditModule(session?.role, config.resource)
  const canDelete = canManageModule(session?.role, config.resource)
  const showForm = canCreate || editing

  return (
    <Box
      component="section"
      sx={{
        p: { xs: 2, md: 3.5 },
        maxWidth: 1480,
        animation: 'pageEnter 0.45s ease',
        '@keyframes pageEnter': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Stack spacing={2.5}>
        <ModuleToolbar
          config={config}
          loading={loading}
          error={loadError}
          lastUpdated={lastUpdated}
          canCreate={canCreate}
          onRefresh={loadRecords}
          onCreate={startCreate}
        />

        <ModuleStats config={config} records={records} loading={loading} />

        <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
          {showForm && (
            <Grid size={{ xs: 12, lg: 4 }}>
              <ModuleForm
                config={config}
                references={references}
                editing={editing}
                form={form}
                message={message}
                error={formError}
                visibleFields={visibleFields}
                canCreate={canCreate}
                onFieldChange={setField}
                onSubmit={handleSubmit}
                onClear={startCreate}
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, lg: showForm ? 8 : 12 }}>
            <Card sx={{ overflow: 'hidden', borderRadius: '18px', animation: 'listFade 0.5s ease both', animationDelay: '0.1s', '@keyframes listFade': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } } }}>
              <Box sx={{ height: 3.5, background: accent.gradient }} />
              <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {loading ? 'Loading records...' : `${refinedRecords.length} of ${records.length} ${profile.itemLabelPlural} shown`}
                    </Typography>
                  </Box>
                  <ModuleSearch
                    value={query}
                    onChange={(value) => { setQuery(value); setPage(0) }}
                    placeholder={profile.searchPlaceholder}
                  />
                </Stack>

                {filterFields.length > 0 && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} useFlexGap sx={{ mb: 2, flexWrap: 'wrap', alignItems: { sm: 'center' } }}>
                    {filterFields.map((field) => {
                      const values = Array.from(new Set(records.map((record) => String(record[field.name] ?? '')).filter(Boolean))).sort()
                      return (
                        <TextField
                          key={field.name}
                          select
                          size="small"
                          label={field.label}
                          value={filters[field.name] ?? ''}
                          onChange={(event) => { setFilters((current) => ({ ...current, [field.name]: event.target.value })); setPage(0) }}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="">All {field.label.toLowerCase()}</MenuItem>
                          {values.map((value) => <MenuItem key={value} value={value}>{value.replace(/_/g, ' ')}</MenuItem>)}
                        </TextField>
                      )
                    })}
                    {Object.values(filters).some(Boolean) && (
                      <Button size="small" onClick={() => { setFilters({}); setPage(0) }}>Clear filters</Button>
                    )}
                  </Stack>
                )}

                <Grid container spacing={2}>
                  {pagedRecords.map((record, idx) => (
                    <Grid key={String(record.id)} size={{ xs: 12, md: 6 }}>
                      <ModuleRecordCard
                        config={config}
                        references={references}
                        record={record}
                        onEdit={startEdit}
                        onDelete={handleDelete}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        index={idx}
                        onPaid={() => void loadRecords()}
                      />
                    </Grid>
                  ))}
                  {!refinedRecords.length && (
                    <Grid size={{ xs: 12 }}>
                      <ModuleEmptyState
                        itemLabel={profile.itemLabel}
                        itemLabelPlural={profile.itemLabelPlural}
                      />
                    </Grid>
                  )}
                </Grid>
                {refinedRecords.length > 0 && (
                  <TablePagination
                    component="div"
                    count={refinedRecords.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[4, 8, 12, 24]}
                    onPageChange={(_, nextPage) => setPage(nextPage)}
                    onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }}
                    sx={{ mt: 1, borderTop: 1, borderColor: 'divider' }}
                  />
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  )
}

function autoSelectRelatedRecord(
  organizationId: string,
  currentValue: unknown,
  candidates: Record<string, unknown>[],
  fieldName: string,
  setField: (name: string, value: string) => void,
) {
  const matchingRecords = candidates.filter((record) =>
    String(record.organizationId ?? '') === organizationId,
  )
  const currentValueIsValid = matchingRecords.some((record) => String(record.id) === String(currentValue ?? ''))

  if (matchingRecords.length === 1 && !currentValueIsValid) {
    setField(fieldName, String(matchingRecords[0].id))
  } else if ((!organizationId || !currentValueIsValid) && currentValue) {
    setField(fieldName, '')
  }
}
