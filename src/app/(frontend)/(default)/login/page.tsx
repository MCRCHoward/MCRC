import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <>
      <div className="flex min-h-screen">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <Image
                alt="Logo"
                src="/images/logo/mcrc-logo.png"
                width={120}
                height={40}
                className="h-10 w-auto dark:hidden"
                priority
              />
              <Image
                alt="Logo"
                src="/images/logo/mcrc-logo.png"
                width={120}
                height={40}
                className="hidden h-10 w-auto dark:block"
                priority
              />
              <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm/6 text-gray-500 dark:text-gray-400">
                Not a member?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-purple hover:text-purple/80 dark:text-purple/80 dark:hover:text-purple/60"
                >
                  Register Today
                </Link>
              </p>
            </div>

            <div className="mt-10">
              <div>
                <LoginForm />
              </div>
            </div>
          </div>
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <Image
            alt=""
            src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </>
  )
}
