/**
 * Service Area Configuration
 *
 * Defines the mapping between form types and service areas,
 * along with metadata for each service area.
 */

export const FORM_TO_SERVICE_AREA = {
  'mediation-self-referral': 'mediation',
  'restorative-program-referral': 'restorativePractices',
  'group-facilitation-inquiry': 'facilitation',
  'community-education-training-request': 'facilitation', // Training requests go to facilitation
} as const

export type FormType = keyof typeof FORM_TO_SERVICE_AREA
export type ServiceArea = (typeof FORM_TO_SERVICE_AREA)[FormType]

export const SERVICE_AREA_METADATA = {
  mediation: {
    id: 'mediation',
    label: 'Mediation',
    slug: 'mediation',
    icon: 'handshake',
    color: 'blue',
    description: 'Conflict resolution and mediation services',
  },
  facilitation: {
    id: 'facilitation',
    label: 'Facilitation',
    slug: 'facilitation',
    icon: 'users',
    color: 'green',
    description: 'Group facilitation and dialogue services',
  },
  restorativePractices: {
    id: 'restorativePractices',
    label: 'Restorative Practices',
    slug: 'restorative-practices',
    icon: 'heart',
    color: 'purple',
    description: 'Restorative justice and community healing',
  },
} as const

/**
 * Gets the service area for a given form type
 */
export function getServiceAreaFromFormType(formType: FormType): ServiceArea {
  return FORM_TO_SERVICE_AREA[formType]
}

/**
 * Gets metadata for a service area
 */
export function getServiceAreaMetadata(serviceArea: ServiceArea) {
  return SERVICE_AREA_METADATA[serviceArea]
}

/**
 * Checks if a string is a valid service area
 */
export function isValidServiceArea(value: string): value is ServiceArea {
  return value in SERVICE_AREA_METADATA
}

