import { PageHero } from '@/heros/PageHero'
import { ScrollInViewTitleAndDescription } from '@/components/sections/ScrollInViewTitleAndDescription'
import { ServicePageFooter } from '@/components/sections/ServicePageFooter'
import { TwoColTitleCheckListImage } from '@/components/sections/TwoColTitleCheckListImage'
import { TwoBoxes } from '@/components/TwoCol/TwoBoxes'
import { FAQ } from '@/components/sections/FAQ'

export const metadata = { title: 'Facilitation | MCRC' }

export default function Facilitation() {
  return (
    <main>
      <PageHero
        heading="Facilitation"
        description="At MCRC, our goal is always the same: to hold space where people can show up, speak honestly, and move forward—together."
        image={{
          src: '/images/facilitation/facilitation-v2.jpg',
          alt: 'Facilitation',
        }}
        badge="Facilitation"
        color="darkbrown"
        buttons={{
          primary: { text: 'Get Started', url: '/services/facilitation/request' },
        }}
      />

      <ScrollInViewTitleAndDescription title="At MCRC, we believe that stronger communities are built through open, honest, and structured conversations. Our group facilitation services create space for teams, organizations, and communities to work through challenges, strengthen relationships, and develop shared solutions.Whether you need support navigating internal conflicts, planning discussions, or community decision-making, our trained facilitators help guide the conversation with care, neutrality, and respect for all voices." />

      <TwoColTitleCheckListImage
        data={WhoWeWorkWith}
        imagePosition="left"
        imageSize={{ maxHeight: '400px', height: 400, width: 500 }}
      />

      <TwoColTitleCheckListImage
        data={HowOurFacilitationServicesCanHelp}
        imagePosition="right"
        imageSize={{ maxHeight: '600px', height: 600, width: 500 }}
      />

      <TwoBoxes data={TwoBoxesData} />
      <FAQ heading="How We Can Help" items={faqItems} />
      <ServicePageFooter cards={footerCards} />
    </main>
  )
}

const WhoWeWorkWith = {
  imageUrl: '/images/mediation/mediation-group-tictactoe.jpg',
  imageAlt: 'Mediation',
  videoSrc: '/videos/facilitation/people_talking_with_coffee.mp4',
  title: 'Who We Work With: ',
  checkListPosition: 'bottom',
  checkList: [
    'Neighborhood groups',
    'Nonprofits',
    'Schools',
    'Families',
    'Community colleges',
    'Coalitions',
  ],
  description:
    'Any group that is doing the work of building stronger communities. If your group is facing a big question, a shift in direction, or a time of tension or change, we are here to help guide the conversation.',
}

const HowOurFacilitationServicesCanHelp = {
  imageUrl: '/images/facilitation/group-office-work.jpg',
  imageAlt: 'Mediation',
  title: 'How Our Facilitation Services Can Help',
  description:
    'We design and lead conversations that help your group move forward with clarity and care. We keep conversations grounded, inclusive, and productive—so your group can stay connected to its purpose. Here are a few ways facilitation might support you:',
  checkList: [
    'Shaping the goals of a new advisory board',
    'Working through a strategic plan or organizational priorities',
    'Building trust after a conflict or loss',
    'Supporting equity-focused conversations or hard decision-making',
    'Creating space for everyone to be heard and valued',
  ],
}

const TwoBoxesData = {
  header: 'Our Approach: ',
  title1: 'Trained Local Facilitators',
  description1:
    'Our facilitators are staff and trained volunteers who live in or near the communities we serve. They bring deep listening skills, cultural awareness, and a commitment to restorative practices. We often use circle processes and consensus-building to make sure each participant can contribute in a meaningful way. We believe community change happens through relationships—and that the best facilitation supports not just what’s said, but how we say it to one another.',
  image1: '/images/training/training.jpg',
  image1Alt: 'Training our Staff and Volunteers',
  title2: 'Sliding Scale Pricing',
  description2:
    'We offer our facilitation services on a sliding scale based on your organization’s budget. No one is turned away due to lack of funds. We believe every group deserves access to skilled, community-rooted facilitation—regardless of financial resources.',
  image2: '/images/facilitation/facilitation-extending-hand.jpg',
  image2Alt: 'We Work with pay scales',
  color2: 'darkgreen',
}

const faqItems = [
  {
    id: 'faq-1',
    question: 'Workplaces & Organizations',
    list: [
      'Support for team development, communication, and decision-making',
      'Facilitate strategic planning sessions',
      'Strengthen team collaboration',
      'Navigate workplace transitions or tension',
      'Promote inclusive staff engagement',
    ],
  },
  {
    id: 'faq-2',
    question: 'Community Groups',
    list: [
      'Address challenges and plan together—openly and respectfully',
      'Support neighborhood or school-based initiatives',
      'Help boards or advisory groups set goals',
      'Create space for multigenerational or cross-cultural dialogue',
    ],
  },
  {
    id: 'faq-3',
    question: 'Difficult Conversations',
    list: [
      'Skilled, neutral facilitation for sensitive topics',
      'Address harm or broken trust',
      'Explore issues of equity, identity, or inclusion',
      'Process grief, change, or conflict',
    ],
  },
  {
    id: 'faq-4',
    question: 'Skilled, neutral facilitation for sensitive topics',
    list: [
      'Address harm or broken trust',
      'Explore issues of equity, identity, or inclusion',
      'Process grief, change, or conflict',
    ],
  },
  {
    id: 'faq-5',
    question: 'Coalition Building & Planning ',
    list: [
      'Help your community or multi-partner effort move forward together',
      'Support grassroots and cross-sector coalitions',
      'Build shared goals and agreements',
      'Guide inclusive planning and collaborative problem-solving',
    ],
  },
]

const footerCards = [
  { title: 'Mediation', subtitle: 'Service', href: '/services/mediation', color: 'blue' },
  {
    title: 'Restorative Justice',
    subtitle: 'Service',
    href: '/services/restorative-justice',
    color: 'darkgreen',
  },
]
