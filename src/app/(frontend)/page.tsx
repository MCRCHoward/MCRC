import { Metadata } from 'next'
import { HomepageHeader } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { Hero } from '@/components/sections/Hero'
import { TypeWriter } from '@/components/ui/TypeWriter'
import { Services } from '@/components/sections/Services'
import { EventsPreview } from '@/components/sections/EventsPreview'
import { AboutPreview } from '@/components/sections/AboutPreview'
import { CallToAction } from '@/components/sections/CallToAction'
import { GetInvolved } from '@/components/sections/GetInvolved'
import { Stats } from '@/components/sections/Stats'
import { Volunteer } from '@/components/sections/Volunteer'
import { CheckCircle, Edit, Timer, List, MessagesSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Home | Mediation and Conflict Resolution Center',
  description:
    'Welcome to our organization. We are dedicated to making a difference in our community.',
}

// Temporary mock data - will be replaced with Firebase data
const mockData = {
  cta: {
    imgSrc: '/images/mediation/happy-conversation.jpg',
    title: 'Help us keep mediation free, mediation is not just a service it is a cause.',
    description: 'Join the Giving Circle',
    buttonText: 'Donate Here',
    buttonLink: '/donate',
  },
}

export default function HomePage() {
  return (
    <>
      <HomepageHeader />
      <main className="min-h-screen">
        <Hero />
        <TypeWriter />
        <section className="mx-4">
          <div className="relative mx-auto mt-24 aspect-video w-full max-w-6xl overflow-hidden rounded-2xl shadow-lg">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/RKtyFi4dXKk?si=rlLcNwE5SlGQO7y6"
              title="Organization introduction video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
        <Services />
        <EventsPreview />
        <AboutPreview
          data={{
            header: 'About Us',
            subheader: 'And A Bit of Our History',
            description:
              'Originally connected to Howard Community College, we have since grown into an independent, community-rooted organization. Our work is grounded in the belief that people hold the wisdom and capacity to navigate their own challenges when given the right support. We walk alongside individuals, families, and groups to facilitate conversations that restore trust, mend relationships, and build stronger communities.',
            image: '/images/facilitation/cheerful-woman-speaking-on-a-microphone.jpg',
            imageAlt: 'Cheerful woman speaking',
            buttonText: 'Learn More',
            buttonLink: '/about',
            dataList: [
              {
                title: 'Our Mission',
                icon: MessagesSquare,
              },
              {
                title: 'Our Core Values',
                icon: Edit,
              },
              {
                title: 'Nine Hallmarks of Community Mediation',
                icon: CheckCircle,
              },
              {
                title: 'Our Staff',
                icon: List,
              },
              {
                title: 'Our Partners',
                icon: Timer,
              },
            ],
          }}
        />
        <CallToAction
          imgSrc={mockData.cta.imgSrc}
          title={mockData.cta.title}
          description={mockData.cta.description}
          buttonText={mockData.cta.buttonText}
          buttonLink={mockData.cta.buttonLink}
        />
        <GetInvolved />
        <Stats />
        {/* <BlogPreview /> */}
        <Volunteer />
      </main>
      <Footer />
    </>
  )
}
