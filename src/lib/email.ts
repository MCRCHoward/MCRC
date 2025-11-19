'use server'

import { Resend } from 'resend'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { FormConfirmationEmail } from '@/emails/templates/FormConfirmationEmail'
import { LoggedErrorAlertEmail } from '@/emails/templates/LoggedErrorAlertEmail'

const RESEND_API_KEY = process.env.RESEND_API || process.env.RESEND_API_KEY
const DEFAULT_FROM =
  process.env.CONFIRMATION_FROM_EMAIL ||
  process.env.CONTACT_FROM_EMAIL ||
  'info@mcrchoward.org'

export type FormConfirmationPayload = {
  to: string
  name: string
  formName: string
  summary?: string
}

/**
 * Logs email failures to Firestore in loggedErrors/emailLogs/{autoId}
 */
export async function logEmailError(entry: {
  to: string
  name: string
  formName: string
  summary?: string
  error: string
}) {
  try {
    const docRef = await adminDb
      .collection('loggedErrors')
      .doc('emailLogs')
      .collection('entries')
      .add({
        ...entry,
        createdAt: FieldValue.serverTimestamp(),
      })

    await sendErrorAlertEmail({ id: docRef.id, ...entry })
  } catch (logError) {
    console.error('[email] Failed to log email error', logError)
  }
}

export async function sendFormConfirmationEmail(payload: FormConfirmationPayload) {
  const { to, name, formName, summary } = payload

  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API/RESEND_API_KEY is not set; skipping confirmation email')
    return
  }

  const resend = new Resend(RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: `We received your ${formName}`,
      react: FormConfirmationEmail({ name, formName, summary }),
      tags: [
        { name: 'category', value: 'form-confirmation' },
        { name: 'form', value: formName.toLowerCase().replace(/\s+/g, '-') },
      ],
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('[email] Confirmation email failed:', errorMessage)
    await logEmailError({
      to,
      name,
      formName,
      summary,
      error: errorMessage,
    })
    throw error
  }
}

async function sendErrorAlertEmail(entry: {
  id: string
  to: string
  name: string
  formName: string
  summary?: string
  error: string
}) {
  if (!RESEND_API_KEY) return

  const resend = new Resend(RESEND_API_KEY)
  const ALERT_TO = process.env.ERROR_ALERT_TO_EMAIL || 'info@mcrchoward.org'
  const ALERT_FROM = process.env.ALERT_FROM_EMAIL || DEFAULT_FROM

  try {
    await resend.emails.send({
      from: ALERT_FROM,
      to: ALERT_TO,
      subject: 'ERROR IN FORM',
      react: LoggedErrorAlertEmail({
        ...entry,
      }),
      tags: [{ name: 'type', value: 'form-error' }],
    })
  } catch (error) {
    console.error('[email] Failed to send alert email', error)
  }
}


