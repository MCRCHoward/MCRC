'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// =============================================================================
// Types
// =============================================================================

interface UseUnsavedChangesWarningOptions {
  /** Whether the form has unsaved changes */
  isDirty: boolean
  /** Whether the warning is enabled (e.g., only in edit mode) */
  enabled?: boolean
  /** Message shown in the browser's native dialog (beforeunload) */
  message?: string
}

interface UseUnsavedChangesWarningReturn {
  /** Whether the confirmation dialog should be shown */
  showDialog: boolean
  /** Call this when user confirms they want to leave */
  confirmNavigation: () => void
  /** Call this when user cancels and wants to stay */
  cancelNavigation: () => void
  /** Manually trigger navigation with dirty check */
  navigateWithCheck: (url: string) => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook to warn users about unsaved changes before navigation.
 *
 * Handles:
 * - Browser close/refresh (beforeunload)
 * - Browser back/forward buttons (popstate)
 * - Programmatic navigation via `navigateWithCheck`
 *
 * @example
 * ```tsx
 * const { showDialog, confirmNavigation, cancelNavigation, navigateWithCheck } =
 *   useUnsavedChangesWarning({ isDirty, enabled: isEditMode })
 *
 * // Use navigateWithCheck for Cancel button
 * <Button onClick={() => navigateWithCheck('/history')}>Cancel</Button>
 *
 * // Render AlertDialog based on showDialog
 * <AlertDialog open={showDialog} onOpenChange={(open) => !open && cancelNavigation()}>
 *   ...
 * </AlertDialog>
 * ```
 */
export function useUnsavedChangesWarning({
  isDirty,
  enabled = true,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesWarningOptions): UseUnsavedChangesWarningReturn {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const pendingNavigation = useRef<string | null>(null)
  const isNavigatingRef = useRef(false)

  // Track if we should block navigation
  const shouldBlock = enabled && isDirty && !isNavigatingRef.current

  // ===========================================================================
  // beforeunload: Browser close/refresh/external navigation
  // ===========================================================================
  useEffect(() => {
    if (!shouldBlock) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlock, message])

  // ===========================================================================
  // popstate: Browser back/forward buttons
  // ===========================================================================
  useEffect(() => {
    if (!shouldBlock) return

    // Push a dummy history entry to detect back navigation
    const currentUrl = window.location.href
    window.history.pushState({ __unsavedChangesGuard: true }, '', currentUrl)

    const handlePopState = () => {
      if (shouldBlock) {
        // User pressed back; push state again to stay on page
        window.history.pushState({ __unsavedChangesGuard: true }, '', currentUrl)
        // Show our dialog
        pendingNavigation.current = 'back'
        setShowDialog(true)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Clean up: only remove guard state if not intentionally navigating (P3)
      if (
        window.history.state?.__unsavedChangesGuard &&
        !isNavigatingRef.current
      ) {
        window.history.back()
      }
    }
  }, [shouldBlock])

  // ===========================================================================
  // Navigation Handlers
  // ===========================================================================

  /**
   * Trigger navigation with dirty check.
   * Shows dialog if dirty, otherwise navigates immediately.
   */
  const navigateWithCheck = useCallback(
    (url: string) => {
      if (shouldBlock) {
        pendingNavigation.current = url
        setShowDialog(true)
      } else {
        router.push(url)
      }
    },
    [shouldBlock, router],
  )

  /**
   * User confirmed they want to leave. Execute pending navigation.
   */
  const confirmNavigation = useCallback(() => {
    isNavigatingRef.current = true
    setShowDialog(false)

    const destination = pendingNavigation.current

    if (destination === 'back') {
      // P2: Fallback if history is too short (e.g. direct deep link)
      if (window.history.length > 2) {
        window.history.go(-2)
      } else {
        router.push('/dashboard/mediation/data-entry/history')
      }
    } else if (destination) {
      router.push(destination)
    }

    pendingNavigation.current = null
  }, [router])

  /**
   * User cancelled. Stay on page.
   */
  const cancelNavigation = useCallback(() => {
    setShowDialog(false)
    pendingNavigation.current = null
  }, [])

  return {
    showDialog,
    confirmNavigation,
    cancelNavigation,
    navigateWithCheck,
  }
}
