/**
 * Simple performance logging utility
 *
 * Usage in server action:
 *   return measureAsync('createPaperIntake', async () => { ... })
 */

export function measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
  })
}
