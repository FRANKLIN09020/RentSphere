export type RazorpayPaymentResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type RazorpayPaymentFailure = {
  error?: {
    code?: string
    description?: string
    source?: string
    step?: string
    reason?: string
    metadata?: {
      order_id?: string
      payment_id?: string
    }
  }
}

export type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color: string }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: { ondismiss?: () => void }
  retry?: { enabled: boolean; max_count?: number }
  config?: {
    display: {
      blocks: Record<string, {
        name: string
        instruments: Array<{ method: 'upi' | 'card' | 'netbanking' | 'wallet' }>
      }>
      sequence: string[]
      preferences: { show_default_blocks: boolean }
    }
  }
}

export type RazorpayCheckout = {
  on: (event: 'payment.failed', handler: (response: RazorpayPaymentFailure) => void) => void
  open: () => void
  close: () => void
}

export type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayCheckout

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let scriptPromise: Promise<RazorpayConstructor> | null = null

export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(window.Razorpay)
  }
  if (scriptPromise) {
    return scriptPromise
  }
  scriptPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        if (!window.Razorpay) {
          reject(new Error('Razorpay checkout script failed to initialize'))
          return
        }
        resolve(window.Razorpay)
      })
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')))
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay checkout script failed to initialize'))
        return
      }
      resolve(window.Razorpay)
    }
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}
