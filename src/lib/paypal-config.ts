/**
 * PayPal Configuration Utilities
 * Handles both sandbox and production environments
 */

export type PayPalEnvironment = 'sandbox' | 'production'

export interface PayPalConfig {
  clientId: string
  environment: PayPalEnvironment
}

export interface PayPalServerConfig {
  clientId: string
  clientSecret: string
  environment: PayPalEnvironment
}

/**
 * Gets the current PayPal environment from environment variables
 * Defaults to 'sandbox' if not set
 */
export function getPayPalEnvironment(): PayPalEnvironment {
  const env = process.env.PAYPAL_ENVIRONMENT
  if (env === 'production' || env === 'sandbox') {
    return env
  }
  return 'sandbox' // Default to sandbox for safety
}

/**
 * Gets PayPal client-side configuration
 * Returns client ID and environment for use in browser
 */
export function getPayPalConfig(): PayPalConfig {
  const environment = getPayPalEnvironment()
  
  const clientId = environment === 'production'
    ? process.env.NEXT_PUBLIC_PAYPAL_PRODUCTION_CLIENT_ID || process.env.PAYPAL_PRODUCTION_CLIENT_ID
    : process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID || process.env.PAYPAL_SANDBOX_CLIENT_ID

  if (!clientId) {
    throw new Error(
      `PayPal ${environment} client ID is not configured. ` +
      `Please set NEXT_PUBLIC_PAYPAL_${environment.toUpperCase()}_CLIENT_ID or PAYPAL_${environment.toUpperCase()}_CLIENT_ID`
    )
  }

  return {
    clientId,
    environment,
  }
}

/**
 * Gets PayPal server-side configuration
 * Returns client ID, secret, and environment for server operations
 */
export function getPayPalServerConfig(): PayPalServerConfig {
  const environment = getPayPalEnvironment()
  
  const clientId = environment === 'production'
    ? process.env.PAYPAL_PRODUCTION_CLIENT_ID
    : process.env.PAYPAL_SANDBOX_CLIENT_ID

  const clientSecret = environment === 'production'
    ? process.env.PAYPAL_PRODUCTION_SECRET_KEY_1
    : process.env.PAYPAL_SANDBOX_SECRET_KEY_1

  if (!clientId) {
    throw new Error(
      `PayPal ${environment} client ID is not configured. ` +
      `Please set PAYPAL_${environment.toUpperCase()}_CLIENT_ID`
    )
  }

  if (!clientSecret) {
    throw new Error(
      `PayPal ${environment} secret key is not configured. ` +
      `Please set PAYPAL_${environment.toUpperCase()}_SECRET_KEY_1`
    )
  }

  return {
    clientId,
    clientSecret,
    environment,
  }
}
