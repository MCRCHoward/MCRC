import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

interface NewsletterSubscribeRequest {
  email: string
  firstName?: string
}

interface KitSubscriberResponse {
  subscriber: {
    id: number
    email_address: string
    first_name?: string
    state: string
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, firstName }: NewsletterSubscribeRequest = body

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const kitApiKey = process.env.KIT_API_KEY
    if (!kitApiKey) {
      console.error('[newsletter/subscribe] KIT_API_KEY is not set')
      return NextResponse.json(
        { error: 'Newsletter service is not configured' },
        { status: 500 }
      )
    }

    // Prepare Kit API request body
    const kitRequestBody: {
      email_address: string
      first_name?: string
      state: string
    } = {
      email_address: email,
      state: 'active',
    }

    if (firstName && firstName.trim()) {
      kitRequestBody.first_name = firstName.trim()
    }

    // Call Kit API to create/update subscriber
    let kitSubscriberId: number | null = null
    try {
      const kitResponse = await fetch('https://api.kit.com/v4/subscribers', {
        method: 'POST',
        headers: {
          'X-Kit-Api-Key': kitApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kitRequestBody),
      })

      if (!kitResponse.ok) {
        const errorText = await kitResponse.text()
        console.error('[newsletter/subscribe] Kit API error:', {
          status: kitResponse.status,
          statusText: kitResponse.statusText,
          body: errorText,
        })

        // If subscriber already exists (409), treat as success and try to get the subscriber ID
        if (kitResponse.status === 409) {
          // Try to fetch existing subscriber by email
          try {
            const getResponse = await fetch(
              `https://api.kit.com/v4/subscribers?email_address=${encodeURIComponent(email)}`,
              {
                headers: {
                  'X-Kit-Api-Key': kitApiKey,
                },
              }
            )

            if (getResponse.ok) {
              const data = await getResponse.json()
              if (data.subscribers && data.subscribers.length > 0) {
                kitSubscriberId = data.subscribers[0].id
              }
            }
          } catch (fetchError) {
            // If we can't fetch the subscriber ID, that's okay - we'll save with null
            console.warn('[newsletter/subscribe] Could not fetch existing subscriber ID:', fetchError)
          }
          // Continue to save to Firestore - subscriber already exists in Kit
        } else {
          return NextResponse.json(
            { error: 'Failed to subscribe to newsletter' },
            { status: 500 }
          )
        }
      } else {
        const kitData: KitSubscriberResponse = await kitResponse.json()
        kitSubscriberId = kitData.subscriber.id
      }
    } catch (kitError) {
      console.error('[newsletter/subscribe] Kit API request failed:', kitError)
      return NextResponse.json(
        { error: 'Failed to connect to newsletter service' },
        { status: 500 }
      )
    }

    // Save to Firestore (secondary storage, don't fail if this errors)
    try {
      await adminDb.collection('newsletter').add({
        email: email.toLowerCase().trim(),
        firstName: firstName?.trim() || null,
        subscribedAt: FieldValue.serverTimestamp(),
        kitSubscriberId: kitSubscriberId,
        source: 'website',
      })
    } catch (firestoreError) {
      // Log error but don't fail the request since Kit subscription succeeded
      console.error('[newsletter/subscribe] Firestore save failed:', firestoreError)
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
    })
  } catch (error) {
    console.error('[newsletter/subscribe] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

