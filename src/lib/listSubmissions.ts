import { adminDb } from '@/lib/firebase-admin'
import type { Timestamp } from 'firebase-admin/firestore'

/**
 * Normalized form submission row
 */
export type SubmissionRow = {
  id: string
  formType: string
  name: string
  email?: string
  phone?: string
  submittedAt: Date
  originalDocPath: string
  reviewed?: boolean
  reviewedAt?: Date
}

/**
 * Pagination metadata
 */
export type PaginationMetadata = {
  hasMore: boolean
  lastDoc?: FirebaseFirestore.QueryDocumentSnapshot
}

/**
 * Result type for paginated queries
 */
export type PaginatedSubmissions = {
  submissions: SubmissionRow[]
  pagination: PaginationMetadata
}

/**
 * Map form ID to display name
 */
function getFormDisplayName(formId: string): string {
  const formNameMap: Record<string, string> = {
    mediationSelfReferral: 'Mediation Self Referral',
    groupFacilitationInquiry: 'Group Facilitation Inquiry',
    restorativeProgramReferral: 'Restorative Program Referral',
    communityEducationTrainingRequest: 'Community Education Training Request',
  }
  return formNameMap[formId] || formId
}

/**
 * Extract normalized name from submission data
 * Tries firstName+lastName, then name, then referrerName, etc.
 */
function getName(data: Record<string, unknown>): string {
  // Try firstName + lastName combination
  const firstName = data.firstName as string | undefined
  const lastName = data.lastName as string | undefined
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim()
  }
  if (firstName) return firstName
  if (lastName) return lastName

  // Try single name field
  if (data.name && typeof data.name === 'string') {
    return data.name
  }

  // Try referrer name
  if (data.referrerName && typeof data.referrerName === 'string') {
    return data.referrerName
  }

  // Try participant name
  if (data.participantName && typeof data.participantName === 'string') {
    return data.participantName
  }

  // Try Contact One (now optional)
  const contactOneFirstName = data.contactOneFirstName as string | undefined
  const contactOneLastName = data.contactOneLastName as string | undefined
  if (contactOneFirstName && contactOneLastName) {
    return `${contactOneFirstName} ${contactOneLastName}`.trim()
  }
  if (contactOneFirstName) return contactOneFirstName
  if (contactOneLastName) return contactOneLastName

  // Try additionalContacts array (new structure)
  if (
    Array.isArray(data.additionalContacts) &&
    data.additionalContacts.length > 0 &&
    typeof data.additionalContacts[0] === 'object' &&
    data.additionalContacts[0] !== null
  ) {
    const firstContact = data.additionalContacts[0] as Record<string, unknown>
    const contactFirstName = firstContact.firstName as string | undefined
    const contactLastName = firstContact.lastName as string | undefined
    if (contactFirstName && contactLastName) {
      return `${contactFirstName} ${contactLastName}`.trim()
    }
    if (contactFirstName) return contactFirstName
    if (contactLastName) return contactLastName
  }

  // Legacy: Try contactTwo for backward compatibility
  const contactTwoFirstName = data.contactTwoFirstName as string | undefined
  const contactTwoLastName = data.contactTwoLastName as string | undefined
  if (contactTwoFirstName && contactTwoLastName) {
    return `${contactTwoFirstName} ${contactTwoLastName}`.trim()
  }
  if (contactTwoFirstName) return contactTwoFirstName
  if (contactTwoLastName) return contactTwoLastName

  return '—'
}

/**
 * Extract normalized email from submission data
 */
function getEmail(data: Record<string, unknown>): string | undefined {
  if (data.email && typeof data.email === 'string') {
    return data.email
  }
  if (data.referrerEmail && typeof data.referrerEmail === 'string') {
    return data.referrerEmail
  }
  if (data.participantEmail && typeof data.participantEmail === 'string') {
    return data.participantEmail
  }
  // Check Contact One (now optional)
  if (data.contactOneEmail && typeof data.contactOneEmail === 'string') {
    return data.contactOneEmail
  }
  // Check additionalContacts array (new structure)
  if (
    Array.isArray(data.additionalContacts) &&
    data.additionalContacts.length > 0 &&
    typeof data.additionalContacts[0] === 'object' &&
    data.additionalContacts[0] !== null
  ) {
    const firstContact = data.additionalContacts[0] as Record<string, unknown>
    if (firstContact.email && typeof firstContact.email === 'string') {
      return firstContact.email
    }
  }
  // Legacy: Check contactTwoEmail for backward compatibility
  if (data.contactTwoEmail && typeof data.contactTwoEmail === 'string') {
    return data.contactTwoEmail
  }
  return undefined
}

/**
 * Extract normalized phone from submission data
 */
