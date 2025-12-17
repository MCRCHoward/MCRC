'use client'

import dynamic from 'next/dynamic'
import { MessageCircle } from 'lucide-react'
import { VideoHero } from '@/heros/VideoHero'
import { TwoColFeatureGrid } from '@/components/sections/TwoColFeatureGrid'
import {
  sectionData,
  reentryFeatures,
  discussionTopics,
  reentryBenefits,
  familySupportData,
  footerCards,
} from './reentry-data'

// Lazy load below-fold components with client-side rendering where needed
const TwoColAccordionWithImages = dynamic(
  () =>
    import('@/components/sections/TwoColAccordionWithImages').then(
      (mod) => mod.TwoColAccordionWithImages,
    ),
  { ssr: true },
)

const ValueCardsGrid = dynamic(
  () => import('@/components/sections/ValueCardsGrid').then((mod) => mod.ValueCardsGrid),
  { ssr: true },
)

const TwoColMediaSection = dynamic(
  () => import('@/components/sections/TwoColMediaSection').then((mod) => mod.TwoColMediaSection),
  { ssr: true },
)

const ScrollInViewTitleAndDescription = dynamic(
  () =>
    import('@/components/sections/ScrollInViewTitleAndDescription').then(
      (mod) => mod.ScrollInViewTitleAndDescription,
    ),
  { ssr: true },
)

const TwoColPhotoSection = dynamic(
  () => import('@/components/sections/TwoColPhotoSection').then((mod) => mod.TwoColPhotoSection),
  { ssr: true },
)

const ServicePageFooter = dynamic(
  () => import('@/components/sections/ServicePageFooter').then((mod) => mod.ServicePageFooter),
  { ssr: true },
)

export default function Reentry() {
  const { title } = sectionData

  return (
    <main>
      <VideoHero
        title="Reentry Mediation: Helping Families Reconnect & Thrive"
        subtitle="MCRC (The Mediation and Conflict Resolution Center) is a nonprofit organization, completely separate from the criminal justice system. We are not part of the courts, law enforcement, or corrections. Our mission is to provide neutral, community-based support that helps individuals and families navigate conflicts."
        videoSrc="/videos/mediation/reentryv1.mp4"
        posterSrc="/images/mediation/coupleoncouch.jpeg"
        height="85vh"
        overlayOpacity={0.5}
      />

      <TwoColFeatureGrid
        title="What is Re-Entry Mediation?"
        description="Re-Entry Mediation is a chance for people to sit down with family, friends, or anyone they see as part of their support system and talk about what coming home will look like. These conversations happen in a private, respectful space where participants can share hopes, concerns, and expectations."
        features={reentryFeatures}
      />

      <TwoColAccordionWithImages
        badge={{
          text: 'Topics',
          icon: MessageCircle,
        }}
        title="What We "
        titleStyledWord="Discuss"
        description="Imagine a neutral space where you and your loved one can openly discuss what matters most. Participants decide the agenda, which often includes:"
        items={discussionTopics}
        images={{
          main: {
            src: '/images/mediation/reentryverical.jpg',
            alt: 'Mediation session in progress',
          },
          secondary: {
            src: '/images/mediation/holdinghands.jpg',
            alt: 'Family discussion',
          },
        }}
      />

      <ValueCardsGrid
        title="Why Re-Entry Mediation Matters"
        subtitle="Research confirms what many already know from lived experience: preparing for re-entry in this way strengthens relationships and lowers barriers to success. In Maryland, re-entry mediation has become a national model, with other states now looking to replicate its approach."
        cards={reentryBenefits}
      />
      <TwoColMediaSection
        title={familySupportData.title}
        subtitle={familySupportData.subtitle}
        bulletPoints={familySupportData.bulletPoints}
        media={familySupportData.media}
      />
      <ScrollInViewTitleAndDescription title={title} />
      <TwoColPhotoSection
        title="The Peer Model: Growing Into Leadership"
        subtitle="MCRC utilizes a peer model where returning citizens can grow into leadership roles as mediators and peacekeepers, eventually training to become circle keepers themselves. This approach not only supports individual healing but also strengthens community capacity for conflict resolution."
        image={{
          src: '/images/mediation/leadershipv2.jpg',
          alt: 'Hands held together in support',
        }}
        imagePosition="left"
        showGradient={true}
      />

      <ServicePageFooter SectionTitle="Discover our other services" cards={footerCards} />
    </main>
  )
}
