import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Card, Chip, CircularProgress, Divider, Grid, IconButton, MenuItem, Stack, TablePagination, TextField, Tooltip, Typography } from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import { formatDate, formatMoney } from '../../shared/utils/format'
import { downloadTenantPaidInvoice } from '../../shared/utils/downloadDocument'
import { DeleteIcon, DownloadIcon } from '../../shared/ui/AppIcons'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import type { RecordData } from '../modules/types'
import { PayNowButton } from './PayNowButton'

const PAYABLE_STATUSES = new Set(['PENDING', 'OVERDUE'])

type ReceiptContext = {
  tenantName: string
  unitNumber: string
  propertyName: string
  propertyAddress: string
}

export function PaymentsPage() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<RecordData[]>([])
  const [payments, setPayments] = useState<RecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [receiptContext, setReceiptContext] = useState<ReceiptContext | null>(null)
  const [tenants, setTenants] = useState<RecordData[]>([])
  const [invoiceFilter, setInvoiceFilter] = useState('ALL')
  const [paymentFilter, setPaymentFilter] = useState('ALL')
  const [tenantFilter, setTenantFilter] = useState('ALL')
  const [invoicePage, setInvoicePage] = useState(0)
  const [paymentPage, setPaymentPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [paymentToDelete, setPaymentToDelete] = useState<RecordData | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const suffix = session?.role === 'TENANT' ? '/me' : ''
      const [invoiceResponse, paymentResponse] = await Promise.all([
        http.get<RecordData[]>(`/invoices${suffix}`),
        http.get<RecordData[]>(`/payments${suffix}`),
      ])
      setInvoices(invoiceResponse.data)
      setPayments(paymentResponse.data)
      if (session?.role === 'ADMIN') {
        setTenants((await http.get<RecordData[]>('/tenants')).data)
      } else {
        setTenants([])
      }
      if (session?.role === 'TENANT') {
        setReceiptContext(await loadReceiptContext(invoiceResponse.data))
      } else {
        setReceiptContext(null)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const deletePayment = async () => {
    if (!paymentToDelete) return
    setDeleting(true)
    setError('')
    try {
      await http.delete(`/payments/${String(paymentToDelete.id)}`)
      setPaymentToDelete(null)
      setNotice('Payment attempt removed successfully.')
      await loadData()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const payableInvoices = invoices.filter((invoice) => PAYABLE_STATUSES.has(String(invoice.status ?? '').toUpperCase()))
  const outstandingTotal = payableInvoices.reduce((total, invoice) => total + Number(invoice.amount ?? 0), 0)
  const paidInvoiceIds = new Set(
    payments
      .filter((payment) => String(payment.status).toUpperCase() === 'SUCCESS')
      .map((payment) => String(payment.invoiceId)),
  )
  const invoiceOnlyPayments: RecordData[] = invoices
    .filter((invoice) => String(invoice.status ?? '').toUpperCase() === 'PAID')
    .filter((invoice) => !paidInvoiceIds.has(String(invoice.id)))
    .map((invoice) => ({
      id: `paid-invoice-${String(invoice.id)}`,
      invoiceId: invoice.id,
      amount: invoice.amount,
      status: 'SUCCESS',
      paymentDate: invoice.updatedAt ?? invoice.createdAt,
      recordedFromInvoice: true,
    }))
  const paymentHistory = [...payments, ...invoiceOnlyPayments]
  const successfulPayments = paymentHistory.filter((payment) => String(payment.status).toUpperCase() === 'SUCCESS').length
  const pendingInvoices = new Set<string>()
  const visiblePayments = paymentHistory.filter((payment) => {
    if (String(payment.status).toUpperCase() !== 'PENDING') return true
    const invoiceId = String(payment.invoiceId)
    if (paidInvoiceIds.has(invoiceId)) return false
    if (pendingInvoices.has(invoiceId)) return false
    pendingInvoices.add(invoiceId)
    return true
  })
  const invoiceById = new Map(invoices.map((invoice) => [String(invoice.id), invoice]))
  const tenantNameById = new Map(tenants.map((tenant) => [String(tenant.id), String(tenant.fullName ?? 'Tenant')]))
  const successfulInvoiceIds = new Set(paymentHistory
    .filter((payment) => String(payment.status).toUpperCase() === 'SUCCESS')
    .map((payment) => String(payment.invoiceId)))
  const unpaidTenantIds = new Set(payableInvoices.map((invoice) => String(invoice.tenantId)))
  const paidTenantIds = new Set(invoices
    .filter((invoice) => String(invoice.status).toUpperCase() === 'PAID' || successfulInvoiceIds.has(String(invoice.id)))
    .map((invoice) => String(invoice.tenantId))
    .filter((tenantId) => !unpaidTenantIds.has(tenantId)))
  const filteredInvoices = payableInvoices.filter((invoice) =>
    (invoiceFilter === 'ALL' || String(invoice.status).toUpperCase() === invoiceFilter)
    && (tenantFilter === 'ALL' || String(invoice.tenantId) === tenantFilter))
  const filteredPayments = visiblePayments.filter((payment) => {
    const invoice = invoiceById.get(String(payment.invoiceId))
    return (paymentFilter === 'ALL' || String(payment.status).toUpperCase() === paymentFilter)
      && (tenantFilter === 'ALL' || String(invoice?.tenantId) === tenantFilter)
  })
  const pagedInvoices = filteredInvoices.slice(invoicePage * rowsPerPage, invoicePage * rowsPerPage + rowsPerPage)
  const pagedPayments = filteredPayments.slice(paymentPage * rowsPerPage, paymentPage * rowsPerPage + rowsPerPage)

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3.5 }, width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850 }}>Payment summary</Typography>
            <Typography variant="body2" color="text.secondary">Current balance and recent activity</Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => void loadData()} disabled={loading}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}
        {loading && <Card sx={{ p: 4 }}><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={22} /><Typography>Loading payments…</Typography></Stack></Card>}

        {!loading && <>
          <Grid container spacing={2}>
            <SummaryCard label="Outstanding balance" value={formatMoney(outstandingTotal)} columns={session?.role === 'ADMIN' ? 3 : 4} />
            <SummaryCard label={session?.role === 'ADMIN' ? 'Members paid' : 'Invoices due'} value={String(session?.role === 'ADMIN' ? paidTenantIds.size : payableInvoices.length)} columns={session?.role === 'ADMIN' ? 3 : 4} />
            <SummaryCard label={session?.role === 'ADMIN' ? 'Members unpaid' : 'Successful payments'} value={String(session?.role === 'ADMIN' ? unpaidTenantIds.size : successfulPayments)} columns={session?.role === 'ADMIN' ? 3 : 4} />
            {session?.role === 'ADMIN' && <SummaryCard label="Successful payments" value={String(successfulPayments)} columns={3} />}
          </Grid>

          <Card sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
              {session?.role === 'ADMIN' && (
                <TextField select size="small" label="Tenant" value={tenantFilter} onChange={(event) => { setTenantFilter(event.target.value); setInvoicePage(0); setPaymentPage(0) }} sx={{ minWidth: 210 }}>
                  <MenuItem value="ALL">All tenants</MenuItem>
                  {tenants.toSorted((a, b) => String(a.fullName).localeCompare(String(b.fullName))).map((tenant) => (
                    <MenuItem key={String(tenant.id)} value={String(tenant.id)}>{String(tenant.fullName ?? tenant.id)}</MenuItem>
                  ))}
                </TextField>
              )}
              <TextField select size="small" label="Invoice status" value={invoiceFilter} onChange={(event) => { setInvoiceFilter(event.target.value); setInvoicePage(0) }} sx={{ minWidth: 170 }}>
                <MenuItem value="ALL">All unpaid</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
              </TextField>
              <TextField select size="small" label="Payment status" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPaymentPage(0) }} sx={{ minWidth: 180 }}>
                <MenuItem value="ALL">All transactions</MenuItem>
                <MenuItem value="SUCCESS">Successful</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </TextField>
              {(tenantFilter !== 'ALL' || invoiceFilter !== 'ALL' || paymentFilter !== 'ALL') && (
                <Button onClick={() => { setTenantFilter('ALL'); setInvoiceFilter('ALL'); setPaymentFilter('ALL'); setInvoicePage(0); setPaymentPage(0) }}>Clear filters</Button>
              )}
            </Stack>
          </Card>

          <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ overflow: 'hidden' }}>
                <PanelHeader title="Outstanding invoices" />
                <Stack spacing={1.5} sx={{ p: 2 }}>
                  {!filteredInvoices.length ? <Alert severity="success">No outstanding invoices match these filters.</Alert> : pagedInvoices.map((invoice) => (
                    <Box key={String(invoice.id)} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box><Typography sx={{ fontWeight: 800 }}>Rent invoice</Typography>{session?.role === 'ADMIN' && <Typography variant="caption" color="text.secondary">{tenantNameById.get(String(invoice.tenantId)) ?? 'Tenant'}</Typography>}</Box>
                          <Chip size="small" color="warning" variant="outlined" label={String(invoice.status)} />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' } }}>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatMoney(invoice.amount)}</Typography>
                          <Typography variant="body2" color="text.secondary">Due {formatDate(invoice.dueDate)}</Typography>
                        </Stack>
                        <PayNowButton invoiceId={String(invoice.id)} amount={Number(invoice.amount)} onPaid={() => void loadData()} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                {filteredInvoices.length > 0 && <TablePagination component="div" count={filteredInvoices.length} page={invoicePage} rowsPerPage={rowsPerPage} rowsPerPageOptions={[4, 6, 10, 20]} onPageChange={(_, page) => setInvoicePage(page)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setInvoicePage(0); setPaymentPage(0) }} />}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ overflow: 'hidden' }}>
                <PanelHeader title="Transaction history" />
                {!filteredPayments.length ? <Box sx={{ p: 2 }}><Alert severity="info">No transactions match these filters.</Alert></Box> : (
                  <Stack divider={<Divider flexItem />}>
                    {pagedPayments.map((payment) => {
                      const successful = String(payment.status).toUpperCase() === 'SUCCESS'
                      const invoice = invoices.find((item) => String(item.id) === String(payment.invoiceId))
                      return (
                      <Stack key={String(payment.id)} direction="row" spacing={2} sx={{ px: 2.5, py: 2, justifyContent: 'space-between', alignItems: 'center', transition: 'background-color 160ms ease', '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 850 }}>{formatMoney(payment.amount)}</Typography>
                          {session?.role === 'ADMIN' && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{tenantNameById.get(String(invoice?.tenantId)) ?? 'Tenant'}</Typography>}
                          <Typography variant="body2" color="text.secondary" noWrap>{getPaymentMessage(payment)}</Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'flex-end' }}>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <Chip size="small" variant="outlined" label={String(payment.status)} color={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'error' : 'warning'} />
                            {session?.role === 'ADMIN' && !successful && !payment.recordedFromInvoice && (
                              <Tooltip title="Delete payment attempt">
                                <IconButton
                                  size="small"
                                  color="error"
                                  aria-label={`Delete ${String(payment.status).toLowerCase()} payment attempt`}
                                  onClick={() => setPaymentToDelete(payment)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                          {session?.role === 'TENANT' && successful && invoice && receiptContext && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => downloadTenantPaidInvoice({
                                invoice,
                                payment,
                                ...receiptContext,
                              })}
                            >
                              Download invoice
                            </Button>
                          )}
                        </Stack>
                      </Stack>
                      )
                    })}
                  </Stack>
                )}
                {filteredPayments.length > 0 && <TablePagination component="div" count={filteredPayments.length} page={paymentPage} rowsPerPage={rowsPerPage} rowsPerPageOptions={[4, 6, 10, 20]} onPageChange={(_, page) => setPaymentPage(page)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setInvoicePage(0); setPaymentPage(0) }} />}
              </Card>
            </Grid>
          </Grid>
        </>}
      </Stack>
      <ConfirmDialog
        open={Boolean(paymentToDelete)}
        title="Delete payment attempt?"
        description="This removes the pending or failed attempt from transaction history. Completed payments and paid invoices are always preserved."
        confirmLabel="Delete attempt"
        destructive
        busy={deleting}
        onConfirm={() => void deletePayment()}
        onClose={() => setPaymentToDelete(null)}
      />
    </Box>
  )
}

