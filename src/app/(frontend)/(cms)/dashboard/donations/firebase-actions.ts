'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { toISOString } from '../utils/timestamp-helpers'
import { sanitizeString } from '@/utilities/sanitize'
import { logError } from '@/utilities/error-logging'

/**
 * Updates admin notes for a donation
 */
export async function updateDonationNotes(donationId: string, notes: string): Promise<void> {
  try {
    const sanitizedNotes = sanitizeString(notes)

    await adminDb.doc(`donations/${donationId}`).update({
      notes: sanitizedNotes,
      updatedAt: FieldValue.serverTimestamp(),
    })

    revalidatePath('/dashboard/donations')
    revalidatePath(`/dashboard/donations/${donationId}`)
  } catch (error) {
    logError('Error updating donation notes', error, { donationId })
    throw new Error('Failed to update donation notes. Please try again.')
  }
}

/**
 * Fetches a single donation by ID
 */
export async function getDonationById(donationId: string) {
  try {
    const snapshot = await adminDb.doc(`donations/${donationId}`).get()

    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data()

    return {
      id: snapshot.id,
      amount: data?.amount || 0,
      currency: data?.currency || 'USD',
      frequency: data?.frequency || 'one-time',
      donorName: data?.donorName || '',
      donorEmail: data?.donorEmail || '',
      donorPhone: data?.donorPhone,
      emailMarketingConsent: Boolean(data?.emailMarketingConsent),
      paymentId: data?.paymentId || '',
      paymentStatus: data?.paymentStatus || 'completed',
      paymentDate: toISOString(data?.paymentDate),
      donationDate: toISOString(data?.donationDate),
      notes: data?.notes,
      createdAt: toISOString(data?.createdAt),
      updatedAt: toISOString(data?.updatedAt),
    }
  } catch (error) {
    logError('Error fetching donation', error, { donationId })
    return null
  }
}

/**
 * Fetches all donations with optional filtering
 */
export async function getDonations(options?: {
  limit?: number
  orderBy?: 'donationDate' | 'createdAt' | 'amount'
  orderDirection?: 'asc' | 'desc'
}) {
  try {
    const limit = options?.limit || 50
    const orderBy = options?.orderBy || 'donationDate'
    const orderDirection = options?.orderDirection || 'desc'

    const query = adminDb.collection('donations').orderBy(orderBy, orderDirection)

    const snapshot = await query.limit(limit).get()

    if (snapshot.empty) {
      return []
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        frequency: data.frequency || 'one-time',
        donorName: data.donorName || '',
        donorEmail: data.donorEmail || '',
        donorPhone: data.donorPhone,
        emailMarketingConsent: Boolean(data.emailMarketingConsent),
        paymentId: data.paymentId || '',
        paymentStatus: data.paymentStatus || 'completed',
        paymentDate: toISOString(data.paymentDate),
        donationDate: toISOString(data.donationDate),
        notes: data.notes,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      }
    })
  } catch (error) {
    logError('Error fetching donations', error, options)
    return []
  }
}

