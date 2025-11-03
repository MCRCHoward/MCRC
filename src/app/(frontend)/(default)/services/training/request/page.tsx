'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'

import TwoColorTitle from '@/components/ui/two-color-title'
import { CommunityEducationTrainingRequestForm } from '@/Forms/formDisplay/communityEducationTrainingRequestForm'

const TrainingRequest = () => {
  return (
    <section className="bg-muted/50 py-32">
      <div className="container">
        <span className="text-muted-foreground text-xs">GET STARTED /</span>
        <div className="mt-8 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-2 lg:grid-rows-[min-content_1fr]">
          <TwoColorTitle title="Community Education Training " titleGray="Request Form" />
          <div className="order-2 md:order-none md:row-span-2">
            <div className="bg-background border-border rounded-lg border p-6">
              <CommunityEducationTrainingRequestForm />
            </div>
          </div>
          <div className="order-3 my-6 md:order-none">
            <p className="mb-16 md:mb-8">
              Thank you for your interest in a training or custom workshop with MCRC. Please fill
              out the information below, and a member of our team will be in touch to learn more
              about your goals and how we can support you.
            </p>

            <ul className="space-y-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="bg-background flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-4" />
                </span>
                Everything you share here will be held in confidence.
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-background flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-4" />
                </span>
                Empowering your community through education and training
              </li>
              <li className="flex items-center gap-2">
                <span className="bg-background flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-4" />
                </span>
                We will respond within 72 hours
              </li>
            </ul>
            <p className="my-6 font-bold">Serving Howard County for 26 years!</p>
          </div>
        </div>
        <div className="mt-16 grid gap-8 md:gap-12 lg:w-1/2 lg:grid-cols-2">
          <div>
            <h3 className="mb-1.5 font-bold">FAQ</h3>
            <p className="text-muted-foreground text-sm">
              Click here to{' '}
              <Link
                href="/services/training#offerings"
                className="text-primary underline hover:underline"
              >
                read more about our training services
              </Link>{' '}
              and organizations we work with.
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

export default TrainingRequest
