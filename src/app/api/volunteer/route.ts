import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { VolunteerEmail } from '@/emails/templates/VolunteerEmail'

const VolunteerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = VolunteerSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    // Save to Firestore volunteerSubmissions collection
    const docRef = await adminDb.collection('volunteerSubmissions').add({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      submittedAt: FieldValue.serverTimestamp(),
      reviewed: false,
    })

    // Send notification email via Resend (non-blocking best-effort)
    const RESEND_API_KEY = process.env.RESEND_API || process.env.RESEND_API_KEY
    const VOLUNTEER_TO = process.env.VOLUNTEER_TO_EMAIL || 'director@mcrchoward.org'
    const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'director@mcrchoward.org'

    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY)
      const { name, email, phone, message } = parsed.data

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: [VOLUNTEER_TO],
          replyTo: email,
          subject: `New volunteer application from ${name}`,
          react: VolunteerEmail({
            id: docRef.id,
            name,
            email,
            phone: phone || undefined,
            message,
          }),
          tags: [{ name: 'source', value: 'volunteer-form' }],
        })
      } catch (mailErr) {
        console.warn('[api/volunteer] Email send failed:', mailErr)
        // Do not fail the request if email fails; the submission is already saved
      }
    } else {
      console.warn('[api/volunteer] RESEND_API/RESEND_API_KEY is not set; skipping email send')
    }

    return NextResponse.json({ success: true, message: 'Volunteer application submitted successfully' })
  } catch (error) {
    console.error('[api/volunteer] FAILED:', error)
    return NextResponse.json(
      { error: 'Failed to submit volunteer application' },
      { status: 500 },
    )
  }
}

