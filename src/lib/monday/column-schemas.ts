export type ColumnScope = 'shared' | 'mediation' | 'restorative'

export type MondayColumnType = 'text' | 'long_text' | 'date' | 'status' | 'dropdown' | 'people'

export interface ColumnDefinition {
  scope: ColumnScope
  slug: string
  title: string
  type: MondayColumnType
  description?: string
  defaults?: Record<string, unknown>
}

export interface ScopedColumnDefinitions {
  shared: ColumnDefinition[]
  mediation: ColumnDefinition[]
  restorative: ColumnDefinition[]
}

export const FORM_TYPE_LABELS = {
  mediation: 'Mediation Referral',
  restorative: 'Restorative Program',
} as const

const YES_NO_STATUS_DEFAULTS = {
  labels: {
    '0': 'No',
    '1': 'Yes',
  },
}

const REVIEW_STATUS_DEFAULTS = {
  labels: {
    '0': 'Not Reviewed',
    '1': 'Reviewed',
  },
}

const CASE_STATUS_DEFAULTS = {
  labels: {
    '0': 'New',
    '1': 'In Progress',
    '2': 'Closed',
  },
}

const FORM_TYPE_DROPDOWN_DEFAULTS = {
  labels: Object.values(FORM_TYPE_LABELS),
}

export const MEDIATION_MAX_ADDITIONAL_CONTACTS = 5

const SHARED_COLUMNS: ColumnDefinition[] = [
  {
    scope: 'shared',
    slug: 'status',
    title: 'Case Status',
    type: 'status',
    defaults: CASE_STATUS_DEFAULTS,
  },
  {
    scope: 'shared',
    slug: 'formType',
    title: 'Form Type',
    type: 'dropdown',
    defaults: FORM_TYPE_DROPDOWN_DEFAULTS,
  },
  {
    scope: 'shared',
    slug: 'serviceArea',
    title: 'Service Area',
    type: 'text',
  },
  {
    scope: 'shared',
    slug: 'submissionDate',
    title: 'Submission Date',
    type: 'date',
  },
  {
    scope: 'shared',
    slug: 'submittedBy',
    title: 'Submitted By',
    type: 'text',
  },
  {
    scope: 'shared',
    slug: 'submissionType',
    title: 'Submission Type',
    type: 'text',
  },
  {
    scope: 'shared',
    slug: 'reviewed',
    title: 'Reviewed?',
    type: 'status',
    defaults: REVIEW_STATUS_DEFAULTS,
  },
  {
    scope: 'shared',
    slug: 'reviewedAt',
    title: 'Reviewed Date',
    type: 'date',
  },
  {
    scope: 'shared',
    slug: 'assignee',
    title: 'Assigned Intake Coordinator',
    type: 'people',
  },
  {
    scope: 'shared',
    slug: 'primaryContactSummary',
    title: 'Primary Contact Summary',
    type: 'text',
  },
  {
    scope: 'shared',
    slug: 'rawPayload',
    title: 'Raw Payload (JSON)',
    type: 'long_text',
  },
]

const MEDIATION_COLUMNS: ColumnDefinition[] = [
  {
    scope: 'mediation',
    slug: 'prefix',
    title: 'Mediation · Prefix',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'firstName',
    title: 'Mediation · Primary First Name',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'lastName',
    title: 'Mediation · Primary Last Name',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'email',
    title: 'Mediation · Primary Email',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'phone',
    title: 'Mediation · Primary Phone',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'preferredContactMethod',
    title: 'Mediation · Preferred Contact Method',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'allowText',
    title: 'Mediation · Allow Text',
    type: 'status',
    defaults: YES_NO_STATUS_DEFAULTS,
  },
  {
    scope: 'mediation',
    slug: 'allowVoicemail',
    title: 'Mediation · Allow Voicemail',
    type: 'status',
    defaults: YES_NO_STATUS_DEFAULTS,
  },
  {
    scope: 'mediation',
    slug: 'streetAddress',
    title: 'Mediation · Street Address',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'city',
    title: 'Mediation · City',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'state',
    title: 'Mediation · State',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'zipCode',
    title: 'Mediation · ZIP Code',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'referralSource',
    title: 'Mediation · Referral Source',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'conflictOverview',
    title: 'Mediation · Conflict Overview',
    type: 'long_text',
  },
  {
    scope: 'mediation',
    slug: 'isCourtOrdered',
    title: 'Mediation · Court Ordered',
    type: 'status',
    defaults: YES_NO_STATUS_DEFAULTS,
  },
  {
    scope: 'mediation',
    slug: 'contactOneFirstName',
    title: 'Mediation · Contact One First Name',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'contactOneLastName',
    title: 'Mediation · Contact One Last Name',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'contactOneEmail',
    title: 'Mediation · Contact One Email',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'contactOnePhone',
    title: 'Mediation · Contact One Phone',
    type: 'text',
  },
  {
    scope: 'mediation',
    slug: 'deadline',
    title: 'Mediation · Requested Deadline',
    type: 'date',
  },
  {
    scope: 'mediation',
    slug: 'accessibilityNeeds',
    title: 'Mediation · Accessibility Needs',
    type: 'long_text',
  },
  {
    scope: 'mediation',
    slug: 'additionalInfo',
    title: 'Mediation · Additional Information',
    type: 'long_text',
  },
]

