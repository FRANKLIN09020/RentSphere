import { jsPDF } from 'jspdf'
import type { ModuleConfig, RecordData } from '../../features/modules/types'
import { getReferenceLabel } from '../../features/modules/referenceUtils'
import { formatMoney } from './format'

type ReferenceData = Record<string, RecordData[]>

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 46
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const TEAL = '#0d9488'
const DARK = '#0b1220'
const GRAY = '#64748b'
const LIGHT = '#f0fdfa'
const BORDER = '#d9e2ec'
const SUCCESS = '#15803d'
const AMBER = '#b45309'
const ERROR = '#b91c1c'

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
  doc.setFillColor('#0f766e')
  doc.rect(0, 0, PAGE_WIDTH, 118, 'F')
  doc.setFillColor('#14b8a6')
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
