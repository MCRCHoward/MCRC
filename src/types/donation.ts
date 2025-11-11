/**
 * Donation Frequency Type
 * Monthly donations are disabled in V1 but kept in type for future use
 */
export type DonationFrequency = 'one-time' | 'monthly'

/**
 * Payment Status for Donations
 */
export type DonationPaymentStatus = 'completed' | 'pending' | 'failed'

/**
 * Donation Type
 * 
 * Represents a donation made to MCRC.
 * Stored in root-level `donations` collection.
 * Document ID is handled separately by Firestore, not stored in the document data.
 */
export interface Donation {
  id: string // Firestore document ID (not stored in document, retrieved separately)
  amount: number
  currency: string // Default 'USD'
  frequency: DonationFrequency
  donorName: string
  donorEmail: string
  donorPhone?: string // Optional
  emailMarketingConsent: boolean
  paymentId: string // PayPal order ID
  paymentStatus: DonationPaymentStatus
  paymentDate: string // ISO timestamp
  donationDate: string // ISO timestamp
  notes?: string // Optional, for admin use
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

/**
 * Input type for creating a new donation
 * Omits fields that are auto-generated or set by the server
 */
export type DonationInput = Omit<
  Donation,
  | 'id'
  | 'paymentId'
  | 'paymentStatus'
  | 'paymentDate'
  | 'donationDate'
  | 'createdAt'
  | 'updatedAt'
>

/**
 * Future type for subscription-based donations (Phase 2)
 * Will be used when monthly recurring donations are implemented
 */
export interface DonationSubscription {
  subscriptionId: string // PayPal subscription ID
  donationId: string // Reference to initial donation document
  status: 'active' | 'cancelled' | 'expired'
  nextBillingDate?: string // ISO timestamp
  createdAt: string
  updatedAt: string
}

