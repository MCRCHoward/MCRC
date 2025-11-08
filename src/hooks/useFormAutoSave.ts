'use client'

import { useEffect, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'

/**
 * Custom hook for auto-saving form data to localStorage
 *
 * Automatically saves form data as user types and restores it on mount.
 * Clears saved data on successful submission.
 *
 * @param form - React Hook Form instance
 * @param formKey - Unique key for this form (used as localStorage key)
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useFormAutoSave<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  formKey: string,
  enabled = true,
) {
  const storageKey = `form-autosave-${formKey}`
  const isRestoringRef = useRef(false)
  const hasRestoredRef = useRef(false)

  // Restore form data on mount
  useEffect(() => {
    if (!enabled || hasRestoredRef.current) return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        isRestoringRef.current = true
        form.reset(parsed as T)
        hasRestoredRef.current = true
        // Reset flag after a short delay to allow form to update
        setTimeout(() => {
          isRestoringRef.current = false
        }, 100)
      }
    } catch (error) {
      console.warn(`[useFormAutoSave] Failed to restore form data for ${formKey}:`, error)
      // Clear corrupted data
      localStorage.removeItem(storageKey)
    }
  }, [form, formKey, storageKey, enabled])

  // Save form data on change
  useEffect(() => {
    if (!enabled || isRestoringRef.current) return

    const subscription = form.watch((data) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data))
      } catch (error) {
        console.warn(`[useFormAutoSave] Failed to save form data for ${formKey}:`, error)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, formKey, storageKey, enabled])

  // Clear saved data on successful submission
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey)
      hasRestoredRef.current = false
    } catch (error) {
      console.warn(`[useFormAutoSave] Failed to clear saved data for ${formKey}:`, error)
    }
  }

  // Check if there's saved data
  const hasSavedData = () => {
    try {
      return localStorage.getItem(storageKey) !== null
    } catch {
      return false
    }
  }

  return { clearSavedData, hasSavedData }
}
