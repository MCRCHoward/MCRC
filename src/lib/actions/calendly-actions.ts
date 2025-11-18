'use server'

import { adminDb } from '@/lib/firebase-admin'
import {
  FORM_TO_SERVICE_AREA,
  SERVICE_AREA_METADATA,
  type FormType,
  type ServiceArea,
} from '@/lib/service-area-config'
import type { CalendlySettings } from '@/types/calendly'

interface CalendlyLinkResult {
  calendlyUrl: string
  participantName: string
  participantEmail: string | null
  serviceArea: ServiceArea
}

const SETTINGS_DOC_PATH = 'settings/calendly'

const SERVICE_AREA_TO_FORM_TYPES = Object.entries(FORM_TO_SERVICE_AREA).reduce(
  (acc, [formType, serviceArea]) => {
    const area = serviceArea as ServiceArea
    if (!acc[area]) {
      acc[area] = []
    }
    acc[area]!.push(formType as FormType)
    return acc
  },
  {} as Partial<Record<ServiceArea, FormType[]>>,
)

function resolveServiceArea(slugOrId: string): ServiceArea {
  const direct = SERVICE_AREA_METADATA[slugOrId as ServiceArea]
  if (direct) {
    return direct.id as ServiceArea
  }

  const match = Object.values(SERVICE_AREA_METADATA).find((meta) => meta.slug === slugOrId)
  if (match) {
    return match.id as ServiceArea
  }

  throw new Error(`Invalid service area: ${slugOrId}`)
}

function formatParticipantName(formData: Record<string, unknown>): string {
  const primaryName = formData.name
  if (typeof primaryName === 'string' && primaryName.trim().length > 0) {
    return primaryName.trim()
  }

  const firstName =
    formData.firstName || formData.contactOneFirstName || formData.participantName || ''
  const lastName = formData.lastName || formData.contactOneLastName || ''

  const first = typeof firstName === 'string' ? firstName.trim() : ''
  const last = typeof lastName === 'string' ? lastName.trim() : ''

  const combined = [first, last].filter(Boolean).join(' ')
  return combined.length > 0 ? combined : 'New Inquiry'
}

function extractEmail(formData: Record<string, unknown>): string | null {
  const email =
    formData.email || formData.contactOneEmail || formData.referrerEmail || formData.participantEmail
  return typeof email === 'string' && email.trim().length > 0 ? email.trim() : null
}

function buildCalendlyUrl(
  baseUrl: string,
  params: { name: string; email: string | null; inquiryId: string },
) {
  const url = new URL(baseUrl)
  url.searchParams.set('name', params.name)
  if (params.email) {
    url.searchParams.set('email', params.email)
  }
  url.searchParams.set('tracking[salesforce_uuid]', params.inquiryId)
  return url.toString()
}

function getEventTypeUrl(
  serviceArea: ServiceArea,
  mappings?: Record<string, string>,
): string | null {
  if (mappings?.[serviceArea]) {
    return mappings[serviceArea] ?? null
  }

  const relatedForms = SERVICE_AREA_TO_FORM_TYPES[serviceArea] ?? []
  for (const formType of relatedForms) {
    if (mappings?.[formType]) {
      return mappings[formType] ?? null
    }
  }

  return null
}

export async function getCalendlyLink(
  inquiryId: string,
  serviceAreaSlug: string,
): Promise<CalendlyLinkResult> {
  const serviceArea = resolveServiceArea(serviceAreaSlug)

  const inquiryRef = adminDb.doc(`serviceAreas/${serviceArea}/inquiries/${inquiryId}`)
  const inquirySnap = await inquiryRef.get()

  if (!inquirySnap.exists) {
    throw new Error('Inquiry not found')
  }

  const inquiryData = inquirySnap.data() ?? {}
  const formData = (inquiryData.formData ?? {}) as Record<string, unknown>
  const participantName = formatParticipantName(formData)
  const participantEmail = extractEmail(formData)

  const settingsSnap = await adminDb.doc(SETTINGS_DOC_PATH).get()
  if (!settingsSnap.exists) {
    throw new Error('Calendly settings not configured')
  }

  const settings = settingsSnap.data() as CalendlySettings
  const eventTypeUrl = getEventTypeUrl(serviceArea, settings.eventTypeMappings)

  if (!eventTypeUrl) {
    throw new Error(`Calendly event type mapping missing for ${serviceArea}`)
  }

  const calendlyUrl = buildCalendlyUrl(eventTypeUrl, {
    name: participantName,
    email: participantEmail,
    inquiryId,
  })

  return {
    calendlyUrl,
    participantName,
    participantEmail,
    serviceArea,
  }
}
