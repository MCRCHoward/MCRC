'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'
import { auth, db } from '@/firebase/client'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

// Password strength checker
function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong'
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('At least 8 characters')

  if (/[a-z]/.test(password)) score++
  else feedback.push('Lowercase letter')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Uppercase letter')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Number')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Special character')

  if (password.length >= 12) score++

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (score >= 4) strength = 'strong'
  else if (score >= 2) strength = 'medium'

  return { strength, score, feedback }
}

// Phone number normalization to E.164
function normalizePhone(phone: string): string | null {
  if (!phone) return null
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Remove any existing + and leading 1
  if (cleaned.startsWith('+1')) cleaned = cleaned.slice(2)
  else if (cleaned.startsWith('1') && cleaned.length === 11) cleaned = cleaned.slice(1)

  // Must be 10 digits now
  if (cleaned.length !== 10) return null

  // Return in E.164 format
  return `+1${cleaned}`
}

// Get browser language
// Locale code to friendly name mapping
const localeToFriendly: Record<string, string> = {
  'en-US': 'English',
  en: 'English',
  'es-US': 'Spanish',
  es: 'Spanish',
  'fr-CA': 'French',
  fr: 'French',
  'zh-CN': 'Chinese',
  zh: 'Chinese',
  'ar-SA': 'Arabic',
  ar: 'Arabic',
  'hi-IN': 'Hindi',
  hi: 'Hindi',
  'pt-BR': 'Portuguese',
  pt: 'Portuguese',
}

// Friendly name to language code mapping (for languagesSpoken field)
const friendlyToCode: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  Chinese: 'zh',
  Arabic: 'ar',
  Hindi: 'hi',
  Portuguese: 'pt',
}

function getBrowserLocale(): string {
  if (typeof window === 'undefined') return 'en-US'
  return navigator.language || 'en-US'
}

function getBrowserLocaleFriendly(): string {
  if (typeof window === 'undefined') return 'English'
  const browserLocale = navigator.language || 'en-US'
  const localeCode = browserLocale.split('-')[0]
  return (
    localeToFriendly[browserLocale] ||
    (localeCode ? localeToFriendly[localeCode] : undefined) ||
    'English'
  )
}

// Contact preferences
const contactMethods = ['email', 'sms', 'phone'] as const
const languages = [
  'English',
  'Spanish',
  'French',
  'Chinese',
  'Arabic',
  'Hindi',
  'Portuguese',
] as const

const schema = z
  .object({
    // Step 1: Authentication method
    authMethod: z.enum(['google', 'email']),

    // Step 2: Basic info
    name: z.string().min(1, 'Full name is required').trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine(
        (pwd) => {
          const { strength } = checkPasswordStrength(pwd)
          return strength !== 'weak'
        },
        { message: 'Password is too weak. Please use a stronger password.' },
      ),
    confirmPassword: z.string(),

    // Step 3: Contact info
    phoneNumber: z
      .string()
      .optional()
      .refine((phone) => !phone || normalizePhone(phone) !== null, {
        message: 'Please enter a valid phone number',
      }),
    preferredLocale: z.enum(languages),
    primaryContactMethod: z.enum(contactMethods),
    languagesSpoken: z.array(z.string()).min(1, 'Select at least one language'),

    // Step 4: Consents
    consentsTos: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms of service',
    }),
    consentsPrivacy: z.boolean().refine((v) => v === true, {
      message: 'You must accept the privacy policy',
    }),
    consentsIsAdult: z.boolean(),
    guardianName: z.string().optional(),
    guardianEmail: z.string().email().optional(),
    guardianPhone: z.string().optional(),

    // Step 5: Interests
    interestsIsParticipant: z.boolean(),
    interestsIsVolunteer: z.boolean(),
    interestsIsMediator: z.boolean(),
    interestsIsFacilitator: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (!data.consentsIsAdult) {
        return Boolean(data.guardianName && data.guardianEmail)
      }
      return true
    },
    {
      message: 'Guardian contact information is required if you are under 18',
      path: ['guardianName'],
    },
  )
  .refine(
    (data) => {
      return (
        data.interestsIsParticipant ||
        data.interestsIsVolunteer ||
        data.interestsIsMediator ||
        data.interestsIsFacilitator
      )
    },
    {
      message: 'Please select at least one interest',
      path: ['interestsIsParticipant'],
    },
  )

