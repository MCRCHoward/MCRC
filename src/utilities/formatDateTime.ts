/**
 * Formats a timestamp string into MM/DD/YYYY format.
 * @param timestamp - ISO date string or date string
 * @returns Formatted date string in MM/DD/YYYY format
 */
export const formatDateTime = (timestamp: string): string => {
  if (!timestamp) {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const year = now.getFullYear()
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`
  }

  const date = new Date(timestamp)

  // Validate date
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()

  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`
}
