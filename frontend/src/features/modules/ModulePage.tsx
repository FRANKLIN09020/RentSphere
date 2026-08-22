import { useMemo } from 'react'
import { Box, Card, Grid, Stack, Typography } from '@mui/material'
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

  const visibleFields = useMemo(
    () => config.fields.filter((field) => {
      if (isRecordIdField(field.name)) return false
      if (!editing && field.name === 'organizationId' && session?.organizationId && config.resource !== 'organizations') {
        return false
      }
      return true
    }),
    [config.fields, editing, session?.organizationId, config.resource],
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
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                      {profile.inventoryTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {loading ? 'Loading records...' : `${filteredRecords.length} of ${records.length} ${profile.itemLabelPlural} shown`}
                    </Typography>
                  </Box>
                  <ModuleSearch
                    value={query}
                    onChange={setQuery}
                    placeholder={profile.searchPlaceholder}
                  />
                </Stack>

                <Grid container spacing={2}>
                  {filteredRecords.map((record, idx) => (
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
                  {!filteredRecords.length && (
                    <Grid size={{ xs: 12 }}>
                      <ModuleEmptyState
                        itemLabel={profile.itemLabel}
                        itemLabelPlural={profile.itemLabelPlural}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  )
}
