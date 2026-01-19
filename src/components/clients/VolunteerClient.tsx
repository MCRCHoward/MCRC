'use client'

import { Heart, HeartHandshakeIcon, MessageCircleMoreIcon } from 'lucide-react'
import { PageHero } from '@/heros/PageHero'

import { FAQ } from '@/components/sections/FAQ'

import { ScrollInViewTitleAndDescription } from '@/components/sections/ScrollInViewTitleAndDescription'
import PromoCard from '@/components/cards/PromoCard'
import { IconIllustration } from '@/components/illustrations/IconIllustration'
import Link from 'next/link'

const VolunteerClient = () => {
  return (
    <>
      <PageHero
        badge="Thank You for Reaching Out"
        heading="Volunteer With Us"
        description="We are so glad you found us and even more grateful that you're interested in supporting our work. At MCRC, we believe in the power of community-led peacebuilding. Volunteers are essential to everything we do, and we deeply appreciate your willingness to offer your time, energy, and care."
        color="darkyellow"
      />

      <section>
        <div className="container max-w-7xl">
          <ScrollInViewTitleAndDescription title={title} />

          <div className="my-16">
            <Link href="https://form.typeform.com/to/XUGHC78s" target="_blank">  
            <PromoCard
              title="General Interest Form"
              duration="6 months"
              cost="Free Training"
              ctaText="Apply Now"
              onCtaClick={() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }}
              illustration={
                <IconIllustration 
                  icon={Heart} 
                  size="md"
                  color="text-rose-500"
                  backgroundColor="bg-rose-900/10"
                  ariaLabel="General interest form"
                />
              }
              jobTitle="In this role, you will facilitate dialogue between parties, helping them to hear one another and work towards mutually agreeable solutions. You may also have the opportunity to support the center through outreach and educational presentations."
              skillset={[
                'Active Listening',
                'Conflict De-escalation',
                'Facilitation',
                'Cultural Competency',
                'Restorative Justice',
                'Community Building',
              ]}
            />
            </Link>
            <div className="my-12">
            <Link href="https://form.typeform.com/to/bkgaNvOM" target="_blank">  
            <PromoCard
              title="Mediator Volunteer Program"
              duration="6 months"
              cost="Free Training"
              ctaText="Apply Now"
              onCtaClick={() => {
                // Scroll to form or navigate
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }}
              illustration={
                <IconIllustration 
                  icon={HeartHandshakeIcon} 
                  size="md"
                  color="text-teal-500"
                  ariaLabel="Mediator volunteer Program"
                  backgroundColor="bg-teal-900/10"
                />
              }
              jobTitle="In this role, you will facilitate dialogue between parties, helping them to hear one another and work towards mutually agreeable solutions. You may also have the opportunity to support the center through outreach and educational presentations."
              skillset={[
                'Active Listening',
                'Conflict De-escalation',
                'Facilitation',
                'Cultural Competency',
                'Restorative Justice',
                'Community Building',
                ]}
              />
            </Link>
            </div>
            <div className="my-12">
            <Link href="https://form.typeform.com/to/jtax1ryc" target="_blank">  
            <PromoCard
              title="Restorative Facilitator"
              duration="6 months"
              cost="Free Training"
              ctaText="Apply Now"
              onCtaClick={() => {
                // Scroll to form or navigate
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
              }}
              illustration={
                <IconIllustration 
                  icon={MessageCircleMoreIcon} 
                  size="md"
                  color="text-purple"
                  backgroundColor="bg-purple-950/10"
                  ariaLabel="Restorative facilitator handshake"
                />
              }
              jobTitle="In this role, you will facilitate dialogue between parties, helping them to hear one another and work towards mutually agreeable solutions. You may also have the opportunity to support the center through outreach and educational presentations."
              skillset={[
                'Active Listening',
                'Conflict De-escalation',
                'Facilitation',
                'Cultural Competency',
                'Restorative Justice',
                'Community Building',
              ]}
            />
            </Link>
            </div>
          </div>
        </div>
      </section>
      <FAQ
        heading="MCRC Commitment to the The Nine Hallmarks of Community Mediation"
        items={faqItems}
      />
    </>
  )
}

export default VolunteerClient

const title =
  'Because we are a small but mighty team, we welcome new volunteers in Semi-Annual cohorts. This approach allows us to build strong relationships, provide thoughtful orientation, and steward our resources responsibly.'

const faqItems = [
  {
    id: 'faq-1',
    question: 'Community-Based',
    answer:
      'A private non-profit or public agency or program thereof, with mediators, staff and governing/advisory board representative of the diversity of the community served.',
  },
  {
    id: 'faq-2',
    question: 'Open',
    answer:
      'The use of trained community volunteers as providers of mediation services; the practice of mediation is open to all persons.',
  },
  {
    id: 'faq-3',
    question: 'Accessible',
    answer:
      'Providing direct access to the public through self­-referral and striving to reduce barriers to service including physical, linguistic, cultural, programmatic and economic.',
  },
  {
    id: 'faq-4',
    question: 'Low-Cost',
    answer: 'Providing service to clients regardless of their ability to pay.',
  },
  {
    id: 'faq-5',
    question: 'Inclusive',
    answer:
      'Providing service and hiring without discrimination on the basis of race, color, religion, gender, age, disabilities, national origin, marital status, personal appearance, gender identity, sexual orientation, family responsibilities, matriculation, political affiliation, source of income.',
  },
  {
    id: 'faq-6',
    question: 'Timely',
    answer: 'Providing a forum for dispute resolution at the earliest stage of conflict.',
  },
  {
    id: 'faq-7',
    question: 'Innovative ',
    answer: 'Providing an alternative to the judicial system at any stage of a conflict.',
  },
  {
    id: 'faq-8',
    question: 'Outcome-Oriented',
    answer:
      'Initiating, facilitating and educating for collaborative community relationships to effect positive systemic change.',
  },
  {
    id: 'faq-9',
    question: 'Newsworthy',
    answer:
      'Engaging in public awareness and educational activities about the values and practices of mediation.',
  },
]
