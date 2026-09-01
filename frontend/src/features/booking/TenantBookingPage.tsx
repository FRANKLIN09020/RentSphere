import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import MapOutlined from '@mui/icons-material/MapOutlined'
import SearchRounded from '@mui/icons-material/SearchRounded'
import ViewListRounded from '@mui/icons-material/ViewListRounded'
import { getErrorMessage, http } from '../../shared/api/http'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ApartmentIcon, ImageIcon, LocationIcon, SaveIcon } from '../../shared/ui/AppIcons'
import { formatMoney } from '../../shared/utils/format'
import type { RecordData } from '../modules/types'
import { parseBookingAssistantMessage } from './aiBookingAssistant'
import { useLanguage } from '../../shared/i18n/language-context'

type BookingForm = {
  propertyId: string
  unitId: string
  visitDate: string
  visitTime: string
  note: string
}

const initialForm: BookingForm = {
  propertyId: '',
  unitId: '',
  visitDate: '',
  visitTime: '',
  note: '',
}

const assistantSuggestions = [
  { label: 'Show Chennai', prompt: 'Show Chennai' },
  { label: 'Find apartments', prompt: 'Find apartments' },
  { label: 'Available properties', prompt: 'Show available properties' },
  { label: 'Show map', prompt: 'Show all properties on the map' },
  { label: 'Book a visit', prompt: 'Help me book a visit' },
  { label: 'What can I ask?', prompt: 'What can I ask?' },
]

