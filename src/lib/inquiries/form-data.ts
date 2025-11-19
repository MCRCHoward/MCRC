import { Timestamp } from 'firebase-admin/firestore'

type PlainObject = Record<string, unknown>

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item)).filter((item) => item !== undefined)
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as PlainObject)
    const next: PlainObject = {}
    for (const [key, childValue] of entries) {
      const serialized = serializeValue(childValue)
      if (serialized !== undefined) {
        next[key] = serialized
      }
    }
    return next
  }

  return value
}

function hydrateValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => hydrateValue(item))
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as PlainObject)
    const next: PlainObject = {}
    for (const [key, childValue] of entries) {
      next[key] = hydrateValue(childValue)
    }
    return next
  }

  return value
}

export function prepareFormDataForFirestore<T extends PlainObject>(data: T): PlainObject {
  return serializeValue(data) as PlainObject
}

export function hydrateFormDataFromFirestore<T extends PlainObject>(data: T): PlainObject {
  return hydrateValue(data) as PlainObject
}


