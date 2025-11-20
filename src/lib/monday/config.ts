import { FORM_TO_SERVICE_AREA } from '@/lib/service-area-config'

type ColumnConfig = {
  status: string
  formType: string
  submissionDate: string
  primaryContact: string
  serviceArea: string
  assignee: string
  description: string
  rawPayload: string
}

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name]
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`[Monday] Missing required environment variable ${name}`)
  }
  return value
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]
  if (value === undefined || value === '') {
    return undefined
  }
  return value
}

function requireNumber(name: string): number {
  const raw = process.env[name]
  if (!raw) {
    throw new Error(`[Monday] Missing required environment variable ${name}`)
  }
  const value = Number(raw)
  if (Number.isNaN(value)) {
    throw new Error(`[Monday] Environment variable ${name} must be a number`)
  }
  return value
}

export const MONDAY_API_URL = getEnv('MONDAY_API_URL', 'https://api.monday.com/v2')
export const MONDAY_API_TOKEN = getOptionalEnv('MONDAY_API') ?? ''
export const MONDAY_API_VERSION = getEnv('MONDAY_API_VERSION', '2023-10')

export const MONDAY_MASTER_BOARD_ID = requireNumber('MONDAY_MASTER_BOARD_ID')
export const MONDAY_GROUP_MEDIATION_REFERRALS =
  getEnv('MONDAY_GROUP_MEDIATION_REFERRALS', 'mediation_referrals')
export const MONDAY_GROUP_RESTORATIVE_REFERRALS =
  getEnv('MONDAY_GROUP_RESTORATIVE_REFERRALS', 'restorative_referrals')

export const MONDAY_DEFAULT_ASSIGNEE_ID = (() => {
  const raw = getOptionalEnv('MONDAY_DEFAULT_ASSIGNEE_ID')
  if (!raw) return undefined
  const value = Number(raw)
  if (Number.isNaN(value)) {
    throw new Error('[Monday] MONDAY_DEFAULT_ASSIGNEE_ID must be a number if provided')
  }
  return value
})()

export const MONDAY_WEB_BASE_URL = getEnv(
  'MONDAY_WEB_BASE_URL',
  'https://monday.com/users/sign_up',
)

export const MONDAY_COLUMNS: ColumnConfig = {
  status: getEnv('MONDAY_COLUMN_STATUS', 'status'),
  formType: getEnv('MONDAY_COLUMN_FORM_TYPE', 'form_type'),
  submissionDate: getEnv('MONDAY_COLUMN_SUBMISSION_DATE', 'submission_date'),
  primaryContact: getEnv('MONDAY_COLUMN_PRIMARY_CONTACT', 'primary_contact'),
  serviceArea: getEnv('MONDAY_COLUMN_SERVICE_AREA', 'service_area'),
  assignee: getEnv('MONDAY_COLUMN_ASSIGNEE', 'owner'),
  description: getEnv('MONDAY_COLUMN_DESCRIPTION', 'description'),
  rawPayload: getEnv('MONDAY_COLUMN_RAW_PAYLOAD', 'raw_payload'),
}

export const MONDAY_SERVICE_AREA_LABELS: Record<string, string> = {
  mediation: 'Mediation',
  restorativePractices: 'Restorative Program',
  facilitation: 'Facilitation',
}

export const SUPPORTED_FORM_TYPES = {
  mediation: 'mediation-self-referral' as (keyof typeof FORM_TO_SERVICE_AREA),
  restorative: 'restorative-program-referral' as (keyof typeof FORM_TO_SERVICE_AREA),
}

export function buildMondayItemUrl(itemId: string): string {
  const base = MONDAY_WEB_BASE_URL.replace(/\/+$/, '')
  return `${base}/boards/${MONDAY_MASTER_BOARD_ID}/pulses/${itemId}`
}


