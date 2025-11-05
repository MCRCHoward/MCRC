import canUseDOM from './canUseDOM'

/**
 * Gets the server-side URL from environment variables.
 * Falls back to Vercel production URL or localhost for development.
 *
 * @returns Server-side URL string
 */
export const getServerSideURL = (): string => {
  let url = process.env.NEXT_PUBLIC_SERVER_URL

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (!url) {
    url = 'http://localhost:3000'
  }

  return url
}

/**
 * Gets the client-side URL.
 * Uses browser location if available, otherwise falls back to environment variables.
 *
 * @returns Client-side URL string
 */
export const getClientSideURL = (): string => {
  if (canUseDOM && typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port
    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  return process.env.NEXT_PUBLIC_SERVER_URL || ''
}

/**
 * Convenience function that chooses the right URL based on environment.
 * Uses client-side URL if DOM is available, otherwise server-side URL.
 *
 * @returns The appropriate URL string
 */
export const getURL = (): string => (canUseDOM ? getClientSideURL() : getServerSideURL())

// Export default for convenience
export default getURL
