import { useCallback, useEffect, useState } from 'react'
import { Alert, Box, Button, Card, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import { formatDate, formatMoney } from '../../shared/utils/format'
import type { RecordData } from '../modules/types'
import { PayNowButton } from './PayNowButton'

const PAYABLE_STATUSES = new Set(['PENDING', 'OVERDUE'])

export function PaymentsPage() {
  const { session } = useAuth()
  const [invoices, setInvoices] = useState<RecordData[]>([])
  const [payments, setPayments] = useState<RecordData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [session?.role])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const payableInvoices = invoices.filter((invoice) =>
    PAYABLE_STATUSES.has(String(invoice.status ?? '').toUpperCase()),
  )

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1480 }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Pay Rent &amp; History</Typography>
            <Typography color="text.secondary">
              Pay outstanding invoices securely through Razorpay and review transaction status.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => void loadData()} disabled={loading}>Refresh</Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={20} /><Typography>Loading payments...</Typography></Stack>}

        {!loading && (
          <>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850, mb: 1.5 }}>Outstanding invoices</Typography>
              {!payableInvoices.length ? (
                <Alert severity="success">You have no outstanding invoices.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {payableInvoices.map((invoice) => (
                    <Grid key={String(invoice.id)} size={{ xs: 12, md: 6, lg: 4 }}>
                      <Card sx={{ p: 2.25, height: '100%', borderRadius: 3 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 850 }}>Invoice #{String(invoice.id).slice(0, 8)}</Typography>
                            <Chip size="small" color="warning" label={String(invoice.status)} />
                          </Stack>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>{formatMoney(invoice.amount)}</Typography>
                          <Typography variant="body2" color="text.secondary">Due {formatDate(invoice.dueDate)}</Typography>
                          <PayNowButton
                            invoiceId={String(invoice.id)}
                            amount={Number(invoice.amount)}
                            onPaid={() => void loadData()}
                          />
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 850, mb: 1.5 }}>Transaction history</Typography>
              {!payments.length ? (
                <Alert severity="info">No payment attempts yet.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {payments.map((payment) => (
                    <Grid key={String(payment.id)} size={{ xs: 12, md: 6 }}>
                      <Card sx={{ p: 2, borderRadius: 3 }}>
                        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 800 }}>{formatMoney(payment.amount)}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Invoice #{String(payment.invoiceId).slice(0, 8)} · {payment.paymentDate ? formatDate(payment.paymentDate) : 'Awaiting completion'}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={String(payment.status)}
                            color={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'error' : 'warning'}
                          />
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Stack>
    </Box>
  )
}