type FormValues = z.infer<typeof schema>

const STEPS = [
  { title: 'Choose Sign-in Method', fields: ['authMethod'] },
  { title: 'Basic Information', fields: ['name', 'email', 'password', 'confirmPassword'] },
  {
    title: 'Contact Details',
    fields: ['phoneNumber', 'preferredLocale', 'primaryContactMethod', 'languagesSpoken'],
  },
  { title: 'Terms & Consents', fields: ['consentsTos', 'consentsPrivacy', 'consentsIsAdult'] },
  {
    title: 'Your Interests',
    fields: [
      'interestsIsParticipant',
      'interestsIsVolunteer',
      'interestsIsMediator',
      'interestsIsFacilitator',
    ],
  },
]

export function RegisterForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [googleUser, setGoogleUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      authMethod: 'email',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      preferredLocale: getBrowserLocaleFriendly() as (typeof languages)[number],
      primaryContactMethod: 'email',
      languagesSpoken: [getBrowserLocale().split('-')[0] || 'en'],
      consentsTos: false,
      consentsPrivacy: false,
      consentsIsAdult: false,
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      interestsIsParticipant: false,
      interestsIsVolunteer: false,
      interestsIsMediator: false,
      interestsIsFacilitator: false,
    },
    mode: 'onTouched',
  })

  // Auto-populate from Google when available
  useEffect(() => {
    if (googleUser && currentStep >= 1) {
      form.setValue('name', googleUser.displayName || '', { shouldValidate: true })
      form.setValue('email', googleUser.email?.toLowerCase() || '', { shouldValidate: true })
      // Phone from Google is less common, but try
      if (googleUser.phoneNumber) {
        form.setValue('phoneNumber', googleUser.phoneNumber, { shouldValidate: true })
      }
    }
  }, [googleUser, currentStep, form])

  const handleGoogleSignUp = async () => {
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      const user = cred.user
      setGoogleUser(user)
      form.setValue('authMethod', 'google', { shouldValidate: true })

      // Auto-populate and move to next step
      form.setValue('name', user.displayName || '', { shouldValidate: true })
      form.setValue('email', user.email?.toLowerCase() || '', { shouldValidate: true })

      toast.success('Google account connected')
      setCurrentStep(1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-up failed.'
      toast.error(message)
      setError(message)
    }
  }

  const handleEmailSignUp = async () => {
    form.setValue('authMethod', 'email', { shouldValidate: true })
    setCurrentStep(1)
  }

  const goNext = async () => {
    const currentStepData = STEPS[currentStep]
    if (!currentStepData) return

    const stepFields = currentStepData.fields as (keyof FormValues)[]
    const isValid = await form.trigger(stepFields as Array<keyof FormValues>)
    if (isValid) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1)
      }
    }
  }

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setIsSubmitting(true)
    try {
      let user: User

      if (values.authMethod === 'google' && googleUser) {
        user = googleUser
      } else {
        // Create email/password account
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            values.email.toLowerCase().trim(),
            values.password,
          )
          user = cred.user
        } catch (authError: unknown) {
          // Handle Firebase Auth errors
          const error = authError as { code?: string; message?: string }
          if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email address is already registered. Please sign in instead.')
          } else if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. Please choose a stronger password.')
          } else if (error.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address.')
          } else {
            throw new Error(error.message || 'Failed to create account. Please try again.')
          }
        }
      }

      // Normalize phone
      const normalizedPhone = values.phoneNumber ? normalizePhone(values.phoneNumber) : undefined

      // Create user profile in Firestore
      const userRef = doc(db, 'users', user.uid)
      const normalizedEmail = values.email.toLowerCase().trim()
      const userData = {
        name: values.name.trim(),
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        preferredLocale: values.preferredLocale,
        contactPreferences: {
          primary: values.primaryContactMethod,
        },
        languagesSpoken: values.languagesSpoken,
        consents: {
          tos: values.consentsTos,
          privacy: values.consentsPrivacy,
          isAdult: values.consentsIsAdult,
        },
        ...(values.consentsIsAdult === false && {
          guardian: {
            name: values.guardianName,
            email: values.guardianEmail,
            phone: values.guardianPhone ? normalizePhone(values.guardianPhone) : undefined,
          },
        }),
        interests: {
          isParticipant: values.interestsIsParticipant,
          isVolunteer: values.interestsIsVolunteer,
          isMediator: values.interestsIsMediator,
          isFacilitator: values.interestsIsFacilitator,
        },
        role: 'participant', // Default role, staff can change later
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(userRef, userData, { merge: true })

      // Create session
      const idToken = await user.getIdToken()
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      toast.success('Registration successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.'
      toast.error(message)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Only allow submission from the final step
    if (currentStep !== STEPS.length - 1) {
      return
    }

    // Validate all fields before submitting
    const isValid = await form.trigger()
    if (!isValid) {
      // If validation fails, show error and scroll to first error
      const firstError = Object.keys(form.formState.errors)[0]
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"], #${firstError}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      toast.error('Please fix the errors before submitting')
      return
    }

    // Submit the form
    form.handleSubmit(onSubmit)()
  }

  const password = form.watch('password')
  const passwordStrength = password ? checkPasswordStrength(password) : null
  const isAdult = form.watch('consentsIsAdult')

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </p>
          <p className="text-sm font-medium">{STEPS[currentStep]?.title || 'Step'}</p>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* STEP 1: Authentication Method */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:ring-white/5 dark:hover:bg-white/20"
            >
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
              <span className="text-sm/6 font-semibold">Continue with Google</span>
            </button>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm/6 font-medium">
              <span className="bg-white px-6 text-gray-900 dark:bg-gray-900 dark:text-gray-300">
                Or
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleEmailSignUp}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
            >
              Continue with Email
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
            >
              Full Name
            </label>
            <div className="mt-2">
              <input
                id="name"
                type="text"
                required
                {...form.register('name')}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

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
                {...form.register('email')}
                disabled={form.watch('authMethod') === 'google'}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          {form.watch('authMethod') === 'email' && (
            <>
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
                    autoComplete="new-password"
                    {...form.register('password')}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  />
                  {passwordStrength && (
                    <div className="mt-2 space-y-1">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full transition-all ${
                            passwordStrength.strength === 'weak'
                              ? 'w-1/3 bg-red-500'
                              : passwordStrength.strength === 'medium'
                                ? 'w-2/3 bg-yellow-500'
                                : 'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Strength: {passwordStrength.strength}
                      </p>
                    </div>
                  )}
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                >
                  Confirm Password
                </label>
                <div className="mt-2">
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    {...form.register('confirmPassword')}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                  />
                  {form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3: Contact Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
            >
              Phone Number (optional)
            </label>
            <div className="mt-2">
              <input
                id="phoneNumber"
                type="tel"
                placeholder="(123) 456-7890"
                {...form.register('phoneNumber')}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Used for SMS notifications if enabled
              </p>
              {form.formState.errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="preferredLocale"
              className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
            >
              Language Preference
            </label>
            <div className="mt-2">
              <select
                id="preferredLocale"
                {...form.register('preferredLocale')}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="primaryContactMethod"
              className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
            >
              Preferred Contact Method
            </label>
            <div className="mt-2">
              <select
                id="primaryContactMethod"
                {...form.register('primaryContactMethod')}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus:outline-indigo-500"
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="phone">Phone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100 mb-2">
              Languages Spoken
            </label>
            <div className="mt-2 space-y-2">
              {languages.map((lang) => {
                const langCode = friendlyToCode[lang as keyof typeof friendlyToCode] || ''
                const languagesSpoken = form.watch('languagesSpoken') || []
                const checked = languagesSpoken.includes(langCode)
                return (
                  <div key={lang} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={checked}
                      onChange={(e) => {
                        const current = form.getValues('languagesSpoken') || []
                        const updated = e.target.checked
                          ? [...current, langCode]
                          : current.filter((l) => l !== langCode)
                        form.setValue('languagesSpoken', updated, { shouldValidate: true })
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-white/10 dark:bg-white/5"
                    />
                    <label
                      htmlFor={`lang-${lang}`}
                      className="text-sm text-gray-900 dark:text-gray-100"
                    >
                      {lang}
                    </label>
                  </div>
                )
              })}
            </div>
            {form.formState.errors.languagesSpoken && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.languagesSpoken.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Terms & Consents */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    id="consents-tos"
                    type="checkbox"
                    checked={form.watch('consentsTos')}
                    onChange={(e) => form.setValue('consentsTos', e.target.checked)}
                    className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:focus-visible:outline-indigo-500"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-[:checked]:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor="consents-tos" className="text-sm text-gray-900 dark:text-gray-100">
                I accept the{' '}
                <Link
                  href="/terms-of-service"
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </Link>{' '}
                (required)
              </label>
            </div>
            {form.formState.errors.consentsTos && (
              <p className="ml-7 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.consentsTos.message}
              </p>
            )}

            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    id="consents-privacy"
                    type="checkbox"
                    checked={form.watch('consentsPrivacy')}
                    onChange={(e) => form.setValue('consentsPrivacy', e.target.checked)}
                    className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:focus-visible:outline-indigo-500"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-[:checked]:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <label
                htmlFor="consents-privacy"
                className="text-sm text-gray-900 dark:text-gray-100"
              >
                I accept the{' '}
                <Link
                  href="/privacy-policy"
                  className="text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>{' '}
                (required)
              </label>
            </div>
            {form.formState.errors.consentsPrivacy && (
              <p className="ml-7 text-sm text-red-600 dark:text-red-400">
                {form.formState.errors.consentsPrivacy.message}
              </p>
            )}

            <div className="flex gap-3">
              <div className="flex h-6 shrink-0 items-center">
                <div className="group grid size-4 grid-cols-1">
                  <input
                    id="consents-adult"
                    type="checkbox"
                    checked={form.watch('consentsIsAdult')}
                    onChange={(e) => form.setValue('consentsIsAdult', e.target.checked)}
                    className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:focus-visible:outline-indigo-500"
                  />
                  <svg
                    fill="none"
                    viewBox="0 0 14 14"
                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-has-[:checked]:opacity-100"
                    />
                  </svg>
                </div>
              </div>
              <label htmlFor="consents-adult" className="text-sm text-gray-900 dark:text-gray-100">
                I confirm that I am 18 years or older
              </label>
            </div>
          </div>

          {!isAdult && (
            <div className="mt-4 space-y-4 rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Guardian Information Required
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="guardianName"
                    className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                  >
                    Guardian Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="guardianName"
                      type="text"
                      {...form.register('guardianName')}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                    {form.formState.errors.guardianName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {form.formState.errors.guardianName.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="guardianEmail"
                    className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                  >
                    Guardian Email
                  </label>
                  <div className="mt-2">
                    <input
                      id="guardianEmail"
                      type="email"
                      {...form.register('guardianEmail')}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                    {form.formState.errors.guardianEmail && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {form.formState.errors.guardianEmail.message}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="guardianPhone"
                    className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100"
                  >
                    Guardian Phone (optional)
                  </label>
                  <div className="mt-2">
                    <input
                      id="guardianPhone"
                      type="tel"
                      {...form.register('guardianPhone')}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Interests */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select all that apply. This helps us understand how you&apos;d like to engage with MCRC.
          </p>
          <div className="space-y-4">
            {[
              {
                key: 'interestsIsParticipant',
                label: 'I am interested in participating in programs',
              },
              { key: 'interestsIsVolunteer', label: 'I am interested in volunteering' },
              { key: 'interestsIsMediator', label: 'I am interested in mediation services' },
              { key: 'interestsIsFacilitator', label: 'I am interested in facilitation services' },
            ].map(({ key, label }) => {
              const checked = form.watch(key as keyof FormValues) as boolean
              return (
                <div key={key} className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id={key}
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          form.setValue(key as keyof FormValues, e.target.checked as boolean)
                        }
                        className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/5 dark:checked:border-indigo-500 dark:focus-visible:outline-indigo-500"
                      />
                      <svg
                        fill="none"
                        viewBox="0 0 14 14"
                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                      >
                        <path
                          d="M3 8L6 11L11 3.5"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-has-[:checked]:opacity-100"
                        />
                      </svg>
                    </div>
                  </div>
                  <label htmlFor={key} className="text-sm text-gray-900 dark:text-gray-100">
                    {label}
                  </label>
                </div>
              )
            })}
          </div>
          {form.formState.errors.interestsIsParticipant && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {form.formState.errors.interestsIsParticipant.message}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:outline-indigo-500"
          >
            Back
          </button>
        )}
        <div className="flex-1" />
        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || form.formState.isSubmitting}
            className="flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            {isSubmitting || form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        )}
      </div>
    </form>
  )
}
