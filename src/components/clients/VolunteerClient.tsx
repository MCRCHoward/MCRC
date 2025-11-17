'use client'

import { PageHero } from '@/heros/PageHero'

import { FAQ } from '@/components/sections/FAQ'

import VolunteerForm from '@/Forms/components/VolunteerForm'
import { ScrollInViewTitleAndDescription } from '@/components/sections/ScrollInViewTitleAndDescription'

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

          <div className="mt-8 flex gap-10 max-md:flex-col md:mt-12 md:divide-x">
            {/* Contact Information */}
            <article className="space-y-10 pr-10 md:gap-20">
              <div>
                <h2 className="text-lg font-semibold">Corporate office</h2>
                <p className="mt-3 font-medium tracking-tight text-muted-foreground">
                  1 Carlsberg Close
                  <br />
                  1260 Hillview, Australia
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Email us</h2>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-primary">Careers</p>
                    <a href="#" className="mt-3 tracking-tight text-muted-foreground">
                      careers@example.com
                    </a>
                  </div>
                  <div>
                    <p className="text-primary">Press</p>
                    <a href="#" className="mt-3 tracking-tight text-muted-foreground">
                      press@example.com
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Follow us</h2>
                <div className="mt-3 flex gap-6"></div>
              </div>
            </article>

            {/* Inquiry Form */}
            <div className="pl-10 w-full">
              <VolunteerForm />
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
