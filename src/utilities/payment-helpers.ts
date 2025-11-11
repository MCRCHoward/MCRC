import type { Event } from '@/types/event'

/**
 * Validates that payment amount matches expected event cost
 * Allows small rounding differences (0.01)
 */
export function validatePaymentAmount(
  amount: number,
  expectedAmount: number,
  currency: string,
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid payment amount' }
  }

  if (isNaN(expectedAmount) || expectedAmount <= 0) {
    return { valid: false, error: 'Invalid event cost' }
  }

  // Allow small rounding differences (0.01)
  const difference = Math.abs(amount - expectedAmount)
  if (difference > 0.01) {
    return {
      valid: false,
      error: `Payment amount mismatch. Expected ${expectedAmount.toFixed(2)} ${currency}, got ${amount.toFixed(2)}`,
    }
  }

  return { valid: true }
}

/**
 * Formats payment amount for display
 */
export function formatPaymentAmount(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Determines if an event requires payment
 */
export function isPaymentRequired(event: Event): boolean {
  return !event.isFree && !!event.cost && (typeof event.cost.amount === 'number' ? event.cost.amount > 0 : parseFloat(event.cost.amount) > 0)
}

/**
 * Gets the event cost amount as a number
 */
export function getEventCostAmount(event: Event): number | null {
  if (event.isFree || !event.cost) {
    return null
  }

  const amount = typeof event.cost.amount === 'number' ? event.cost.amount : parseFloat(event.cost.amount)
  return isNaN(amount) ? null : amount
}

/**
 * Gets the event cost currency
 */
export function getEventCostCurrency(event: Event): string {
  return event.cost?.currency || 'USD'
}
