'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'
import { auth, db } from '@/firebase/client'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  type User,
  type AuthError,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Please enter your password.' }),
  rememberMe: z.boolean().optional(),
})

/**
 * Maps Firebase Auth error codes to user-friendly error messages
 */
function getFriendlyErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'An unexpected error occurred. Please try again.'
  }

  const authError = error as AuthError
  const code = authError.code

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address. Please check your email or register for a new account.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.'
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later or reset your password.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.'
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.'
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.'
    default:
      // For unknown errors, try to extract a message
      if (authError.message) {
        return authError.message
      }
      return 'An unexpected error occurred. Please try again.'
  }
}

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  const ensureUserProfile = async (user: User) => {
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
      await setDoc(userRef, { role: 'participant', email: user.email ?? null }, { merge: true })
    } else if (!snap.data()?.role) {
      await setDoc(userRef, { role: 'participant' }, { merge: true })
    }
  }

  const createSession = async (user: User) => {
    try {
      const idToken = await user.getIdToken()
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create session')
      }
    } catch (err) {
      console.error('Session creation error:', err)
      throw err
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setError(null)
    setIsSubmitting(true)

    try {
      // Set persistence based on rememberMe checkbox
      const persistence = values.rememberMe ? browserLocalPersistence : browserSessionPersistence

      await setPersistence(auth, persistence)

      const cred = await signInWithEmailAndPassword(auth, values.email, values.password)
      const user = cred.user
      await ensureUserProfile(user)

      // Create server session
      await createSession(user)

      toast.success('Login successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const friendlyMessage = getFriendlyErrorMessage(err)
      toast.error(friendlyMessage)
      setError(friendlyMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onGoogleSignIn = async () => {
    setError(null)
    setIsGoogleSigningIn(true)

    try {
      // Set persistence based on rememberMe checkbox (use current form value)
      const rememberMe = form.watch('rememberMe')
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence

      await setPersistence(auth, persistence)

      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      const user = cred.user
      await ensureUserProfile(user)

      // Create server session
      await createSession(user)

      toast.success('Login successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      // Handle popup closed by user
      if ((err as AuthError).code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error
        return
      }
      const friendlyMessage = getFriendlyErrorMessage(err)
      toast.error(friendlyMessage || 'Google sign-in failed. Please try again.')
      setError(friendlyMessage || 'Google sign-in failed. Please try again.')
    } finally {
      setIsGoogleSigningIn(false)
    }
  }

  const handlePasswordReset = async () => {
    const email = form.getValues('email')
    const emailState = form.getFieldState('email')

    if (!email || emailState.invalid || form.formState.errors.email) {
      toast.error('Please enter a valid email address first')
      form.setFocus('email')
      return
    }

    setIsResettingPassword(true)
    setError(null)

    try {
      await sendPasswordResetEmail(auth, email)
      setResetEmailSent(true)
      toast.success('Password reset email sent! Please check your inbox.')
      setShowPasswordReset(false)
    } catch (err: unknown) {
      const friendlyMessage = getFriendlyErrorMessage(err)
      toast.error(friendlyMessage)
      setError(friendlyMessage)
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            disabled={isSubmitting || isGoogleSigningIn}
            {...form.register('email')}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
        >
          Password
        </label>
        <div className="mt-2">
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={isSubmitting || isGoogleSigningIn}
            {...form.register('password')}
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          />
          {form.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20" role="alert">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {resetEmailSent && (
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20" role="alert">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Password reset email sent! Please check your inbox and follow the instructions to reset
            your password.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="flex h-6 shrink-0 items-center">
            <div className="group grid size-4 grid-cols-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={form.watch('rememberMe')}
                onChange={(e) => form.setValue('rememberMe', e.target.checked)}
                disabled={isSubmitting || isGoogleSigningIn}
                className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:checked:bg-indigo-500 dark:indeterminate:border-indigo-500 dark:indeterminate:bg-indigo-500 dark:focus-visible:outline-indigo-500 forced-colors:appearance-auto"
              />
              <svg
                fill="none"
                viewBox="0 0 14 14"
                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
              >
                <path
                  d="M3 8L6 11L11 3.5"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 group-has-[:checked]:opacity-100"
                />
                <path
                  d="M3 7H11"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-0 group-has-[:indeterminate]:opacity-100"
                />
              </svg>
            </div>
          </div>
          <label htmlFor="remember-me" className="block text-sm/6 text-gray-900 dark:text-gray-300">
            Remember me
          </label>
        </div>

        <div className="text-sm/6">
          {!showPasswordReset ? (
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 rounded"
            >
              Forgot password?
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isResettingPassword || !form.getValues('email')}
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 rounded flex items-center gap-1"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send reset email
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordReset(false)
                  setResetEmailSent(false)
                }}
                className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting || isGoogleSigningIn}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </div>

      <div className="mt-10">
        <div className="relative">
          <div aria-hidden="true" className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm/6 font-medium">
            <span className="bg-white px-6 text-gray-900 dark:bg-gray-900 dark:text-gray-300">
              Or continue with
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={isSubmitting || isGoogleSigningIn}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/5 dark:hover:bg-white/20"
          >
            {isGoogleSigningIn && <Loader2 className="h-5 w-5 animate-spin" />}
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
              />
              <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
              />
              <path
                d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                fill="#FBBC05"
              />
              <path
                d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                fill="#34A853"
              />
            </svg>
            <span className="text-sm/6 font-semibold">Google</span>
          </button>
        </div>
      </div>
    </form>
  )
}
