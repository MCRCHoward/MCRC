/**
 * Convert a string to a URL-safe slug.
 *
 * Handles Unicode via NFKD normalization + diacritics strip, keeps only
 * lowercase alphanumerics and hyphens, trims leading/trailing hyphens,
 * and caps length at 80 characters.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}
