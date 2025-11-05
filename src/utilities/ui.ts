/**
 * Utility functions for UI components automatically added by ShadCN and used in a few of our frontend components and blocks.
 *
 * Other functions may be exported from here in the future or by installing other shadcn components.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge and deduplicate Tailwind CSS classes.
 * Combines clsx for conditional class handling with tailwind-merge for intelligent class deduplication.
 *
 * @param inputs - Class values (strings, arrays, objects, or combinations)
 * @returns Merged and deduplicated class string
 * @example
 * cn('px-2 py-1', 'bg-red-500', { 'text-white': isActive })
 * cn('px-2', 'px-4') // 'px-4' (deduplicated)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
