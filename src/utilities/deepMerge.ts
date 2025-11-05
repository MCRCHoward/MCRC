/**
 * Type guard to check if a value is a plain object (not array, null, etc.)
 * @param item - The value to check
 * @returns True if the item is a plain object
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null && !Array.isArray(item)
}

/**
 * Deep merge two objects recursively.
 * Merges source into target, with source properties taking precedence.
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new object with merged properties
 * @example
 * deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 }, e: 4 })
 * // Returns: { a: 1, b: { c: 2, d: 3 }, e: 4 }
 */
export default function deepMerge<
  T extends Record<string, unknown>,
  R extends Record<string, unknown>,
>(target: T, source: R): T & R {
  const output = { ...target } as T & R

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key]
      const targetValue = target[key]

      if (isObject(sourceValue)) {
        if (!(key in target) || !isObject(targetValue)) {
          Object.assign(output, { [key]: sourceValue })
        } else {
          Object.assign(output, { [key]: deepMerge(targetValue, sourceValue) })
        }
      } else {
        Object.assign(output, { [key]: sourceValue })
      }
    })
  }

  return output
}
