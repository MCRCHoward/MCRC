import Link from 'next/link'
import ButtonAnimated from '@/components/ui/button-animated'
import { HeartHandshake, ShieldQuestion } from 'lucide-react'

const GetInvolved = () => {
  return (
    <section className="py-32">
      <div className="container flex flex-col items-center">
        <div className="text-center">
          <h3 className="text-4xl font-semibold text-pretty md:mb-4 lg:mb-6 lg:max-w-3xl lg:text-5xl">
            Get Involved
          </h3>
        </div>
      </div>
      <div className="container mt-16">
        <div className="relative">
          <div className="grid border md:grid-cols-2 md:divide-x">
            <Link
              href="/services/mediation/request"
              className="group relative flex flex-col items-center border-border pt-8 pb-8 text-center transition-all duration-200 md:border-t md:px-8 md:pt-12 md:pb-12 lg:px-12 lg:pt-16 lg:pb-20"
            >
              <div className="absolute top-0 h-px w-full bg-border md:hidden" />
              <div className="mb-8 flex aspect-1/1 w-16 items-center justify-center md:w-[6.25rem] lg:mb-[3.25rem]">
                <ShieldQuestion className="h-full w-full object-contain object-center text-green-500" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold md:mb-5">Request Mediation</h2>
              <p className="mb-auto text-muted-foreground">
                Start the process to resolve a conflict peacefully. Submit a confidential request
                and our team will connect you with trained volunteer mediators to support meaningful
                dialogue and resolution.
              </p>
              <div className="my-6">
                <ButtonAnimated text="Request Mediation" />
              </div>
            </Link>
            <Link
              href="/volunteer"
              className="group relative flex flex-col items-center border-border pt-8 pb-8 text-center transition-all duration-200 md:border-t md:px-8 md:pt-12 md:pb-12 lg:px-12 lg:pt-16 lg:pb-20"
            >
              <div className="absolute top-0 h-px w-full bg-border md:hidden" />
              <div className="mb-8 flex aspect-1/1 w-16 items-center justify-center md:w-[6.25rem] lg:mb-[3.25rem]">
                <HeartHandshake className="h-full w-full object-contain object-center text-blue-700" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold md:mb-5">Become a Volunteer </h2>
              <p className="mb-auto text-muted-foreground">
                Join our community of trained mediators and help others navigate conflict with
                compassion. No prior experience needed—just a willingness to listen, learn, and
                support peaceful resolution.
              </p>
              <div className="my-6">
                <ButtonAnimated text="Become a Volunteer" />
              </div>
            </Link>
          </div>
          <div className="absolute -top-[5px] -left-[5px]">
            <div className="size-[12px] rounded-full bg-primary"></div>
          </div>
          <div className="absolute -top-[5px] -right-[5px]">
            <div className="size-[12px] rounded-full bg-primary"></div>
          </div>
          <div className="absolute -bottom-[5px] -left-[5px]">
            <div className="size-[12px] rounded-full bg-primary"></div>
          </div>
          <div className="absolute -right-[5px] -bottom-[5px]">
            <div className="size-[12px] rounded-full bg-primary"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export { GetInvolved }
