import { NextResponse } from 'next/server'
import { formConfirmationSchema } from '@/lib/schemas/formConfirmation'
import { sendFormConfirmationEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = formConfirmationSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    await sendFormConfirmationEmail(parsed.data)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/form-confirmation] FAILED:', error)
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 })
  }
}


