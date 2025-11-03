'use client'

import Link from 'next/link'
import { cn } from '@/utilities/ui'

import TwoColorTitle from '@/components/ui/two-color-title'
import { RestorativeProgramReferralForm } from '@/Forms/formDisplay/restorativeProgramReferralForm'

const RestorativeJusticeRequest = () => {
  const programData = [
    {
      title: 'Restorative Reflection',
      description:
        'An individual process that helps a person reflect on what happened, take responsibility, and make positive changes in their life.',
    },

    {
      title: 'Restorative Reflection with an Apology Letter',
      description:
        'An individual process that may include writing an apology letter to acknowledge harm and repair relationships.',
    },
    {
      title: 'Restorative Dialogues',
      description:
        'A guided conversation between people affected by harm. The goal is to help everyone understand each other, take responsibility, and repair relationships.',
    },

    {
      title: 'Restorative Circles',
      description:
        'A group process that supports connection, relationship-building, and healing together after harm.',
    },

    {
      title: 'Family Circles (for Returning Citizens)',
      description:
        'Our circles support individuals and their families as they reconnect after detention or incarceration.These circles provide a safe space where families can talk, heal, and rebuild trust and understanding together.',
    },
  ] as const
  return (
    <section className="bg-muted/50 py-32">
      <div className="container">
        <span className="text-muted-foreground text-xs">GET STARTED /</span>
        <div className="mt-8 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-2 lg:grid-rows-[min-content_1fr]">
          <TwoColorTitle title="Seeking Restorative Program? " titleGray="Start Here" />
          <div className="order-2 md:order-none md:row-span-2">
            <div className="bg-background border-border rounded-lg border p-6">
              <RestorativeProgramReferralForm />
            </div>
          </div>
          <div className="order-3 my-6 md:order-none">
            <p className="mb-8">
              This form helps us understand the kind of restorative support being requested. Please
              share whatever information you can.
            </p>
            <p className="mb-8 font-bold md:mb-16">
              Please note at this time we can only accept requests from MCRC partners
            </p>
            <div className="mt-6 border-t border-gray-100 dark:border-white/10">
              <dl className="divide-y divide-gray-100 dark:divide-white/10">
                {programData.map((program, _index) => (
                  <div
                    className={cn('px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0')}
                    key={program.title}
                  >
                    <dt className="text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                      {program.title}
                    </dt>
                    <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0 dark:text-gray-400">
                      {program.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="my-6 font-bold">Serving Howard County for 26 years!</p>
          </div>
        </div>
        <div className="mt-16 grid gap-8 md:gap-12 lg:w-1/2 lg:grid-cols-2">
          <div>
            <h3 className="mb-1.5 font-bold">FAQ</h3>
            <p className="text-muted-foreground text-sm">
              Browse our collection of{' '}
              <Link
                href="/services/mediation#faq"
                className="text-primary underline hover:underline"
              >
                Frequently Asked Questions
              </Link>{' '}
              about our process and project delivery.
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 font-bold">Resources</h3>
            <p className="text-muted-foreground text-sm">
              <Link href="/resources" className="text-primary underline hover:underline">
                Access our library of helpful guides and resources.
              </Link>{' '}
              It is filled with blogs, guides, and tips to help improve communication and conflict
              resolution.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RestorativeJusticeRequest
