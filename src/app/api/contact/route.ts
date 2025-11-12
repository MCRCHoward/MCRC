import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { ContactEmail } from '@/emails/templates/ContactEmail'

const ContactSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  service: z.string().min(1),
  subject: z.string().min(5),
  message: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = ContactSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Basic metadata for traceability
    const ua = request.headers.get('user-agent') || undefined
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined

    const { firstName, lastName, ...rest } = parsed.data
    const payload = {
      ...rest,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      status: 'new' as const,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      meta: {
        ip,
        userAgent: ua,
      },
    }

    const docRef = await adminDb.collection('contacts').add(payload)

    // Also save to contactSubmissions collection as backup
    try {
      await adminDb.collection('contactSubmissions').add({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        service: parsed.data.service,
        subject: parsed.data.subject,
        message: parsed.data.message,
        submittedAt: FieldValue.serverTimestamp(),
        reviewed: false,
      })
    } catch (firestoreError) {
      // Log error but don't fail the request since main save and email are more important
      console.error('[api/contact] Failed to save to contactSubmissions:', firestoreError)
    }

    // Send notification email via Resend (non-blocking best-effort)
    const RESEND_API_KEY = process.env.RESEND_API || process.env.RESEND_API_KEY
    const CONTACT_TO = process.env.CONTACT_TO_EMAIL || 'derrick.valentine@gmail.com'
    const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'director@mcrchoward.org'

    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY)
      const { firstName, lastName, email, phone, service, subject, message } = parsed.data

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [CONTACT_TO],
          replyTo: email,
          subject: `New contact: ${service} – ${subject}`,
          react: ContactEmail({
            id: docRef.id,
            firstName,
            lastName,
            email,
            phone,
            service,
            subject,
            message,
          }),
          tags: [{ name: 'source', value: 'contact-form' }],
        })
      } catch (mailErr) {
        console.warn('[api/contact] Email send failed:', mailErr)
        // Do not fail the request if email fails; the submission is already saved
      }
    } else {
      console.warn('[api/contact] RESEND_API/RESEND_API_KEY is not set; skipping email send')
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/contact] FAILED:', error)
    return NextResponse.json({ error: 'Failed to submit message' }, { status: 500 })
  }
}
