export const dynamic = 'force-dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <section className="bg-background min-h-screen py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <Image
            src="/images/logo/mcrc-logo.png"
            alt="MCRC Logo"
            title="MCRC"
            width={100}
            height={100}
            priority
            className="h-10 dark:invert"
          />
        </Link>

        <div className="mt-16 w-full max-w-md">
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-8 shadow-sm dark:bg-gray-900 dark:border-gray-700">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <RegisterForm />
          </div>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
