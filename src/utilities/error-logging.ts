/**
 * Centralized error logging utility
 * Replaces console.error with structured logging
 */

interface LogContext {
  [key: string]: unknown
}

/**
 * Logs an error with context
 * In production, this could be integrated with a logging service
 */
export function logError(message: string, error: unknown, context?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  // In development, log to console with full details
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, {
      error: errorMessage,
      stack: errorStack,
      ...context,
    })
  } else {
    // In production, you might want to send to a logging service
    // For now, we'll still log but with less detail
    console.error(`[ERROR] ${message}: ${errorMessage}`, context)
  }
}

/**
 * Logs a warning with context
 */
export function logWarning(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[WARN] ${message}`, context)
  } else {
    console.warn(`[WARN] ${message}`)
  }
}

/**
 * Logs an info message with context
 */
export function logInfo(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[INFO] ${message}`, context)
  }
}