async function loadReceiptContext(invoices: RecordData[]): Promise<ReceiptContext | null> {
  try {
    const tenant = (await http.get<RecordData>('/tenants/me')).data
    const invoiceUnitId = invoices.find((invoice) => invoice.unitId)?.unitId
    const unitId = String(tenant.unitId ?? invoiceUnitId ?? '')
    const unit = unitId ? await getRecordOrEmpty(`/units/${unitId}`) : {}
    const buildingId = String(unit.buildingId ?? '')
    const building = buildingId ? await getRecordOrEmpty(`/buildings/${buildingId}`) : {}
    const propertyId = String(building.propertyId ?? '')
    const property = propertyId ? await getRecordOrEmpty(`/properties/${propertyId}`) : {}

    return {
      tenantName: String(tenant.fullName ?? 'Tenant'),
      unitNumber: String(unit.unitNumber ?? ''),
      propertyName: String(property.name ?? building.name ?? 'RentSphere Property'),
      propertyAddress: [property.address, property.city, property.state]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .join(', '),
    }
  } catch {
    return null
  }
}

async function getRecordOrEmpty(path: string): Promise<RecordData> {
  try {
    return (await http.get<RecordData>(path)).data
  } catch {
    return {}
  }
}

function SummaryCard({ label, value, columns }: { label: string; value: string; columns: 3 | 4 }) {
  return <Grid size={{ xs: 12, sm: 6, lg: columns }}><Card sx={{ p: 2.25, height: '100%' }}><Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography><Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900 }}>{value}</Typography></Card></Grid>
}

function PanelHeader({ title }: { title: string }) {
  return <Box sx={{ px: 2.5, py: 2, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}><Typography variant="h6" sx={{ fontWeight: 850 }}>{title}</Typography></Box>
}

function getPaymentMessage(payment: RecordData) {
  if (payment.recordedFromInvoice) {
    return payment.paymentDate ? `Invoice marked paid on ${formatDate(payment.paymentDate)}` : 'Invoice marked as paid'
  }
  const status = String(payment.status).toUpperCase()
  if (status === 'SUCCESS') return payment.paymentDate ? `Paid on ${formatDate(payment.paymentDate)}` : 'Payment completed'
  if (status === 'FAILED') return payment.paymentDate ? `Attempt failed on ${formatDate(payment.paymentDate)}` : 'Payment attempt failed'
  if (status === 'REFUNDED') return 'Payment refunded'
  return 'Waiting for payment confirmation'
}
