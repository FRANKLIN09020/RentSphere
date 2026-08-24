import { jsPDF } from 'jspdf'
import type { ModuleConfig, RecordData } from '../../features/modules/types'
import { getReferenceLabel } from '../../features/modules/referenceUtils'
import { formatMoney } from './format'
import { brandColors } from '../../app/theme'

type ReferenceData = Record<string, RecordData[]>

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 46
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const TEAL = brandColors.primary
const DARK = brandColors.navigation
const GRAY = brandColors.muted
const LIGHT = brandColors.primarySurface
const BORDER = brandColors.border
const SUCCESS = brandColors.success
const AMBER = brandColors.warning
const ERROR = brandColors.error

function resolveLabel(fieldName: string, record: RecordData, references: ReferenceData) {
  const value = record[fieldName]
  const label = getReferenceLabel(fieldName, value, references)
  if (label) return label
  if (value == null || value === '') return '-'
  return String(value)
}

function formatDate(value: unknown) {
  const date = new Date(String(value ?? ''))
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function shortReference(prefix: string, value: unknown) {
  const compact = String(value ?? '-').replace(/-/g, '').toUpperCase()
  return `${prefix}-${compact.slice(0, 10)}`
}

function formatPdfMoney(value: unknown) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return 'INR 0.00'
  return `INR ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`
}

function statusColor(status: string) {
  if (['PAID', 'SUCCESS', 'RESOLVED'].includes(status)) return SUCCESS
  if (['OVERDUE', 'FAILED'].includes(status)) return ERROR
  return AMBER
}

