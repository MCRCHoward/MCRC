/**
 * Converts a string to kebab-case format.
 * @param string - The string to convert
 * @returns The kebab-case version of the string
 * @example
 * toKebabCase('Hello World') // 'hello-world'
 * toKebabCase('camelCaseString') // 'camel-case-string'
 */
export const toKebabCase = (string: string): string => {
  if (!string || typeof string !== 'string') {
    return ''
  }

  return string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase()
}
