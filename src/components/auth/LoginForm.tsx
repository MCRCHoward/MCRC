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
  const [isNavigating, setIsNavigating] = useState(false)

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
      setIsNavigating(true)
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
    const startTime = performance.now()
    console.log('[LOGIN] Google sign-in started')

    setError(null)
    setIsGoogleSigningIn(true)

    try {
      // Persistence
      const persistenceStart = performance.now()
      const rememberMe = form.watch('rememberMe')
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
      await setPersistence(auth, persistence)
      console.log(`[LOGIN] Persistence set: ${(performance.now() - persistenceStart).toFixed(2)}ms`)

      // Google popup
      const popupStart = performance.now()
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      console.log(
        `[LOGIN] Google popup completed: ${(performance.now() - popupStart).toFixed(2)}ms`,
      )

      // User profile
      const user = cred.user
      const profileStart = performance.now()
      await ensureUserProfile(user)
      console.log(
        `[LOGIN] User profile ensured: ${(performance.now() - profileStart).toFixed(2)}ms`,
      )

      // Session creation
      const sessionStart = performance.now()
      await createSession(user)
      console.log(`[LOGIN] Session created: ${(performance.now() - sessionStart).toFixed(2)}ms`)

      const totalTime = performance.now() - startTime
      console.log(`[LOGIN] Total sign-in time: ${totalTime.toFixed(2)}ms`)

      toast.success('Login successful!')
      setIsNavigating(true)

      const navStart = performance.now()
      router.push('/dashboard')
      router.refresh()
      console.log(`[LOGIN] Navigation triggered: ${(performance.now() - navStart).toFixed(2)}ms`)
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
    <>
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm/6 font-medium text-foreground">
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
              className="block w-full rounded-md bg-background px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-ring sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:outline-border dark:placeholder:text-muted-foreground dark:focus:outline-ring"
              aria-invalid={form.formState.errors.email ? 'true' : 'false'}
              aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            />
            {form.formState.errors.email && (
              <p id="email-error" className="mt-1 text-sm text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm/6 font-medium text-foreground">
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
              className="block w-full rounded-md bg-background px-3 py-1.5 text-base text-foreground outline outline-1 -outline-offset-1 outline-border placeholder:text-muted-foreground focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-ring sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:outline-border dark:placeholder:text-muted-foreground dark:focus:outline-ring"
              aria-invalid={form.formState.errors.password ? 'true' : 'false'}
              aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
            />
            {form.formState.errors.password && (
              <p id="password-error" className="mt-1 text-sm text-destructive" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div
            className="rounded-md bg-destructive/10 p-3 dark:bg-destructive/20"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-destructive-foreground">{error}</p>
          </div>
        )}

        {resetEmailSent && (
          <div
            className="rounded-md bg-success/10 p-3 dark:bg-success/20"
            role="alert"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-success-foreground">
              Password reset email sent! Please check your inbox and follow the instructions to
              reset your password.
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
                  className="col-start-1 row-start-1 appearance-none rounded border border-input bg-background checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:border-input disabled:bg-muted disabled:checked:bg-muted dark:border-border dark:bg-card dark:checked:border-primary dark:checked:bg-primary dark:indeterminate:border-primary dark:indeterminate:bg-primary dark:focus-visible:outline-ring forced-colors:appearance-auto"
                  aria-label="Remember me on this device"
                />
                <svg
                  fill="none"
                  viewBox="0 0 14 14"
                  className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-primary-foreground group-has-[:disabled]:stroke-muted-foreground"
                  aria-hidden="true"
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
            <label htmlFor="remember-me" className="block text-sm/6 text-foreground">
              Remember me
            </label>
          </div>

          <div className="text-sm/6">
            {!showPasswordReset ? (
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="font-semibold text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                Forgot password?
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword || !form.getValues('email')}
                  className="font-semibold text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary/60 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded flex items-center gap-1"
                  aria-label={
                    isResettingPassword
                      ? 'Sending password reset email'
                      : 'Send password reset email'
                  }
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" aria-hidden="true" />
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
                  className="text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Cancel password reset"
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
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm/6 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-none dark:hover:bg-primary/80 dark:focus-visible:outline-ring"
            aria-label={isSubmitting ? 'Signing in, please wait' : 'Sign in to your account'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm/6 font-medium">
              <span className="bg-background px-6 text-foreground dark:bg-card">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={isSubmitting || isGoogleSigningIn}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-accent focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed dark:bg-card dark:shadow-none dark:ring-border dark:hover:bg-accent"
              aria-label={
                isGoogleSigningIn ? 'Signing in with Google, please wait' : 'Sign in with Google'
              }
            >
              {isGoogleSigningIn && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
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
    </>
  )
}