function getPhone(data: Record<string, unknown>): string | undefined {
  if (data.phone && typeof data.phone === 'string') {
    return data.phone
  }
  if (data.referrerPhone && typeof data.referrerPhone === 'string') {
    return data.referrerPhone
  }
  if (data.participantPhone && typeof data.participantPhone === 'string') {
    return data.participantPhone
  }
  if (data.parentGuardianPhone && typeof data.parentGuardianPhone === 'string') {
    return data.parentGuardianPhone
  }
  // Check Contact One (now optional)
  if (data.contactOnePhone && typeof data.contactOnePhone === 'string') {
    return data.contactOnePhone
  }
  // Check additionalContacts array (new structure)
  if (
    Array.isArray(data.additionalContacts) &&
    data.additionalContacts.length > 0 &&
    typeof data.additionalContacts[0] === 'object' &&
    data.additionalContacts[0] !== null
  ) {
    const firstContact = data.additionalContacts[0] as Record<string, unknown>
    if (firstContact.phone && typeof firstContact.phone === 'string') {
      return firstContact.phone
    }
  }
  // Legacy: Check contactTwoPhone for backward compatibility
  if (data.contactTwoPhone && typeof data.contactTwoPhone === 'string') {
    return data.contactTwoPhone
  }
  return undefined
}

/**
 * Convert Firestore Timestamp or value to Date
 * Falls back to document createTime if submittedAt is missing
 */
function getSubmittedAt(
  data: Record<string, unknown>,
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): Date {
  const submittedAt = data.submittedAt

  // Handle Firestore Timestamp
  if (
    submittedAt &&
    typeof submittedAt === 'object' &&
    'toDate' in submittedAt &&
    typeof submittedAt.toDate === 'function'
  ) {
    return (submittedAt as Timestamp).toDate()
  }

  // Handle ISO string
  if (typeof submittedAt === 'string') {
    return new Date(submittedAt)
  }

  // Fallback to document createTime (for legacy docs)
  return doc.createTime.toDate()
}

/**
 * List recent form submissions using collection group query
 * Fetches submissions from all forms/{formId}/submissions collections
 *
 * @param limit - Maximum number of submissions to return (default: 10)
 * @param startAfter - Optional document snapshot to start after (for pagination)
 * @returns Array of normalized submission rows
 */
export async function listRecentSubmissions(
  limit = 10,
  startAfter?: FirebaseFirestore.QueryDocumentSnapshot,
): Promise<PaginatedSubmissions> {
  try {
    let query: FirebaseFirestore.Query = adminDb
      .collectionGroup('submissions')
      .orderBy('submittedAt', 'desc')
      .limit(limit + 1) // Fetch one extra to check if there are more

    if (startAfter) {
      query = query.startAfter(startAfter)
    }

    const snapshot = await query.get()

    if (snapshot.empty) {
      return {
        submissions: [],
        pagination: { hasMore: false },
      }
    }

    const docs = snapshot.docs
    const hasMore = docs.length > limit
    const submissionsToReturn = hasMore ? docs.slice(0, limit) : docs
    const lastDoc = submissionsToReturn[submissionsToReturn.length - 1]

    const submissions: SubmissionRow[] = submissionsToReturn.map((doc) => {
      const data = doc.data() as Record<string, unknown>
      const parentFormId = doc.ref.parent.parent?.id ?? 'unknown'

      const submittedAt = getSubmittedAt(data, doc)

      // Handle reviewed flag
      const reviewed = Boolean(data.reviewed)
      let reviewedAt: Date | undefined
      if (data.reviewedAt) {
        if (
          typeof data.reviewedAt === 'object' &&
          'toDate' in data.reviewedAt &&
          typeof data.reviewedAt.toDate === 'function'
        ) {
          reviewedAt = (data.reviewedAt as Timestamp).toDate()
        } else if (typeof data.reviewedAt === 'string') {
          reviewedAt = new Date(data.reviewedAt)
        }
      }

      return {
        id: doc.id,
        formType: getFormDisplayName(parentFormId),
        name: getName(data),
        email: getEmail(data),
        phone: getPhone(data),
        submittedAt,
        originalDocPath: doc.ref.path,
        reviewed,
        reviewedAt,
      }
    })

    return {
      submissions,
      pagination: {
        hasMore,
        lastDoc: hasMore ? lastDoc : undefined,
      },
    }
  } catch (error) {
    console.error('[listRecentSubmissions] Error:', error)
    // Return empty result on error rather than throwing
    return {
      submissions: [],
      pagination: { hasMore: false },
    }
  }
}

/**
 * Get form type display name (exported for use in UI)
 */
export function getFormTypeDisplayName(formId: string): string {
  return getFormDisplayName(formId)
}

