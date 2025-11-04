import { Book, Trees, Sunset } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Shared menu data constants for Header components
 * Used by both HomepageHeader and DefaultHeader
 */

export interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: ReactNode
  items?: MenuItem[]
}

export interface AuthConfig {
  login: { title: string; url: string }
  signup: { title: string; url: string }
}

export interface LogoConfig {
  url: string
  src: string
  alt: string
  title: string
}

/**
 * Default navigation menu items
 */
export const defaultMenuItems: MenuItem[] = [
  { title: 'Home', url: '/' },
  { title: 'About', url: '/about' },
  {
    title: 'Services',
    url: '/services',
    items: [
      {
        title: 'Mediation',
        description: 'Resolve disputes amicably with guided, neutral support.',
        icon: <Book className="size-5 shrink-0" />,
        url: '/services/mediation',
      },
      {
        title: 'Facilitation',
        description: 'Navigate complex conversations and group decisions effectively.',
        icon: <Trees className="size-5 shrink-0" />,
        url: '/services/facilitation',
      },
      {
        title: 'Restorative Justice',
        description: 'Repair harm and rebuild community trust through dialogue.',
        icon: <Sunset className="size-5 shrink-0" />,
        url: '/services/restorative-justice',
      },
      {
        title: 'Training',
        description: 'Develop your skills in mediation and facilitation.',
        icon: <Book className="size-5 shrink-0" />,
        url: '/services/training',
      },
    ],
  },
  { title: 'Events', url: '/events' },
  { title: 'Blog', url: '/blog' },
  { title: 'Contact', url: '/contact' },
]

/**
 * Default logo configuration
 */
export const defaultLogo: LogoConfig = {
  url: '/',
  src: '/images/logo/mcrc-logo.png',
  alt: 'MCRC Logo',
  title: 'MCRC Howard',
}

/**
 * Default authentication configuration
 */
export const defaultAuth: AuthConfig = {
  login: { title: 'Get Started', url: '/get-started' },
  signup: { title: 'Donate', url: '/donate' },
}
