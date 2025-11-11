'use server'

import { adminDb } from '@/lib/firebase-admin'
import { requireAuth } from '@/lib/custom-auth'
import { getPayPalServerConfig } from '@/lib/paypal-config'
import type { EventRegistrationInput } from '@/types/event-registration'
import { getEventName, timestampToISOString, getEventSlug } from '@/utilities/event-helpers'
import { sanitizeString, sanitizePhone, sanitizeEmail } from '@/utilities/sanitize'
import { logError } from '@/utilities/error-logging'
import {
  Client,
  Environment,
  OrdersController,
  CheckoutPaymentIntent,
  OrderApplicationContextLandingPage,
  OrderApplicationContextUserAction,
} from '@paypal/paypal-server-sdk'

/**
 * Creates a PayPal client instance
 */
function createPayPalClient() {
  const paypalConfig = getPayPalServerConfig()

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: paypalConfig.clientId,
      oAuthClientSecret: paypalConfig.clientSecret,
    },
    environment: paypalConfig.environment === 'production' ? Environment.Production : Environment.Sandbox,
  })
}

/**
 * Creates a PayPal order for event registration payment
 * Returns order ID for client-side approval
 */
export async function createPayPalOrder(
  eventId: string,
  _registrationData: EventRegistrationInput,
): Promise<{ orderId: string }> {
  const user = await requireAuth()

  // Fetch event details
  const eventRef = adminDb.doc(`events/${eventId}`)
  const eventDoc = await eventRef.get()

  if (!eventDoc.exists) {
    throw new Error('Event not found')
  }

  const eventData = eventDoc.data()
  if (!eventData) {
    throw new Error('Event data not available')
  }

  // Validate event has cost
  if (eventData.isFree || !eventData.cost) {
    throw new Error('This event does not require payment')
  }

  const cost = eventData.cost
  const amount = typeof cost.amount === 'number' ? cost.amount : parseFloat(cost.amount)
  const currency = cost.currency || 'USD'

  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid event cost')
  }

  // Get event name for order description
  const eventName = getEventName(eventData)
  const eventSlug = eventData.slug || eventId

  // Create PayPal client and orders controller
  const client = createPayPalClient()
  const ordersController = new OrdersController(client)

  // Create PayPal order request body
  // Note: @paypal/paypal-server-sdk uses camelCase for TypeScript types
  const orderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        description: `Event Registration: ${eventName}`,
        amount: {
          currencyCode: currency,
          value: amount.toFixed(2),
        },
        customId: eventId, // Store event ID for validation
      },
    ],
    applicationContext: {
      brandName:
        process.env.PAYPAL_PRODUCTION_DISPLAY_APP_NAME ||
        process.env.PAYPAL_SANDBOX_DISPLAY_APP_NAME ||
        'MCRC Event Registration',
      landingPage: OrderApplicationContextLandingPage.NoPreference,
      userAction: OrderApplicationContextUserAction.PayNow,
      returnUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/events/${eventSlug}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/events/${eventSlug}`,
    },
  }

  try {
    const response = await ordersController.createOrder({
      body: orderRequest,
      prefer: 'return=representation',
    })

    const order = response.result

    if (!order || !order.id) {
      throw new Error('Failed to create PayPal order')
    }

    return { orderId: order.id }
  } catch (error) {
    logError('Error creating PayPal order', error, {
      eventId,
      userId: user.id,
      amount,
      currency,
    })
    throw new Error('Failed to create payment order. Please try again.')
  }
}

/**
 * Captures a PayPal order and creates the event registration
 * Only creates registration after successful payment capture
 */
export async function capturePayPalOrder(
  orderId: string,
  eventId: string,
  registrationData: EventRegistrationInput,
): Promise<{ id: string }> {
  const user = await requireAuth()

  // Create PayPal client and orders controller
  const client = createPayPalClient()
  const ordersController = new OrdersController(client)

  // Fetch event details for validation
  const eventRef = adminDb.doc(`events/${eventId}`)
  const eventDoc = await eventRef.get()

  if (!eventDoc.exists) {
    throw new Error('Event not found')
  }

  const eventData = eventDoc.data()
  if (!eventData) {
    throw new Error('Event data not available')
  }

  // Validate event has cost
  if (eventData.isFree || !eventData.cost) {
    throw new Error('This event does not require payment')
  }

  const cost = eventData.cost
  const expectedAmount = typeof cost.amount === 'number' ? cost.amount : parseFloat(cost.amount)
  const currency = cost.currency || 'USD'

  if (isNaN(expectedAmount) || expectedAmount <= 0) {
    throw new Error('Invalid event cost')
  }

  // Capture the PayPal order
  try {
    const response = await ordersController.captureOrder({
      id: orderId,
      body: {},
      prefer: 'return=representation',
    })

    const order = response.result

    if (!order || order.status !== 'COMPLETED') {
      throw new Error('Payment was not completed')
    }

    // Validate payment amount matches event cost
    // Note: @paypal/paypal-server-sdk uses camelCase for TypeScript types
    const purchaseUnit = order.purchaseUnits?.[0]
    const capture = purchaseUnit?.payments?.captures?.[0]

    if (!capture) {
      throw new Error('Payment capture not found')
    }

    const paidAmount = parseFloat(capture.amount?.value || '0')
    const paidCurrency = capture.amount?.currencyCode || 'USD'

    if (paidCurrency !== currency) {
      throw new Error(`Payment currency mismatch. Expected ${currency}, got ${paidCurrency}`)
    }

    // Allow small rounding differences (0.01)
    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      throw new Error(
        `Payment amount mismatch. Expected ${expectedAmount.toFixed(2)} ${currency}, got ${paidAmount.toFixed(2)} ${paidCurrency}`,
      )
    }

    // Validate order belongs to correct event
    const customId = purchaseUnit?.customId
    if (customId !== eventId) {
      throw new Error('Payment order does not match event')
    }

    // Now create the registration with payment information
    const eventName = getEventName(eventData)
    const eventDate = timestampToISOString(eventData.startAt)
    const eventSlug = getEventSlug(eventData, eventId)

    // Sanitize user inputs
    const sanitizedName = sanitizeString(registrationData.name)
    const sanitizedEmail = sanitizeEmail(registrationData.email)
    const sanitizedPhone = registrationData.phone ? sanitizePhone(registrationData.phone) : undefined
    const sanitizedNotes = registrationData.notes ? sanitizeString(registrationData.notes) : undefined

    // Create registration document with payment information
    const registrationPayload = {
      eventId,
      userId: user.id,
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      registrationDate: new Date().toISOString(),
      status: 'registered' as const,
      emailMarketingConsent: registrationData.emailMarketingConsent,
      serviceInterest: registrationData.serviceInterest,
      eventName,
      eventDate,
      eventSlug,
      paymentId: orderId,
      paymentStatus: 'completed' as const,
      paymentAmount: paidAmount,
      paymentCurrency: paidCurrency,
      paymentDate: new Date().toISOString(),
      ...(sanitizedNotes && { notes: sanitizedNotes }),
    }

    const registrationRef = await adminDb.collection('eventRegistrations').add(registrationPayload)

    return { id: registrationRef.id }
  } catch (error) {
    logError('Error capturing PayPal order', error, {
      orderId,
      eventId,
      userId: user.id,
    })

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('amount mismatch') || error.message.includes('currency')) {
        throw error
      }
      if (error.message.includes('not completed')) {
        throw new Error('Payment was not completed. Please try again.')
      }
    }

    throw new Error('Failed to process payment. Please contact support if the issue persists.')
  }
}
