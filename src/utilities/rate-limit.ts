/**
 * Simple in-memory rate limiting utility
 * For production, consider using a Redis-based solution or middleware
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Simple rate limiter
 * @param key - Unique identifier for the rate limit (e.g., userId)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000, // 1 minute default
): boolean {
  const now = Date.now()
  const record = store[key]

  // If no record or window has expired, reset
  if (!record || now > record.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return true
  }

  // If under limit, increment and allow
  if (record.count < maxRequests) {
    record.count++
    return true
  }

  // Rate limited
  return false
}

/**
 * Cleans up expired rate limit records (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const key in store) {
    const record = store[key]
    if (record && record.resetTime < now) {
      delete store[key]
    }
  }
}

