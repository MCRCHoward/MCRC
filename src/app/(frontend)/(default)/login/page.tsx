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
                alt="MCRC Logo"
                src="/images/logo/mcrc-logo.png"
                width={150}
                height={57}
                className="h-14 w-auto dark:hidden"
                priority
              />
              <Image
                alt="MCRC Logo"
                src="/images/logo/mcrc-logo.png"
                width={150}
                height={57}
                className="hidden h-14 w-auto dark:block"
                priority
                aria-hidden="true"
              />
              <h2 className="mt-8 text-2xl/9 font-bold tracking-tight text-foreground">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm/6 text-muted-foreground">
                Not a member?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:text-primary/80 dark:text-primary/80 dark:hover:text-primary/60"
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
            alt="Community meeting"
            src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
        </div>
      </div>
    </>
  )
}
