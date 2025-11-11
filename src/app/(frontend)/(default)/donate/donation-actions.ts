'use server'

import { redirect } from 'next/navigation'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getPayPalServerConfig } from '@/lib/paypal-config'
import type { DonationInput } from '@/types/donation'
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
 * Creates a PayPal order for donation payment
 * Returns order ID for client-side approval
 * 
 * Phase 1: Only supports one-time donations
 * Phase 2: Will add subscription-based orders for monthly donations
 */
export async function createPayPalDonationOrder(
  amount: number,
  donorData: DonationInput,
): Promise<{ orderId: string }> {
  // Validate amount
  if (isNaN(amount) || amount < 1) {
    throw new Error('Donation amount must be at least $1.00')
  }

  // Validate donor data
  if (!donorData.donorName || !donorData.donorEmail) {
    throw new Error('Donor name and email are required')
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(donorData.donorEmail)) {
    throw new Error('Please provide a valid email address')
  }

  // Only support one-time donations in Phase 1
  if (donorData.frequency !== 'one-time') {
    throw new Error('Monthly donations are coming soon. Please select one-time donation.')
  }

  const currency = donorData.currency || 'USD'

  // Create PayPal client and orders controller
  const client = createPayPalClient()
  const ordersController = new OrdersController(client)

  // Create PayPal order request body
  // Note: @paypal/paypal-server-sdk uses camelCase for TypeScript types
  const orderRequest = {
    intent: CheckoutPaymentIntent.Capture,
    purchaseUnits: [
      {
        description: `Donation to MCRC: ${donorData.donorName}`,
        amount: {
          currencyCode: currency,
          value: amount.toFixed(2),
        },
        customId: `donation-${donorData.frequency}`, // Store donation type for validation
      },
    ],
    applicationContext: {
      brandName:
        process.env.PAYPAL_PRODUCTION_DISPLAY_APP_NAME ||
        process.env.PAYPAL_SANDBOX_DISPLAY_APP_NAME ||
        'MCRC Donation',
      landingPage: OrderApplicationContextLandingPage.NoPreference,
      userAction: OrderApplicationContextUserAction.PayNow,
      returnUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/donate/thank-you`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/donate`,
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
    logError('Error creating PayPal donation order', error, {
      amount,
      currency,
      donorEmail: donorData.donorEmail,
      frequency: donorData.frequency,
    })
    throw new Error('Failed to create payment order. Please try again.')
  }
}

/**
 * Captures a PayPal order and creates the donation record
 * Only creates donation after successful payment capture
 * Redirects to thank-you page with donation ID
 */
export async function capturePayPalDonation(
  orderId: string,
  donationData: DonationInput,
): Promise<never> {
  // Create PayPal client and orders controller
  const client = createPayPalClient()
  const ordersController = new OrdersController(client)

  // Validate donation data
  const amount = donationData.amount
  if (isNaN(amount) || amount < 1) {
    throw new Error('Invalid donation amount')
  }

  const currency = donationData.currency || 'USD'

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

    // Validate payment amount matches donation amount
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
    if (Math.abs(paidAmount - amount) > 0.01) {
      throw new Error(
        `Payment amount mismatch. Expected ${amount.toFixed(2)} ${currency}, got ${paidAmount.toFixed(2)} ${paidCurrency}`,
      )
    }

    // Validate order belongs to donation (check customId)
    const customId = purchaseUnit?.customId
    if (customId !== `donation-${donationData.frequency}`) {
      throw new Error('Payment order does not match donation type')
    }

    // Sanitize user inputs
    const sanitizedName = sanitizeString(donationData.donorName)
    const sanitizedEmail = sanitizeEmail(donationData.donorEmail)
    const sanitizedPhone = donationData.donorPhone ? sanitizePhone(donationData.donorPhone) : undefined
    const sanitizedNotes = donationData.notes ? sanitizeString(donationData.notes) : undefined

    // Create donation document with payment information
    const now = new Date().toISOString()
    const donationPayload = {
      amount: paidAmount,
      currency: paidCurrency,
      frequency: donationData.frequency,
      donorName: sanitizedName,
      donorEmail: sanitizedEmail,
      donorPhone: sanitizedPhone,
      emailMarketingConsent: donationData.emailMarketingConsent,
      paymentId: orderId,
      paymentStatus: 'completed' as const,
      paymentDate: now,
      donationDate: now,
      ...(sanitizedNotes && { notes: sanitizedNotes }),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    const donationRef = await adminDb.collection('donations').add(donationPayload)

    // Redirect to thank-you page with donation ID
    redirect(`/donate/thank-you?id=${donationRef.id}`)
  } catch (error) {
    logError('Error capturing PayPal donation order', error, {
      orderId,
      amount,
      currency,
      donorEmail: donationData.donorEmail,
    })

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('amount mismatch') || error.message.includes('currency')) {
        throw error
      }
      if (error.message.includes('not completed')) {
        throw new Error('Payment was not completed. Please try again.')
      }
      // Check if it's a redirect (Next.js redirect throws)
      if (error.message.includes('NEXT_REDIRECT')) {
        throw error // Re-throw redirects
      }
    }

    throw new Error('Failed to process payment. Please contact support if the issue persists.')
  }
}

