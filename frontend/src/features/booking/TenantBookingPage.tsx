import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { ApartmentIcon, ImageIcon, LocationIcon, SaveIcon } from '../../shared/ui/AppIcons'
import { formatMoney } from '../../shared/utils/format'
import type { RecordData } from '../modules/types'
import { parseBookingAssistantMessage } from './aiBookingAssistant'

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

export function TenantBookingPage() {
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
    return matchesQuery && (cityFilter === 'ALL' || String(property.city) === cityFilter)
  }), [properties, listingQuery, cityFilter])
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
    const parsed = parseBookingAssistantMessage(assistantInput, properties, availableUnits, buildings, form)
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
        <Box sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', borderRadius: 1, p: { xs: 2, md: 3 } }}>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Chip label={loading ? 'Loading listings' : `${availableUnits.length} available units`} color="success" variant="outlined" />
          </Stack>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </Box>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Card sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6">AI booking assistant</Typography>
                <Typography color="text.secondary">Describe your preferred property and time in plain English. The assistant will fill the form and submit it for you.</Typography>
              </Box>
              <Stack component="form" spacing={1.5} onSubmit={handleAssistantSubmit}>
                <TextField
                  label="Ask the assistant"
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  placeholder="Book me a visit at Sunstone Apartments tomorrow at 3 pm"
                  multiline
                  minRows={2}
                />
                <Button type="submit" variant="outlined" disabled={assistantBusy || !assistantInput.trim()}>
                  {assistantBusy ? 'Working…' : 'Ask assistant'}
                </Button>
              </Stack>
              {assistantStatus && <Alert severity="info">{assistantStatus}</Alert>}
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ p: 2, mb: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField size="small" label="Search properties" value={listingQuery} onChange={(event) => { setListingQuery(event.target.value); setListingPage(0) }} fullWidth />
                <TextField select size="small" label="City" value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setListingPage(0) }} sx={{ minWidth: 180 }}>
                  <MenuItem value="ALL">All cities</MenuItem>
                  {cities.map((city) => <MenuItem key={city} value={city}>{city}</MenuItem>)}
                </TextField>
                {(listingQuery || cityFilter !== 'ALL') && <Button onClick={() => { setListingQuery(''); setCityFilter('ALL'); setListingPage(0) }}>Clear</Button>}
              </Stack>
            </Card>
            <Grid container spacing={2}>
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
                    <Typography variant="h6">No properties available</Typography>
                    <Typography color="text.secondary">Please check again later.</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
            {filteredProperties.length > 0 && <TablePagination component="div" count={filteredProperties.length} page={listingPage} rowsPerPage={listingsPerPage} rowsPerPageOptions={[4, 6, 12, 24]} onPageChange={(_, page) => setListingPage(page)} onRowsPerPageChange={(event) => { setListingsPerPage(Number(event.target.value)); setListingPage(0) }} />}
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                  <Box>
                    <Typography variant="h6">Book a visit</Typography>
                    <Typography color="text.secondary">Admin and owner will be notified after submission.</Typography>
                  </Box>
                  <TextField
                    select
                    label="Property"
                    value={form.propertyId}
                    required
                    onChange={(event) => setForm({ ...form, propertyId: event.target.value, unitId: '' })}
                  >
                    <MenuItem value="">Select property</MenuItem>
                    {properties.map((property) => (
                      <MenuItem key={String(property.id)} value={String(property.id)}>{String(property.name ?? 'Property')}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Available unit"
                    value={form.unitId}
                    required
                    disabled={!form.propertyId}
                    onChange={(event) => setForm({ ...form, unitId: event.target.value })}
                  >
                    <MenuItem value="">Select unit</MenuItem>
                    {selectedPropertyUnits.map((unit) => (
                      <MenuItem key={String(unit.id)} value={String(unit.id)}>
                        Unit {String(unit.unitNumber ?? '-')} - Rent {formatMoney(unit.rentAmount)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    label="Visiting date"
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
                    label="Visiting time"
                    value={form.visitTime}
                    required
                    onChange={(event) => setForm({ ...form, visitTime: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    label="Note"
                    value={form.note}
                    multiline
                    minRows={3}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                  />
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={submitting}>
                    {submitting ? 'Sending request' : 'Send booking request'}
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
  const imageUrl = String(property.imageUrl ?? '')

  return (
    <Card sx={{ height: '100%', overflow: 'hidden', boxShadow: selected ? (theme) => `0 0 0 2px ${theme.palette.primary.dark}` : undefined }}>
      <Box sx={{ aspectRatio: '16 / 9', bgcolor: 'action.hover' }}>
        {imageUrl ? (
          <Box component="img" src={imageUrl} alt={String(property.name ?? 'Property')} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Stack spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <ImageIcon />
            <Typography variant="body2" sx={{ fontWeight: 800 }}>Property image pending</Typography>
          </Stack>
        )}
      </Box>
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6">{String(property.name ?? 'Property')}</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <LocationIcon fontSize="small" />
              <Typography variant="body2">{[property.city, property.state].map((value) => String(value ?? '').trim()).filter(Boolean).join(', ') || 'Location pending'}</Typography>
            </Stack>
          </Box>
          <Typography color="text.secondary">{String(property.address ?? '')}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip icon={<ApartmentIcon />} label={`${units.length} available units`} color={units.length ? 'success' : 'warning'} />
            <Button variant={selected ? 'contained' : 'outlined'} onClick={onSelect} disabled={!units.length}>
              {selected ? 'Selected' : 'Select'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
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
