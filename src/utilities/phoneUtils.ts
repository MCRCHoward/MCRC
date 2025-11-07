/**
 * Phone number formatting and validation utilities
 */

/**
 * Removes all non-numeric characters from a phone number string
 */
export function stripPhoneNumber(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formats a phone number as (XXX) XXX-XXXX
 * Handles partial input gracefully
 */
export function formatPhoneNumber(value: string): string {
  const numbers = stripPhoneNumber(value)

  if (numbers.length === 0) return ''

  if (numbers.length <= 3) {
    return `(${numbers}`
  }

  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  }

  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}

/**
 * Validates if a phone number string contains only valid characters
 * Allows digits, spaces, parentheses, hyphens, and plus sign
 */
export function isValidPhoneFormat(value: string): boolean {
  // Allow empty string (for optional fields)
  if (value.trim() === '') return true

  // Check if contains only valid phone characters
  const phoneRegex = /^[\d\s()\-+]+$/
  if (!phoneRegex.test(value)) return false

  // Check if has at least 10 digits (US phone number minimum)
  const digitCount = stripPhoneNumber(value).length
  return digitCount >= 10 && digitCount <= 15
}

/**
 * Handles phone number input change event
 * Formats the value as user types and restricts to numbers only
 */
export function handlePhoneInputChange(value: string, onChange: (value: string) => void): void {
  // Remove all non-numeric characters
  const numbers = stripPhoneNumber(value)

  // Limit to 10 digits for US phone numbers (can be extended for international)
  const limitedNumbers = numbers.slice(0, 10)

  // Format the phone number
  const formatted = formatPhoneNumber(limitedNumbers)

  // Update the field value
  onChange(formatted)
}

/**
 * Handles phone number key press to prevent non-numeric input
 * Allows backspace, delete, tab, escape, enter, and arrow keys
 */
export function handlePhoneKeyPress(event: React.KeyboardEvent<HTMLInputElement>): boolean {
  const key = event.key

  // Allow control keys
  if (
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'Tab' ||
    key === 'Escape' ||
    key === 'Enter' ||
    key.startsWith('Arrow') ||
    (event.ctrlKey && (key === 'a' || key === 'c' || key === 'v' || key === 'x'))
  ) {
    return true
  }

  // Allow only numeric characters
  if (!/^\d$/.test(key)) {
    event.preventDefault()
    return false
  }

  return true
}
