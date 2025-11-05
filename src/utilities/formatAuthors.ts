/**
 * Formats an array of author objects with name property into a prettified string.
 * @param authors - Array of author objects with a name property.
 * @returns A prettified string of authors.
 * @example
 *
 * [{name: 'Author1'}, {name: 'Author2'}] becomes 'Author1 and Author2'
 * [{name: 'Author1'}, {name: 'Author2'}, {name: 'Author3'}] becomes 'Author1, Author2, and Author3'
 *
 */
export const formatAuthors = (authors: Array<{ name?: string | null }>): string => {
  // Ensure we don't have any authors without a name
  const authorNames = authors.map((author) => author.name).filter(Boolean) as string[]

  if (authorNames.length === 0) return ''
  if (authorNames.length === 1) return authorNames[0]!
  if (authorNames.length === 2) return `${authorNames[0]} and ${authorNames[1]}`

  return `${authorNames.slice(0, -1).join(', ')} and ${authorNames[authorNames.length - 1]!}`
}
