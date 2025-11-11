/**
 * PayPal Server Configuration Utility
 * Server-side only - for PayPal server SDK operations
 */

/**
 * Gets PayPal server SDK client for order operations
 * Returns configured PayPal client instance
 * This function should ONLY be used in server actions
 */
export async function getPayPalClient() {
  const environment = (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'

  // Dynamic import to avoid loading server SDK on client
  const paypal = await import('@paypal/checkout-server-sdk')

  let clientId: string
  let clientSecret: string

  if (environment === 'production') {
    clientId = process.env.PAYPAL_PRODUCTION_CLIENT_ID || ''
    clientSecret = process.env.PAYPAL_PRODUCTION_SECRET_KEY_1 || ''

    if (!clientId || !clientSecret) {
      throw new Error(
        'PAYPAL_PRODUCTION_CLIENT_ID and PAYPAL_PRODUCTION_SECRET_KEY_1 are required when PAYPAL_ENVIRONMENT=production',
      )
    }

    const environmentConfig = new paypal.core.LiveEnvironment(clientId, clientSecret)
    return new paypal.core.PayPalHttpClient(environmentConfig)
  }

  // Default to sandbox
  clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID || ''
  clientSecret = process.env.PAYPAL_SANDBOX_SECRET_KEY_1 || ''

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_SECRET_KEY_1 are required')
  }

  const environmentConfig = new paypal.core.SandboxEnvironment(clientId, clientSecret)
  return new paypal.core.PayPalHttpClient(environmentConfig)
}

