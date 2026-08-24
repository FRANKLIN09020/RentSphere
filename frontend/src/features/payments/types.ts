export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

export type Payment = {
  id: string
  organizationId?: string
  invoiceId: string
  amount: number
  status: PaymentStatus
  paymentDate?: string
  createdAt?: string
  updatedAt?: string
}

export type RazorpayCreateOrderRequest = {
  invoiceId: string
  amount: number
}

export type RazorpayCreateOrderResponse = {
  orderId: string
  amount: number
  currency: string
  keyId: string
  paymentCompleted: boolean
}

export type RazorpayVerifyRequest = {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
  invoiceId: string
}

export type RazorpayVerifyResponse = Payment
