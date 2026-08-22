import { useState } from 'react'
import { Alert, Button, CircularProgress, Snackbar } from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import { loadRazorpayCheckout } from './razorpay'
import type { RazorpayCheckoutOptions, RazorpayPaymentFailure, RazorpayPaymentResponse } from './razorpay'
import type {
  RazorpayCreateOrderRequest,
  RazorpayCreateOrderResponse,
  RazorpayVerifyRequest,
} from './types'

type ToastState = { severity: 'success' | 'error'; message: string } | null

export function PayNowButton({
  invoiceId,
  amount,
  onPaid,
}: {
  invoiceId: string
  amount: number
  onPaid?: () => void
}) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

  async function verifyPayment(response: RazorpayPaymentResponse) {
    try {
      const request: RazorpayVerifyRequest = {
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
        invoiceId,
      }
      await http.post('/payments/razorpay/verify', request)
      setToast({ severity: 'success', message: 'Payment successful. Invoice marked as paid.' })
      onPaid?.()
    } catch (error) {
      setToast({ severity: 'error', message: getErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  async function handlePay() {
    setBusy(true)
    setToast(null)
    try {
      const orderRequest: RazorpayCreateOrderRequest = { invoiceId, amount }
      const { data: order } = await http.post<RazorpayCreateOrderResponse>(
        '/payments/razorpay/create-order',
        orderRequest,
      )

      const Razorpay = await loadRazorpayCheckout()

      const options: RazorpayCheckoutOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RentSphere',
        description: `Invoice ${invoiceId.slice(0, 8)}`,
        order_id: order.orderId,
        prefill: { email: session?.email ?? '' },
        theme: { color: '#0d9488' },
        handler: verifyPayment,
        modal: { ondismiss: () => setBusy(false) },
        retry: { enabled: true, max_count: 3 },
        config: {
          display: {
            blocks: {
              preferred: {
                name: 'Pay securely',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.preferred'],
            preferences: { show_default_blocks: true },
          },
        },
      }

      const checkout = new Razorpay(options)
      checkout.on('payment.failed', (response: RazorpayPaymentFailure) => {
        const gatewayError = response.error
        const reason = gatewayError?.description || gatewayError?.reason
        const diagnostics = [gatewayError?.code, gatewayError?.source, gatewayError?.step, gatewayError?.reason]
          .filter(Boolean)
          .join(' / ')
        const testModeHelp = order.keyId.startsWith('rzp_test_')
          ? ' Test mode netbanking should open a mock bank page; choose Success there.'
          : ''
        checkout.close()
        setToast({
          severity: 'error',
          message: `${reason || 'Payment was declined. You have not been charged.'}${diagnostics ? ` (${diagnostics})` : ''}${testModeHelp}`,
        })
        setBusy(false)
      })
      checkout.open()
    } catch (error) {
      setToast({ severity: 'error', message: getErrorMessage(error) })
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={busy ? <CircularProgress size={14} color="inherit" /> : undefined}
        disabled={busy}
        onClick={handlePay}
        sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {busy ? 'Processing' : 'Pay now'}
      </Button>
      <Snackbar
        open={toast !== null}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 2147483647 }}
      >
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  )
}
