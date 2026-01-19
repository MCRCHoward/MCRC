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
        badge="Join Our Volunteer Community"
        heading="We are so glad you found us."
        description="At MCRC, we believe in the power of community-led conflict resolution and restorative practice. Volunteers are at the heart of everything we do, helping to strengthen relationships, build shared capacity, and support community-defined solutions. We deeply appreciate your willingness to contribute your time, skills, and care."
        color="darkyellow"
      />

      <section>
        <div className="container max-w-7xl">
          <ScrollInViewTitleAndDescription title='Because we are a small but mighty team, we welcome new volunteers in cohorts. This approach allows us to build strong relationships, provide thoughtful orientation, and steward our resources responsibly, ensuring every volunteer feels supported and prepared to contribute meaningfully.' />

          <div className="my-16">
            <Link href="https://form.typeform.com/to/XUGHC78s" target="_blank">
              <PromoCard
                title="General Interest Form"
                duration="Strengthening MCRC&apos;s capacity to engage communities, share resources, and maintain smooth operations."
                ctaText="Apply Here"
                illustration={
                  <IconIllustration
                    icon={Heart}
                    size="md"
                    color="text-rose-500"
                    backgroundColor="bg-rose-900/10"
                    ariaLabel="General interest form"
                  />
                }
                jobTitle="Assist with outreach, communications, administrative tasks, or event support."
                skillset={[
                  'Flexible',
                  'Opportunities to grow into other volunteer pathways',
                ]}
              />
            </Link>
            <div className="my-12">
              <Link href="https://form.typeform.com/to/bkgaNvOM" target="_blank">
                <PromoCard
                  title="Mediator Volunteer Program"
                  duration="Supporting self-determination and equitable agreements through impartial, structured processes."
                  ctaText="Apply Here"
                  illustration={
                    <IconIllustration
                      icon={HeartHandshakeIcon}
                      size="md"
                      color="text-teal-500"
                      ariaLabel="Mediator volunteer Program"
                      backgroundColor="bg-teal-900/10"
                    />
                  }
                  jobTitle="Facilitate community mediations, helping individuals and groups collaboratively resolve conflict."
                  skillset={[
                    'Completion of a minimum of 40 hours of training that satisfies Rule 17 standards',
                    'Ongoing learning', 'mentorship', 'Peer support are provided to strengthen skills and confidence.',
                  ]}
                />
              </Link>
            </div>
            <div className="my-12">
              <Link href="https://form.typeform.com/to/jtax1ryc" target="_blank">
                <PromoCard
                  title="Restorative Facilitator"
                  duration="Center participant voice, choice, and community-defined solutions in restorative processes."
                  ctaText="Apply Here"

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
                    'Completion of approximately 20 hours of training in restorative facilitation', 'Volunteers receive continued support through mentorship and peer learning'
                  ]}
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <FAQ
        heading='Volunteers at MCRC are valued collaborators. Your contribution helps: '
        subheadingBullets={[
          'Build equitable access to conflict resolution and restorative practices',
          'Strengthen community networks and collective capacity',
          'Foster mutual support and shared learning among staff, volunteers, and partners',
        ]}
        items={faqItems}
      />
    </>
  )
}

export default VolunteerClient


const faqItems = [
  {
    id: 'faq-1',
    question: ' I work during the week, can I still volunteer?',
    answer:
      'Yes! We offer flexible volunteer roles, and many opportunities can be scheduled outside of traditional work hours.',
  },
  {
    id: 'faq-2',
    question: 'I have a criminal record, can I volunteer?',
    answer:
      'We welcome volunteers with diverse life experiences. All applications are considered individually, with a focus on safety, suitability for the role, and alignment with our mission of community-led conflict resolution. Having a record does not automatically disqualify you.',
  },
  {
    id: 'faq-3',
    question: 'Do I need prior experience to volunteer?',
    answer:
      'No. While Mediator and Restorative Facilitator roles require specific training, our General Support roles are open to anyone willing to contribute their time and skills. All volunteers receive orientation and mentorship.',
  },
  {
    id: 'faq-4',
    question: 'How much time do I need to commit?',
    answer: 'Time commitments vary depending on the role. General Support volunteers have flexible schedules, while Mediator and Restorative Facilitator volunteers commit to training hours and ongoing participation in their respective programs. We work with each volunteer to find a schedule that works.',
  },
  {
    id: 'faq-5',
    question: 'Will I get training and support?',
    answer:
      'Yes. All volunteers receive role-specific orientation, ongoing mentorship, and opportunities for skill-building and reflection. We aim to create a supportive environment where volunteers can grow while contributing meaningfully to the Howard County community.',
  },
  {
    id: 'faq-6',
    question: 'Can I switch roles or grow into other volunteer pathways?',
    answer: 'Absolutely. Many volunteers start in General Support roles and later transition into Mediator or Restorative Facilitator roles or Board Members. We support volunteers in expanding their skills, deepening their engagement, and contributing in ways that strengthen both themselves and the community.',
  },
]
