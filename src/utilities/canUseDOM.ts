/**
 * Checks if the code is running in a browser environment (DOM is available).
 * Useful for conditionally executing code that requires browser APIs.
 *
 * @returns True if DOM is available, false otherwise
 */
const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

export default canUseDOM
