import type { RecordData } from '../modules/types'

export type AssistantBookingDraft = {
  propertyId?: string
  unitId?: string
  visitDate?: string
  visitTime?: string
  note?: string
}

export type AssistantBookingIntent = AssistantBookingDraft & {
  shouldSubmit: boolean
  message: string
}

export function parseBookingAssistantMessage(
  input: string,
  properties: RecordData[],
  availableUnits: RecordData[],
  buildings: RecordData[],
  currentForm: AssistantBookingDraft,
): AssistantBookingIntent {
  const text = input.trim()
  if (!text) {
    return {
      shouldSubmit: false,
      message: 'Tell me which property you want and when you would like to visit.',
    }
  }

  const normalizedText = normalize(text)
  const detectedProperty = findProperty(normalizedText, properties, currentForm.propertyId)
  const detectedDate = findDate(text)
  const detectedTime = findTime(text)
  const detectedNote = findNote(text, detectedProperty, detectedDate, detectedTime)

  const propertyId = detectedProperty?.id ? String(detectedProperty.id) : currentForm.propertyId
  const unitId = findUnitId(propertyId, availableUnits, buildings, currentForm.unitId)
  const visitDate = detectedDate ?? currentForm.visitDate
  const visitTime = detectedTime ?? currentForm.visitTime
  const note = detectedNote || currentForm.note

  const missing = [] as string[]
  if (!propertyId) missing.push('property')
  if (!visitDate) missing.push('date')
  if (!visitTime) missing.push('time')
  if (!unitId && propertyId) missing.push('unit')

  if (!missing.length) {
    return {
      propertyId,
      unitId,
      visitDate,
      visitTime,
      note,
      shouldSubmit: true,
      message: `I found a suitable unit and I am submitting your booking request for ${detectedProperty?.name ?? 'the selected property'}.`,
    }
  }

  const propertyLabel = detectedProperty ? `for ${String(detectedProperty.name ?? 'that property')}` : ''
  const suggestions = properties.slice(0, 3).map((property) => String(property.name ?? 'Property')).join(', ')

  if (missing.includes('property')) {
    return {
      propertyId,
      unitId,
      visitDate,
      visitTime,
      note,
      shouldSubmit: false,
      message: properties.length
        ? `I can help with that. Which property do you want to visit? I can see ${suggestions}${properties.length > 3 ? ' and more' : ''}.`
        : 'There are no properties loaded right now, so I cannot pick one yet.',
    }
  }

  if (missing.includes('date')) {
    return {
      propertyId,
      unitId,
      visitDate,
      visitTime,
      note,
      shouldSubmit: false,
      message: `I have the property ${propertyLabel}. What date would you like to visit?`,
    }
  }

  if (missing.includes('time')) {
    return {
      propertyId,
      unitId,
      visitDate,
      visitTime,
      note,
      shouldSubmit: false,
      message: `I have the property and date ready. What time would you like to visit?`,
    }
  }

  return {
    propertyId,
    unitId,
    visitDate,
    visitTime,
    note,
    shouldSubmit: false,
    message: `I can submit this once I find a matching unit for the property.`,
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function findProperty(normalizedText: string, properties: RecordData[], currentPropertyId?: string) {
  if (currentPropertyId) {
    const currentProperty = properties.find((property) => String(property.id) === currentPropertyId)
    if (currentProperty) return currentProperty
  }

  let bestMatch: RecordData | undefined
  let bestScore = 0

  for (const property of properties) {
    const name = normalize(String(property.name ?? ''))
    if (!name) continue
    if (normalizedText.includes(name)) {
      return property
    }

    const score = name.split(/\s+/).filter((token) => normalizedText.includes(token)).length
    if (score > bestScore) {
      bestScore = score
      bestMatch = property
    }
  }

  return bestScore >= 2 ? bestMatch : undefined
}

function findDate(text: string) {
  const today = new Date()
  const explicit = /\b(\d{4}-\d{2}-\d{2})\b/.exec(text)
  if (explicit?.[1]) return explicit[1]

  if (/\btoday\b/i.test(text)) return toDateString(today)
  if (/\btomorrow\b/i.test(text)) return toDateString(addDays(today, 1))
  return undefined
}

function findTime(text: string) {
  const timeMatch = /\b(?:at\s+)?(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?\b/i.exec(text)
  if (!timeMatch) return undefined

  let hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2] ?? '00')
  const meridiem = timeMatch[3]?.toLowerCase()

  if (meridiem === 'pm' && hour < 12) hour += 12
  if (meridiem === 'am' && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function findNote(text: string, property?: RecordData, date?: string, time?: string) {
  const cleaned = text
    .replace(/\b(book|reserve|visit|schedule|request)\b/gi, ' ')
    .replace(/\b(today|tomorrow)\b/gi, ' ')
    .replace(/\b(at|for|on|around)\b/gi, ' ')
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, ' ')
    .replace(/\b(\d{1,2})(?::?(\d{2}))?\s*(am|pm)?\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!property && !date && !time) return cleaned || undefined
  return cleaned || undefined
}

function findUnitId(propertyId: string | undefined, availableUnits: RecordData[], buildings: RecordData[], currentUnitId?: string) {
  if (currentUnitId) return currentUnitId
  if (!propertyId) return undefined

  const matchingBuildingIds = new Set(
    buildings
      .filter((building) => String(building.propertyId ?? '') === propertyId)
      .map((building) => String(building.id)),
  )

  const matchingUnit = availableUnits.find((unit) => matchingBuildingIds.has(String(unit.buildingId)))
  return matchingUnit ? String(matchingUnit.id) : undefined
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