export function TenantBookingPage() {
  const { t } = useLanguage()
  const [properties, setProperties] = useState<RecordData[]>([])
  const [buildings, setBuildings] = useState<RecordData[]>([])
  const [units, setUnits] = useState<RecordData[]>([])
  const [form, setForm] = useState<BookingForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantStatus, setAssistantStatus] = useState('')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [listingQuery, setListingQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [listingPage, setListingPage] = useState(0)
  const [listingsPerPage, setListingsPerPage] = useState(6)
  const loadListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [propertiesResponse, buildingsResponse, unitsResponse] = await Promise.all([
        http.get<RecordData[]>('/properties'),
        http.get<RecordData[]>('/buildings'),
        http.get<RecordData[]>('/units'),
      ])
      setProperties(propertiesResponse.data)
      setBuildings(buildingsResponse.data)
      setUnits(unitsResponse.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadListings()
    }, 0)
    const interval = window.setInterval(() => {
      void loadListings()
    }, 15000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [loadListings])

  const buildingById = useMemo(
    () => new Map(buildings.map((building) => [String(building.id), building])),
    [buildings],
  )

  const availableUnits = useMemo(
    () => units.filter((unit) => {
      const status = String(unit.status ?? '').toUpperCase()
      return !status || status === 'AVAILABLE'
    }),
    [units],
  )

  const selectedPropertyUnits = useMemo(() => {
    if (!form.propertyId) return availableUnits
    return availableUnits.filter((unit) => {
      const building = buildingById.get(String(unit.buildingId))
      return String(building?.propertyId ?? '') === form.propertyId
    })
  }, [availableUnits, buildingById, form.propertyId])

  const cities = useMemo(() => Array.from(new Set(properties.map((property) => String(property.city ?? '')).filter(Boolean))).sort(), [properties])
  const filteredProperties = useMemo(() => properties.filter((property) => {
    const query = listingQuery.trim().toLowerCase()
    const matchesQuery = !query || [property.name, property.address, property.city, property.state, property.amenities]
      .some((value) => String(value ?? '').toLowerCase().includes(query))
    const matchesCity = cityFilter === 'ALL' || String(property.city) === cityFilter
    const matchesType = typeFilter === 'ALL' || String(property.propertyType ?? 'APARTMENT') === typeFilter
    const matchesAvailability = !availableOnly || availableUnits.some((unit) => {
      const building = buildingById.get(String(unit.buildingId))
      return String(building?.propertyId ?? '') === String(property.id)
    })
    return matchesQuery && matchesCity && matchesType && matchesAvailability
  }), [properties, listingQuery, cityFilter, typeFilter, availableOnly, availableUnits, buildingById])
  const pagedProperties = filteredProperties.slice(listingPage * listingsPerPage, listingPage * listingsPerPage + listingsPerPage)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)
    try {
      await http.post('/booking-requests', {
        propertyId: form.propertyId,
        unitId: form.unitId,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        note: form.note || null,
      })
      setMessage('Visit request sent to admin and owner for review.')
      setForm(initialForm)
      setAssistantInput('')
      setAssistantStatus('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssistantSubmit(event: FormEvent) {
    event.preventDefault()
    await runAssistant(assistantInput)
  }

  async function runAssistant(message: string) {
    if (/\b(what can (i|you) (ask|do)|help me|show examples)\b/i.test(message)) {
      setAssistantStatus(t('Assistant help message'))
      setAssistantInput('')
      return
    }

    const discovery = parseDiscoveryRequest(message, cities)
    if (discovery.isDiscoveryRequest) {
      setCityFilter(discovery.city ?? 'ALL')
      setTypeFilter(discovery.propertyType ?? 'ALL')
      setAvailableOnly(discovery.availableOnly)
      setListingQuery('')
      setListingPage(0)
      setViewMode('map')
      setAssistantStatus(discovery.message)
      setAssistantInput('')
      return
    }

    const parsed = parseBookingAssistantMessage(message, properties, availableUnits, buildings, form)
    setAssistantStatus(parsed.message)

    if (parsed.propertyId) {
      setForm((current) => ({ ...current, propertyId: parsed.propertyId ?? '', unitId: parsed.unitId ?? '' }))
    }

    if (parsed.visitDate || parsed.visitTime || parsed.note) {
      setForm((current) => ({
        ...current,
        visitDate: parsed.visitDate ?? current.visitDate,
        visitTime: parsed.visitTime ?? current.visitTime,
        note: parsed.note ?? current.note,
      }))
    }

    if (!parsed.shouldSubmit) {
      setAssistantInput('')
      return
    }

    setAssistantBusy(true)
    try {
      await http.post('/booking-requests', {
        propertyId: parsed.propertyId,
        unitId: parsed.unitId,
        visitDate: parsed.visitDate,
        visitTime: parsed.visitTime,
        note: parsed.note || null,
      })
      setMessage('Visit request sent to admin and owner for review.')
      setForm(initialForm)
      setAssistantInput('')
      setAssistantStatus('Booking request submitted successfully.')
    } catch (err) {
      setError(getErrorMessage(err))
      setAssistantStatus('I could not submit that request. Please review the details and try again.')
    } finally {
      setAssistantBusy(false)
    }
  }

  function selectProperty(propertyId: unknown) {
    setForm((current) => ({ ...current, propertyId: String(propertyId ?? ''), unitId: '' }))
  }

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1480 }}>
      <Stack spacing={2.5}>
        <Box sx={{
          position: 'relative', overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 3,
          p: { xs: 2.5, md: 4 }, color: 'common.white',
          background: 'linear-gradient(120deg, #0f172a 0%, #164e63 55%, #0e7490 100%)',
        }}>
          <Box sx={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.07)', right: -70, top: -120 }} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ position: 'relative', alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5 }}>{t('Property discovery')}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.75 }}>{t('Find a place that feels like home')}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.78)', maxWidth: 650 }}>{t('Explore verified rentals, compare available units, and request a visit in minutes.')}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`${filteredProperties.length} ${t('properties')}`} sx={{ bgcolor: 'rgba(255,255,255,.14)', color: 'common.white', fontWeight: 700 }} />
              <Chip label={loading ? t('Refreshing') : `${availableUnits.length} ${t('units available')}`} sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 800 }} />
            </Stack>
          </Stack>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Box>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 2.5, boxShadow: '0 8px 30px rgba(15,23,42,.05)' }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{t('Smart visit assistant')}</Typography>
                <Typography color="text.secondary">{t('Search the map or describe a property and preferred time to prepare a visit request.')}</Typography>
              </Box>
              <Stack component="form" spacing={1.5} onSubmit={handleAssistantSubmit}>
                <TextField
                  label={t('Ask the assistant')}
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  placeholder='Try “Show houses in Chennai” or “Book GreenNest tomorrow at 3 pm”'
                  multiline
                  minRows={2}
                />
                <Button type="submit" variant="outlined" disabled={assistantBusy || !assistantInput.trim()}>
                  {assistantBusy ? 'Working…' : t('Ask assistant')}
                </Button>
              </Stack>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 800 }}>{t('Try asking')}</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {assistantSuggestions.map((suggestion) => (
                    <Chip
                      key={suggestion.prompt}
                      label={t(suggestion.label)}
                      variant="outlined"
                      clickable
                      disabled={assistantBusy}
                      onClick={() => void runAssistant(suggestion.prompt)}
                      sx={{ '&:hover': { bgcolor: 'primary.50', borderColor: 'primary.main' } }}
                    />
                  ))}
                </Stack>
              </Box>
              {assistantStatus && <Alert severity="info">{assistantStatus}</Alert>}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ p: 2, mb: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 30px rgba(15,23,42,.06)' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  size="small"
                  placeholder={t('Search by property, locality or amenity')}
                  value={listingQuery}
                  onChange={(event) => { setListingQuery(event.target.value); setListingPage(0) }}
                  fullWidth
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
                />
                <TextField select size="small" label={t('City')} value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setListingPage(0) }} sx={{ minWidth: 180 }}>
                  <MenuItem value="ALL">{t('All cities')}</MenuItem>
                  {cities.map((city) => <MenuItem key={city} value={city}>{city}</MenuItem>)}
                </TextField>
                <TextField select size="small" label={t('Property type')} value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setListingPage(0) }} sx={{ minWidth: 190 }}>
                  <MenuItem value="ALL">{t('All types')}</MenuItem>
                  {['APARTMENT', 'INDEPENDENT_HOUSE', 'VILLA', 'STUDIO', 'PG_ROOM'].map((type) => <MenuItem key={type} value={type}>{t(formatPropertyType(type))}</MenuItem>)}
                </TextField>
                {(listingQuery || cityFilter !== 'ALL' || typeFilter !== 'ALL' || availableOnly) && <Button onClick={() => { setListingQuery(''); setCityFilter('ALL'); setTypeFilter('ALL'); setAvailableOnly(false); setListingPage(0) }}>{t('Clear')}</Button>}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary"><strong>{filteredProperties.length}</strong> {t('matching properties')}</Typography>
                  {availableOnly && <Chip size="small" color="success" label={t('Available only')} />}
                </Stack>
                <ToggleButtonGroup exclusive size="small" value={viewMode} onChange={(_, value) => value && setViewMode(value)} aria-label="Listing view">
                  <ToggleButton value="list" aria-label="List view"><ViewListRounded fontSize="small" sx={{ mr: 0.75 }} /> {t('List')}</ToggleButton>
                  <ToggleButton value="map" aria-label="Map view"><MapOutlined fontSize="small" sx={{ mr: 0.75 }} /> {t('Map')}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Card>
            {viewMode === 'map' && (
              <PropertyMap
                properties={filteredProperties}
                availableUnits={availableUnits}
                buildingById={buildingById}
                selectedPropertyId={form.propertyId}
                onSelect={selectProperty}
              />
            )}
            {viewMode === 'list' && <Grid container spacing={2}>
              {pagedProperties.map((property) => (
                <Grid key={String(property.id)} size={{ xs: 12, md: 6 }}>
                  <PropertyListingCard
                    property={property}
                    units={availableUnits.filter((unit) => {
                      const building = buildingById.get(String(unit.buildingId))
                      return String(building?.propertyId ?? '') === String(property.id)
                    })}
                    selected={form.propertyId === String(property.id)}
                    onSelect={() => selectProperty(property.id)}
                  />
                </Grid>
              ))}
              {!filteredProperties.length && !loading && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 4, textAlign: 'center' }}>
                    <Typography variant="h6">{t('No properties available')}</Typography>
                    <Typography color="text.secondary">{t('Please check again later.')}</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>}
            {viewMode === 'list' && filteredProperties.length > 0 && <TablePagination component="div" count={filteredProperties.length} page={listingPage} rowsPerPage={listingsPerPage} rowsPerPageOptions={[4, 6, 12, 24]} onPageChange={(_, page) => setListingPage(page)} onRowsPerPageChange={(event) => { setListingsPerPage(Number(event.target.value)); setListingPage(0) }} />}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: '0 12px 40px rgba(15,23,42,.08)' }}>
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                  <Box>
                    <Typography variant="h6">{t('Book a visit')}</Typography>
                    <Typography color="text.secondary">{t('Admin and owner will be notified after submission.')}</Typography>
                  </Box>
                  <TextField
                    select
                    label={t('Property')}
                    value={form.propertyId}
                    required
                    onChange={(event) => setForm({ ...form, propertyId: event.target.value, unitId: '' })}
                  >
                    <MenuItem value="">{t('Select property')}</MenuItem>
                    {properties.map((property) => (
                      <MenuItem key={String(property.id)} value={String(property.id)}>{String(property.name ?? 'Property')}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label={t('Available unit')}
                    value={form.unitId}
                    required
                    disabled={!form.propertyId}
                    onChange={(event) => setForm({ ...form, unitId: event.target.value })}
                  >
                    <MenuItem value="">{t('Select unit')}</MenuItem>
                    {selectedPropertyUnits.map((unit) => (
                      <MenuItem key={String(unit.id)} value={String(unit.id)}>
                        Unit {String(unit.unitNumber ?? '-')} - Rent {formatMoney(unit.rentAmount)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    label={t('Visiting date')}
                    value={form.visitDate}
                    required
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setForm({ ...form, visitDate: sanitizeDateValue(nextValue) })
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    type="time"
                    label={t('Visiting time')}
                    value={form.visitTime}
                    required
                    onChange={(event) => setForm({ ...form, visitTime: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label={t('Note')}
                    value={form.note}
                    multiline
                    minRows={3}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                  />
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
                    {submitting ? 'Sending request' : t('Send booking request')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  )
}

function PropertyListingCard({
  property,
  units,
  selected,
  onSelect,
}: {
  property: RecordData
  units: RecordData[]
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useLanguage()
  const imageUrl = String(property.imageUrl ?? '')
  const rents = units.map((unit) => Number(unit.rentAmount)).filter((rent) => Number.isFinite(rent) && rent > 0)
  const startingRent = rents.length ? Math.min(...rents) : null
  const amenities = String(property.amenities ?? '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3)

  return (
    <Card sx={{
      height: '100%', overflow: 'hidden', borderRadius: 2.5, border: '1px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      boxShadow: selected ? '0 12px 32px rgba(14,116,144,.18)' : '0 8px 26px rgba(15,23,42,.06)',
      transition: 'transform .2s ease, box-shadow .2s ease',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 16px 38px rgba(15,23,42,.12)' },
    }}>
      <Box sx={{ aspectRatio: '16 / 9', bgcolor: 'action.hover', position: 'relative' }}>
        {imageUrl ? (
          <Box component="img" src={imageUrl} alt={String(property.name ?? 'Property')} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Stack spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <ImageIcon />
            <Typography variant="body2" sx={{ fontWeight: 800 }}>Property image pending</Typography>
          </Stack>
        )}
        <Chip
          size="small"
          label={t(formatPropertyType(String(property.propertyType ?? 'APARTMENT')))}
          sx={{ position: 'absolute', left: 12, top: 12, bgcolor: 'rgba(255,255,255,.94)', fontWeight: 800, boxShadow: 1 }}
        />
      </Box>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{String(property.name ?? 'Property')}</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <LocationIcon fontSize="small" />
              <Typography variant="body2">{[property.city, property.state].map((value) => String(value ?? '').trim()).filter(Boolean).join(', ') || 'Location pending'}</Typography>
            </Stack>
          </Box>
          <Typography variant="body2" color="text.secondary" noWrap>{String(property.address ?? '')}</Typography>
          {!!amenities.length && (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              {amenities.map((amenity) => <Chip key={amenity} size="small" variant="outlined" label={amenity} />)}
            </Stack>
          )}
          <Divider />
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t(startingRent ? 'Rent starts from' : 'Availability')}</Typography>
              <Typography sx={{ fontWeight: 800, color: units.length ? 'text.primary' : 'text.secondary' }}>
                {startingRent ? `${formatMoney(startingRent)} / ${t('month')}` : t('No units available')}
              </Typography>
            </Box>
            <Stack spacing={0.75} sx={{ alignItems: 'flex-end' }}>
              <Chip icon={<ApartmentIcon />} size="small" label={`${units.length} ${t('available')}`} color={units.length ? 'success' : 'warning'} variant="outlined" />
              <Button size="small" variant={selected ? 'contained' : 'outlined'} onClick={onSelect} disabled={!units.length}>
                {t(selected ? 'Selected' : 'Choose property')}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

function PropertyMap({
  properties,
  availableUnits,
  buildingById,
  selectedPropertyId,
  onSelect,
}: {
  properties: RecordData[]
  availableUnits: RecordData[]
  buildingById: Map<string, RecordData>
  selectedPropertyId: string
  onSelect: (propertyId: unknown) => void
}) {
  const { t } = useLanguage()
  const mappedProperties = properties.filter((property) => {
    if (property.latitude === null || property.latitude === undefined || property.latitude === '' ||
        property.longitude === null || property.longitude === undefined || property.longitude === '') return false
    const latitude = Number(property.latitude)
    const longitude = Number(property.longitude)
    return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
  })

  if (!mappedProperties.length) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('Add latitude and longitude to a property to display it on the interactive map.')}
      </Alert>
    )
  }

  const bounds = mappedProperties.map((property) => [Number(property.latitude), Number(property.longitude)] as [number, number])

  return (
    <Card sx={{ mb: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="h6">{t('Property map')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('Select a marker to choose a property for your visit.')}</Typography>
      </Box>
      <MapContainer center={bounds[0]} zoom={12} scrollWheelZoom style={{ height: 390, width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitMapBounds bounds={bounds} />
        {mappedProperties.map((property) => {
          const id = String(property.id)
          const propertyUnits = availableUnits.filter((unit) => {
            const building = buildingById.get(String(unit.buildingId))
            return String(building?.propertyId ?? '') === id
          })
          const rents = propertyUnits.map((unit) => Number(unit.rentAmount)).filter((rent) => Number.isFinite(rent) && rent > 0)
          const startingRent = rents.length ? Math.min(...rents) : null
          const imageUrl = String(property.imageUrl ?? '').trim()
          const location = [property.address, property.city, property.state]
            .map((value) => String(value ?? '').trim()).filter(Boolean).join(', ')
          const amenities = String(property.amenities ?? '').split(',').map((amenity) => amenity.trim()).filter(Boolean).slice(0, 3)
          return (
            <CircleMarker
              key={id}
              center={[Number(property.latitude), Number(property.longitude)]}
              radius={selectedPropertyId === id ? 12 : 9}
              pathOptions={{ color: selectedPropertyId === id ? '#7c2d12' : '#0369a1', fillOpacity: 0.85 }}
              eventHandlers={{ click: () => onSelect(property.id) }}
            >
              <Popup minWidth={280} maxWidth={320}>
                <Box sx={{ width: 280, overflow: 'hidden' }}>
                  <Box sx={{ height: 138, mx: -2.5, mt: -1.75, mb: 1.5, bgcolor: 'action.hover' }}>
                    {imageUrl ? (
                      <Box component="img" src={imageUrl} alt={String(property.name ?? 'Property')}
                        sx={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                    ) : (
                      <Stack sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                        <ImageIcon />
                        <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 700 }}>{t('Property image pending')}</Typography>
                      </Stack>
                    )}
                  </Box>
                  <Stack spacing={1.1}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.25 }}>
                        {String(property.name ?? 'Property')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(formatPropertyType(String(property.propertyType ?? 'APARTMENT')))}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                      <LocationIcon fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ lineHeight: 1.35 }}>{location || t('Location pending')}</Typography>
                    </Stack>
                    {!!amenities.length && (
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.6 }}>
                        {amenities.map((amenity) => <Chip key={amenity} label={amenity} size="small" variant="outlined" />)}
                      </Stack>
                    )}
                    <Divider />
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {startingRent ? t('Rent starts from') : t('Availability')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          {startingRent ? `${formatMoney(startingRent)} / ${t('month')}` : t('No units available')}
                        </Typography>
                      </Box>
                      <Chip size="small" color={propertyUnits.length ? 'success' : 'warning'}
                        label={`${propertyUnits.length} ${t('available')}`} />
                    </Stack>
                    <Button fullWidth size="small" variant={selectedPropertyId === id ? 'contained' : 'outlined'}
                      disabled={!propertyUnits.length} onClick={() => onSelect(property.id)}>
                      {t(selectedPropertyId === id ? 'Selected' : 'Choose property')}
                    </Button>
                  </Stack>
                </Box>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </Card>
  )
}

function FitMapBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }, [bounds, map])
  return null
}

function formatPropertyType(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function parseDiscoveryRequest(message: string, cities: string[]) {
  const normalized = message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const isDiscoveryRequest = /\b(show|find|display|view|see|explore|list|map)\b/.test(normalized) &&
    !/\b(book|visit|schedule|appointment)\b/.test(normalized)

  if (!isDiscoveryRequest) return { isDiscoveryRequest: false, availableOnly: false, message: '' }

  const words = normalized.split(' ')
  const city = cities.find((candidate) => {
    const cityName = candidate.toLowerCase()
    return normalized.includes(cityName) || words.some((word) => word.length >= 4 && editDistance(word, cityName) <= 2)
  })

  const typeAliases: Array<[RegExp, string]> = [
    [/\b(apartment|apartments|flat|flats)\b/, 'APARTMENT'],
    [/\b(independent house|independent houses|house|houses|home|homes)\b/, 'INDEPENDENT_HOUSE'],
    [/\b(villa|villas)\b/, 'VILLA'],
    [/\b(studio|studios)\b/, 'STUDIO'],
    [/\b(pg|paying guest|room|rooms)\b/, 'PG_ROOM'],
  ]
  const propertyType = typeAliases.find(([pattern]) => pattern.test(normalized))?.[1]
  const availableOnly = /\b(available|availability|vacant)\b/.test(normalized)

  const target = [propertyType ? formatPropertyType(propertyType) : '', city ?? '']
    .filter(Boolean).join(' properties in ')
  return {
    isDiscoveryRequest: true,
    city,
    propertyType,
    availableOnly,
    message: city || propertyType
      ? `Showing ${target || 'matching properties'} on the map.`
      : 'Showing all available properties on the map.',
  }
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0]
    previous[0] = leftIndex
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex]
      previous[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return previous[right.length]
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
