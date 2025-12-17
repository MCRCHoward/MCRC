import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Home,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react'

export const sectionData = {
  title:
    'MCRC also offers Restorative Circles designed specifically for people returning home from incarceration. Circles provide a safe space to practice new ways of handling conflict, strengthening communication, and building healthier relationships. While circles are primarily for returning citizens, family members may be included if requested. With guidance from a trained circle keeper, participants work through real challenges and deepen the skills needed to resolve conflict in daily life—whether at home, in the workplace, or in the community.',
  subtitle:
    'Trained, neutral mediators guide the conversation—not to take sides or make decisions for you, but to help you:',
  imageUrl: '/images/mediation/mediation-group-tictactoe.jpg',
  imageAlt: 'Mediation',
  videoSrc: '/videos/mediation/mediation-office.mp4',
}

export const reentryFeatures = [
  {
    icon: Shield,
    title: 'Voluntary & Confidential',
    description: 'The process is entirely voluntary.',
  },
  {
    icon: Heart,
    title: 'A Safe Space',
    description: 'Everyone has the chance to speak, listen, and be heard.',
  },
  {
    icon: UsersRound,
    title: 'Neutral Guidance',
    description:
      'Each mediation is guided by two neutral, trained mediators. They facilitate the conversation to ensure everyone has a voice, but the direction comes from the people in the room.',
  },
]

export const discussionTopics = [
  {
    id: 'hopes',
    icon: Heart,
    title: 'Hopes and Expectations',
    content: 'What does everyone envision for life after release?',
  },
  {
    id: 'practical',
    icon: Home,
    title: 'Practical Needs',
    content: 'Addressing housing, employment, healthcare, and support systems.',
  },
  {
    id: 'family',
    icon: Users,
    title: 'Family Dynamics',
    content: 'How will roles and responsibilities be shared?',
  },
  {
    id: 'communication',
    icon: MessageCircle,
    title: 'Communication',
    content: 'Building bridges and understanding after a period of separation.',
  },
  {
    id: 'barriers',
    icon: AlertCircle,
    title: 'Barriers & Challenges',
    content:
      'Proactively addressing hurdles like transportation, childcare, or access to recovery support.',
  },
]

export const reentryBenefits = [
  {
    icon: Shield,
    iconBgColor: 'bg-green-200',
    title: 'Reduces Conflict & Stress',
    description:
      'By addressing potential issues before they become major problems, mediation can prevent misunderstandings and reduce family tension.',
  },
  {
    icon: Heart,
    iconBgColor: 'bg-purple-200',
    title: 'Strengthens Family Bonds',
    description:
      'It creates an opportunity to rebuild trust and strengthen relationships that may have been strained.',
  },
  {
    icon: TrendingUp,
    iconBgColor: 'bg-lime-200',
    title: 'Promotes Successful Reintegration',
    description:
      'When families are on the same page and have a plan, it significantly increases the likelihood of a positive, sustainable return.',
  },
  {
    icon: Sparkles,
    iconBgColor: 'bg-pink-200',
    title: 'Empowers Families',
    description: 'Mediation gives families a proactive role in shaping a positive future.',
  },
  {
    icon: Settings,
    iconBgColor: 'bg-teal-200',
    title: 'Tailored Solutions',
    description:
      'Every family is unique. Mediation allows for personalized agreements that fit your specific needs.',
  },
]

export const familySupportData = {
  title: 'How We Help Families',
  subtitle:
    'If you are a family member anticipating the return of a loved one, or if you are already navigating their re-entry, our services provide invaluable support. We can help you:',
  bulletPoints: [
    {
      id: 'expectations',
      icon: CheckCircle2,
      text: 'Prepare for their return with clear expectations.',
    },
    {
      id: 'arrangements',
      icon: MessageCircle,
      text: 'Discuss practical arrangements and support systems.',
    },
    {
      id: 'concerns',
      icon: Shield,
      text: 'Address any concerns or fears in a safe environment.',
    },
    {
      id: 'plan',
      icon: Target,
      text: 'Develop a family plan for a positive future.',
    },
    {
      id: 'communication',
      icon: Users,
      text: 'Improve communication and understanding among family members.',
    },
  ],
  media: {
    type: 'video' as const,
    src: '/videos/mediation/happyfamily.mp4',
    alt: 'Family support and mediation session',
  },
}

export const footerCards = [
  {
    title: 'Facilitation',
    subtitle: 'Service',
    href: '/services/facilitation',
    color: 'darkbrown',
  },
  {
    title: 'Restorative Justice',
    subtitle: 'Service',
    href: '/services/restorative-justice',
    color: 'darkgreen',
  },
]
