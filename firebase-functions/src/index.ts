import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { setGlobalOptions } from 'firebase-functions/v2/options'

const STAFF_ROLES = ['admin', 'coordinator'] as const

type StaffRole = (typeof STAFF_ROLES)[number]
type TaskType = 'new-inquiry' | 'intake-call' | 'follow-up' | 'review-evals'
type TaskPriority = 'low' | 'medium' | 'high'

type TaskPayload = {
  title: string
  link: string
  inquiryId: string
  serviceArea: string
  type: TaskType
  priority?: TaskPriority
  due?: FirebaseFirestore.Timestamp | null
}

type ActivityPayload = {
  message: string
  link: string
  inquiryId: string
}

if (!admin.apps.length) {
  admin.initializeApp()
}

setGlobalOptions({
  region: 'us-central1',
  maxInstances: 20,
})

const db = admin.firestore()

async function getStaffUserIds(): Promise<string[]> {
  const snapshot = await db
    .collection('users')
    .where('role', 'in', STAFF_ROLES as readonly StaffRole[])
    .get()

  if (snapshot.empty) {
    console.warn('[functions] No staff users found when attempting to create tasks/activity')
    return []
  }

  return snapshot.docs.map((doc) => doc.id)
}

async function createAdminTask(payload: TaskPayload) {
  const staffIds = await getStaffUserIds()
  if (!staffIds.length) return

  const batch = db.batch()
  const now = admin.firestore.FieldValue.serverTimestamp()

  for (const staffId of staffIds) {
    const taskRef = db.collection('users').doc(staffId).collection('tasks').doc()
    batch.set(taskRef, {
      title: payload.title,
      type: payload.type,
      status: 'pending',
      priority: payload.priority ?? 'medium',
      serviceArea: payload.serviceArea,
      inquiryId: payload.inquiryId,
      link: payload.link,
      assignedTo: staffId,
      createdAt: now,
      due: payload.due ?? null,
    })
  }

  await batch.commit()
  console.log(
    `[functions] Created task "${payload.title}" for ${staffIds.length} staff member(s)`
  )
}

async function createAdminActivity(payload: ActivityPayload) {
  const staffIds = await getStaffUserIds()
  if (!staffIds.length) return

  const batch = db.batch()
  const now = admin.firestore.FieldValue.serverTimestamp()

  for (const staffId of staffIds) {
    const activityRef = db.collection('users').doc(staffId).collection('activity').doc()
    batch.set(activityRef, {
      ...payload,
      read: false,
      createdAt: now,
    })
  }

  await batch.commit()
  console.log(
    `[functions] Created activity "${payload.message}" for ${staffIds.length} staff member(s)`
  )
}

function getParticipantName(data: FirebaseFirestore.DocumentData | undefined): string {
  if (!data) return 'New Inquiry'
  const formData = (data.formData ?? {}) as Record<string, unknown>
  const firstName = formData.firstName ?? formData.contactOneFirstName ?? formData.participantName
  const lastName = formData.lastName ?? formData.contactOneLastName ?? ''

  if (typeof formData.name === 'string' && formData.name.trim().length > 0) {
    return formData.name.trim()
  }

  if (typeof firstName === 'string' && firstName.trim().length > 0) {
    const last = typeof lastName === 'string' && lastName.trim().length > 0 ? ` ${lastName}` : ''
    return `${firstName}${last}`.trim()
  }

  return 'New Inquiry'
}

function formatServiceAreaLabel(serviceArea: string): string {
  switch (serviceArea) {
    case 'facilitation':
      return 'Facilitation'
    case 'restorativePractices':
      return 'Restorative Practices'
    default:
      return 'Mediation'
  }
}

async function closeInitialTasks(inquiryId: string) {
  const snapshot = await db
    .collectionGroup('tasks')
    .where('inquiryId', '==', inquiryId)
    .where('type', '==', 'new-inquiry')
    .where('status', '==', 'pending')
    .get()

  if (snapshot.empty) {
    return
  }

  const batch = db.batch()
  const completedAt = admin.firestore.FieldValue.serverTimestamp()

  for (const doc of snapshot.docs) {
    batch.update(doc.ref, {
      status: 'done',
      completedAt,
    })
  }

  await batch.commit()
  console.log(`[functions] Closed ${snapshot.size} initial task(s) for inquiry ${inquiryId}`)
}

function toTimestamp(value?: string): FirebaseFirestore.Timestamp | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return admin.firestore.Timestamp.fromMillis(parsed)
}

export const onInquiryCreated = onDocumentCreated(
  {
    document: 'serviceAreas/{serviceId}/inquiries/{inquiryId}',
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const data = event.data?.data()
    const serviceArea = event.params.serviceId as string
    const inquiryId = event.params.inquiryId as string
    const participantName = getParticipantName(data)
    const serviceLabel = formatServiceAreaLabel(serviceArea)
    const link = `/dashboard/${serviceArea}/inquiries/${inquiryId}`

    await createAdminTask({
      title: `New ${serviceLabel} inquiry from ${participantName}`,
      link,
      inquiryId,
      serviceArea,
      type: 'new-inquiry',
      priority: 'high',
      due: null,
    })

    await createAdminActivity({
      message: `New ${serviceLabel} inquiry from ${participantName}.`,
      link,
      inquiryId,
    })
  },
)

export const onInquiryUpdated = onDocumentUpdated(
  {
    document: 'serviceAreas/{serviceId}/inquiries/{inquiryId}',
    region: 'us-central1',
    retry: false,
  },
  async (event) => {
    const beforeStatus = event.data?.before?.get('status') as string | undefined
    const afterStatus = event.data?.after?.get('status') as string | undefined

    if (beforeStatus === afterStatus || afterStatus !== 'intake-scheduled') {
      return
    }

    const serviceArea = event.params.serviceId as string
    const inquiryId = event.params.inquiryId as string
    const participantName = getParticipantName(event.data?.after?.data())
    const link = `/dashboard/${serviceArea}/inquiries/${inquiryId}`
    const scheduledTimeRaw = event.data?.after?.get(
      'calendlyScheduling.scheduledTime',
    ) as string | undefined

    await closeInitialTasks(inquiryId)

    await createAdminTask({
      title: `Intake call with ${participantName}`,
      link,
      inquiryId,
      serviceArea,
      type: 'intake-call',
      priority: 'high',
      due: toTimestamp(scheduledTimeRaw),
    })

    await createAdminActivity({
      message: `${participantName} has scheduled their intake.`,
      link,
      inquiryId,
    })
  },
)
