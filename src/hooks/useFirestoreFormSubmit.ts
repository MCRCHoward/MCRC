'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase/client'
import { signInAnonymously } from 'firebase/auth'

/**
 * Custom React hook for submitting form data to Firestore
 *
 * This hook provides a clean interface for form submissions with built-in
 * state management for loading, error, and success states. It automatically
 * signs users in anonymously if they aren't already authenticated, ensuring
 * that request.auth is never null (satisfying Firestore security rules).
 * Automatically adds metadata to submitted documents.
 *
 * @param collectionPath - The Firestore collection path to submit data to
 * @returns Object containing submission state and submit function
 */

// Define the shape of the data being submitted.
// Using Record<string, unknown> for flexibility with form data.

// Define the possible states of form submission
type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

// Define the return type of the hook for better autocompletion
interface UseFirestoreFormSubmitReturn {
  isSubmitting: boolean // True when form is being submitted
  error: string | null // Error message if submission fails
  success: boolean // True when submission succeeds
  submitData: (data: Record<string, unknown>) => Promise<void> // Function to submit data
}

export function useFirestoreFormSubmit(collectionPath: string): UseFirestoreFormSubmitReturn {
  // State management for form submission status
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Derived state for easier consumption in components
  const isSubmitting = status === 'submitting'
  const success = status === 'success'

  /**
   * Ensures user is authenticated (either existing user or anonymous)
   * This satisfies Firestore security rules that require request.auth != null
   */
  const ensureAuth = async () => {
    // If nobody is signed in yet, sign in anonymously
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }
  }

  /**
   * Async function to submit form data to Firestore
   *
   * This function handles the complete submission flow:
   * 1. Sets loading state and clears previous errors
   * 2. Validates Firestore setup
   * 3. Ensures user is authenticated (anonymous if needed)
   * 4. Submits data to the specified collection
   * 5. Adds metadata including submission type and user tracking
   * 6. Updates state based on success/failure
   *
   * @param data - The form data to submit (flexible object structure)
   */
  const submitData = async (data: Record<string, unknown>) => {
    // Set loading state and clear any previous errors
    setStatus('submitting')
    setError(null)

    try {
      // Validate Firestore and auth initialization
      if (!db || !auth) {
        throw new Error('Firestore is not initialized.')
      }

      // Ensure user is authenticated (either existing user or anonymous)
      // This satisfies Firestore security rules that require request.auth != null
      await ensureAuth()

      // Get a reference to the specified Firestore collection
      const colRef = collection(db, collectionPath)

      // Add a new document with the form data and metadata
      await addDoc(colRef, {
        ...data, // Spread all form data
        // Convert Date object to ISO string for Firestore compatibility (if deadline exists)
        ...(data.deadline instanceof Date && { deadline: data.deadline.toISOString() }),
        // Add server timestamp for when the document was created
        submittedAt: serverTimestamp(),
        // Track which user submitted the form
        submittedBy: auth.currentUser?.uid ?? 'anonymous',
        // Track submission method
        submissionType: auth.currentUser ? 'authenticated' : 'anonymous',
      })

      // Mark submission as successful
      setStatus('success')
    } catch (error) {
      // Handle any errors during submission
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error adding document: ', error)
      setError(errorMessage)
      setStatus('error')
    }
  }

  // Return the hook's interface for use in components
  return { isSubmitting, error, success, submitData }
}