export function downloadFinancialRecord(
  config: ModuleConfig,
  record: RecordData,
  references: ReferenceData,
) {
  const isInvoice = config.resource === 'invoices'
  const title = isInvoice ? 'INVOICE' : 'PAYMENT RECEIPT'
  const id = String(record.id ?? '-')
  const status = String(record.status ?? 'ACTIVE')
  const amount = Number(record.amount ?? 0)
  const docNumber = isInvoice ? `INV-${id}` : `PAY-${id}`

  const details: Array<[string, string]> = isInvoice
    ? [
      ['Tenant', resolveLabel('tenantId', record, references)],
      ['Due date', formatDate(record.dueDate)],
      ['Issued', formatDate(record.createdAt ?? new Date().toISOString())],
      ['Status', status],
    ]
    : [
      ['Invoice', resolveLabel('invoiceId', record, references)],
      ['Payment date', formatDate(record.paymentDate ?? new Date().toISOString())],
      ['Status', status],
    ]

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  // Header band
  doc.setFillColor(brandColors.primaryHover)
  doc.rect(0, 0, PAGE_WIDTH, 118, 'F')
  doc.setFillColor(brandColors.accent)
  doc.rect(0, 118, PAGE_WIDTH, 4, 'F')

  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('RentSphere', MARGIN, 52)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#99f6e4')
  doc.text('Smart property and rental management', MARGIN, 72)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor('#ffffff')
  doc.text(title, PAGE_WIDTH - MARGIN, 52, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor('#99f6e4')
  doc.text(docNumber, PAGE_WIDTH - MARGIN, 72, { align: 'right' })

  // Body
  let y = 165

  // Status badge
  const color = statusColor(status)
  const badgeW = doc.getTextWidth(status) + 20
  doc.setFillColor(color)
  doc.roundedRect(PAGE_WIDTH - MARGIN - badgeW, y - 14, badgeW, 22, 5, 5, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(status, PAGE_WIDTH - MARGIN - badgeW / 2, y + 1, { align: 'center' })

  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(isInvoice ? 'Invoice details' : 'Payment details', MARGIN, y)
  y += 34

  // Details table
  const rowHeight = 30
  const labelWidth = 130
  const firstColX = MARGIN
  const secondColX = MARGIN + 150
  const secondColWidth = CONTENT_WIDTH - 150

  doc.setFillColor(LIGHT)
  doc.rect(firstColX, y - 18, labelWidth, rowHeight, 'F')
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.6)
  details.forEach(([label, value], index) => {
    const rowY = y + index * rowHeight
    if (index % 2 === 1) {
      doc.setFillColor('#ffffff')
    } else {
      doc.setFillColor(LIGHT)
    }
    doc.rect(firstColX, rowY - 18, CONTENT_WIDTH, rowHeight, 'F')
    doc.setDrawColor(BORDER)
    doc.line(firstColX, rowY - 18, firstColX + CONTENT_WIDTH, rowY - 18)
    doc.setTextColor(GRAY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(String(label).toUpperCase(), firstColX + 10, rowY + 2)
    doc.setTextColor(DARK)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    const valueLines = doc.splitTextToSize(String(value), secondColWidth - 20)
    doc.text(valueLines, secondColX, rowY + 2)
  })
  const tableEndY = y + details.length * rowHeight

  // Amount row
  doc.setDrawColor(BORDER)
  doc.line(firstColX, tableEndY + 14, firstColX + CONTENT_WIDTH, tableEndY + 14)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(GRAY)
  doc.text(isInvoice ? 'AMOUNT DUE' : 'PAYMENT AMOUNT', firstColX, tableEndY + 36)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(TEAL)
  doc.text(formatMoney(amount), firstColX + CONTENT_WIDTH, tableEndY + 36, { align: 'right' })

  // Footer
  doc.setDrawColor(BORDER)
  doc.line(MARGIN, PAGE_HEIGHT - 70, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 70)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(GRAY)
  doc.text(
    `Generated on ${new Date().toLocaleString('en-IN')} · RentSphere`,
    MARGIN,
    PAGE_HEIGHT - 48,
  )
  doc.text(
    'This document was generated electronically and does not require a signature.',
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 48,
    { align: 'right' },
  )

  doc.save(`${isInvoice ? 'invoice' : 'payment'}-${id}.pdf`)
}

export function downloadDepositDisputeRecord(record: RecordData, references: ReferenceData) {
  const id = String(record.id ?? '-')
  const status = String(record.status ?? 'OPEN')
  const tenantName = resolveLabel('tenantId', record, references)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const rows: Array<[string, string]> = [
    ['Tenant', tenantName],
    ['Unit', resolveLabel('unitId', record, references)],
    ['Agreement', resolveLabel('agreementId', record, references)],
    ['Deposit amount', formatPdfMoney(record.depositAmount)],
    ['Deducted amount', formatPdfMoney(record.deductedAmount)],
    ['Proposed settlement', formatPdfMoney(record.proposedSettlementAmount)],
    ['Deduction reason', String(record.deductionReason ?? '-')],
    ['Owner response', String(record.ownerResponse ?? '-')],
    ['Tenant notes', String(record.tenantNotes ?? '-')],
    ['Settlement due date', formatDate(record.settlementDueDate)],
  ]

  doc.setFillColor(brandColors.primaryHover)
  doc.rect(0, 0, PAGE_WIDTH, 122, 'F')
  doc.setFillColor(brandColors.accent)
  doc.rect(0, 122, PAGE_WIDTH, 5, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('RentSphere', MARGIN, 48)
  doc.setFontSize(21)
  doc.text('DEPOSIT DISPUTE RECORD', PAGE_WIDTH - MARGIN, 48, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#ccfbf1')
  doc.text(shortReference('DSP', id), PAGE_WIDTH - MARGIN, 69, { align: 'right' })
  doc.text('Official tenant copy', MARGIN, 69)

  let y = 165
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text(tenantName, MARGIN, y)
  const badgeWidth = Math.max(72, doc.getTextWidth(status) + 24)
  doc.setFillColor(statusColor(status))
  doc.roundedRect(PAGE_WIDTH - MARGIN - badgeWidth, y - 22, badgeWidth, 27, 6, 6, 'F')
  doc.setTextColor('#ffffff')
  doc.setFontSize(10)
  doc.text(status, PAGE_WIDTH - MARGIN - badgeWidth / 2, y - 5, { align: 'center' })

  y += 42
  rows.forEach(([label, value], index) => {
    const valueLines = doc.splitTextToSize(value, 300)
    const height = Math.max(32, valueLines.length * 13 + 15)
    doc.setFillColor(index % 2 === 0 ? LIGHT : '#ffffff')
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 4, 4, 'F')
    doc.setTextColor(GRAY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(label.toUpperCase(), MARGIN + 12, y + 19)
    doc.setTextColor(DARK)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(valueLines, MARGIN + 175, y + 19)
    y += height + 3
  })

  doc.setDrawColor(BORDER)
  doc.line(MARGIN, PAGE_HEIGHT - 74, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 74)
  doc.setTextColor(GRAY)
  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleString('en-IN')} | RentSphere`, MARGIN, PAGE_HEIGHT - 52)
  doc.text('Read-only record supplied to the tenant.', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 52, { align: 'right' })
  const safeName = tenantName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'tenant'
  doc.save(`deposit-dispute-${safeName}-${id}.pdf`)
}

export function downloadTenantPaidInvoice({
  invoice,
  payment,
  tenantName,
  propertyName,
  propertyAddress,
  unitNumber,
}: {
  invoice: RecordData
  payment: RecordData
  tenantName: string
  propertyName: string
  propertyAddress?: string
  unitNumber?: string
}) {
  const invoiceId = String(invoice.id ?? payment.invoiceId ?? '-')
  const paymentId = String(payment.id ?? '-')
  const amount = Number(payment.amount ?? invoice.amount ?? 0)
  const paidAt = payment.paymentDate ?? payment.updatedAt ?? payment.createdAt
  const safeTenantName = tenantName.trim() || 'Tenant'
  const safePropertyName = propertyName.trim() || 'RentSphere Property'
  const invoiceNumber = shortReference('INV', invoiceId)
  const paymentReference = shortReference('PAY', payment.razorpayPaymentId ?? paymentId)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  // A light property identity watermark that stays behind all invoice content.
  doc.setTextColor('#e6eef0')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(38)
  doc.text(safePropertyName.toUpperCase(), PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 45, {
    align: 'center',
    angle: 32,
    maxWidth: 470,
  })

  doc.setFillColor(brandColors.primaryHover)
  doc.rect(0, 0, PAGE_WIDTH, 124, 'F')
  doc.setFillColor(brandColors.accent)
  doc.rect(0, 124, PAGE_WIDTH, 5, 'F')

  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(23)
  doc.text('RentSphere', MARGIN, 44)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#ccfbf1')
  doc.text(safePropertyName, MARGIN, 64)
  if (propertyAddress) doc.text(propertyAddress, MARGIN, 80, { maxWidth: 280 })

  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('PAYMENT RECEIPT', PAGE_WIDTH - MARGIN, 44, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor('#ccfbf1')
  doc.text(invoiceNumber, PAGE_WIDTH - MARGIN, 64, { align: 'right' })
  doc.setFontSize(8)
  doc.text('Status: PAID', PAGE_WIDTH - MARGIN, 80, { align: 'right' })

  let y = 168
  doc.setTextColor(DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(safeTenantName, MARGIN, y)
  doc.setTextColor(GRAY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('BILLED TO', MARGIN, y - 22)
  doc.text(unitNumber ? `Unit ${unitNumber}  |  ${safePropertyName}` : safePropertyName, MARGIN, y + 18)

  const paidLabel = 'PAID'
  const badgeWidth = 66
  doc.setFillColor(SUCCESS)
  doc.roundedRect(PAGE_WIDTH - MARGIN - badgeWidth, y - 27, badgeWidth, 27, 6, 6, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(paidLabel, PAGE_WIDTH - MARGIN - badgeWidth / 2, y - 9, { align: 'center' })

  y += 58
  const rows: Array<[string, string]> = [
    ['Invoice number', invoiceNumber],
    ['Payment reference', paymentReference],
    ['Property', safePropertyName],
    ['Unit', unitNumber || '-'],
    ['Invoice issued', formatDate(invoice.createdAt)],
    ['Due date', formatDate(invoice.dueDate)],
    ['Paid on', formatDate(paidAt)],
    ['Payment method', payment.razorpayPaymentId
      ? 'Razorpay online payment'
      : payment.recordedFromInvoice
        ? 'Recorded by property management'
        : 'Online payment'],
  ]

  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.6)
  rows.forEach(([label, value], index) => {
    const rowY = y + index * 32
    doc.setFillColor(index % 2 === 0 ? LIGHT : '#ffffff')
    doc.roundedRect(MARGIN, rowY, CONTENT_WIDTH, 28, 4, 4, 'F')
    doc.setTextColor(GRAY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text(label.toUpperCase(), MARGIN + 14, rowY + 18)
    doc.setTextColor(DARK)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.text(String(value), PAGE_WIDTH - MARGIN - 14, rowY + 18, { align: 'right', maxWidth: 280 })
  })

  const totalY = y + rows.length * 32 + 22
  doc.setFillColor(brandColors.primaryHover)
  doc.roundedRect(MARGIN, totalY, CONTENT_WIDTH, 78, 9, 9, 'F')
  doc.setTextColor('#ffffff')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL PAID', MARGIN + 18, totalY + 28)
  doc.setTextColor('#ffffff')
  doc.setFontSize(22)
  doc.text(formatPdfMoney(amount), PAGE_WIDTH - MARGIN - 18, totalY + 34, { align: 'right' })
  doc.setTextColor('#ccfbf1')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Balance due  INR 0.00', MARGIN + 18, totalY + 54)

  doc.setTextColor(GRAY)
  doc.setFontSize(8)
  doc.text(`Full invoice ID: ${invoiceId}`, MARGIN, totalY + 104)
  doc.text(`Internal payment ID: ${paymentId}`, MARGIN, totalY + 118)

  doc.setDrawColor(BORDER)
  doc.line(MARGIN, PAGE_HEIGHT - 82, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 82)
  doc.setTextColor(GRAY)
  doc.setFontSize(8)
  doc.text(`Generated ${new Date().toLocaleString('en-IN')} | RentSphere`, MARGIN, PAGE_HEIGHT - 58)
  doc.text('Computer-generated receipt; no signature is required.', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 58, { align: 'right' })

  const fileTenant = safeTenantName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'tenant'
  doc.save(`invoice-${fileTenant}-${invoiceId}.pdf`)
}