for (let index = 0; index < MEDIATION_MAX_ADDITIONAL_CONTACTS; index += 1) {
  const contactNumber = index + 1
  MEDIATION_COLUMNS.push(
    {
      scope: 'mediation',
      slug: `additionalContact${contactNumber}FirstName`,
      title: `Mediation · Additional Contact ${contactNumber} First Name`,
      type: 'text',
    },
    {
      scope: 'mediation',
      slug: `additionalContact${contactNumber}LastName`,
      title: `Mediation · Additional Contact ${contactNumber} Last Name`,
      type: 'text',
    },
    {
      scope: 'mediation',
      slug: `additionalContact${contactNumber}Email`,
      title: `Mediation · Additional Contact ${contactNumber} Email`,
      type: 'text',
    },
    {
      scope: 'mediation',
      slug: `additionalContact${contactNumber}Phone`,
      title: `Mediation · Additional Contact ${contactNumber} Phone`,
      type: 'text',
    },
  )
}

const RESTORATIVE_COLUMNS: ColumnDefinition[] = [
  {
    scope: 'restorative',
    slug: 'referrerName',
    title: 'Restorative · Referrer Name',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'referrerEmail',
    title: 'Restorative · Referrer Email',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'referrerPhone',
    title: 'Restorative · Referrer Phone',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'referrerOrg',
    title: 'Restorative · Referrer Organization',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'referrerRole',
    title: 'Restorative · Referrer Role',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'referrerPreferredContact',
    title: 'Restorative · Referrer Preferred Contact',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantName',
    title: 'Restorative · Participant Name',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantDob',
    title: 'Restorative · Participant Date of Birth',
    type: 'date',
  },
  {
    scope: 'restorative',
    slug: 'participantPronouns',
    title: 'Restorative · Participant Pronouns',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantSchool',
    title: 'Restorative · Participant School / Program',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantPhone',
    title: 'Restorative · Participant Phone',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantEmail',
    title: 'Restorative · Participant Email',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'parentGuardianName',
    title: 'Restorative · Parent/Guardian Name',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'parentGuardianPhone',
    title: 'Restorative · Parent/Guardian Phone',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'parentGuardianEmail',
    title: 'Restorative · Parent/Guardian Email',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'participantBestTime',
    title: 'Restorative · Best Time to Reach Participant',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'incidentDate',
    title: 'Restorative · Incident Date',
    type: 'date',
  },
  {
    scope: 'restorative',
    slug: 'incidentLocation',
    title: 'Restorative · Incident Location',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'incidentDescription',
    title: 'Restorative · Incident Description',
    type: 'long_text',
  },
  {
    scope: 'restorative',
    slug: 'otherParties',
    title: 'Restorative · Other Parties',
    type: 'long_text',
  },
  {
    scope: 'restorative',
    slug: 'reasonReferral',
    title: 'Restorative · Reason for Referral',
    type: 'long_text',
  },
  {
    scope: 'restorative',
    slug: 'serviceRequested',
    title: 'Restorative · Service Requested',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'safetyConcerns',
    title: 'Restorative · Safety or Confidentiality Concerns',
    type: 'long_text',
  },
  {
    scope: 'restorative',
    slug: 'currentDiscipline',
    title: 'Restorative · Current Discipline / Actions',
    type: 'long_text',
  },
  {
    scope: 'restorative',
    slug: 'urgency',
    title: 'Restorative · Urgency',
    type: 'text',
  },
  {
    scope: 'restorative',
    slug: 'additionalNotes',
    title: 'Restorative · Additional Notes',
    type: 'long_text',
  },
]

export const COLUMN_DEFINITIONS: ScopedColumnDefinitions = {
  shared: SHARED_COLUMNS,
  mediation: MEDIATION_COLUMNS,
  restorative: RESTORATIVE_COLUMNS,
}

export type ColumnScopeRequest = 'mediation' | 'restorative'

export function getColumnDefinitions(scope: ColumnScopeRequest): ColumnDefinition[] {
  return [...COLUMN_DEFINITIONS.shared, ...COLUMN_DEFINITIONS[scope]]
}

export type ColumnIdMap = {
  shared: Record<string, string>
  specific: Record<string, string>
}

export function createEmptyColumnIdMap(): ColumnIdMap {
  return {
    shared: {},
    specific: {},
  }
}


