import type { ReactNode } from 'react'
import {
  type SidebarNavItem,
  type SidebarTeam,
} from '@/components/Dashboard/app-sidebar'
import { getCurrentUser } from '@/lib/custom-auth'
import { CmsThemeProvider } from '@/providers/CmsTheme'
import { DashboardLayoutContent } from './DashboardLayoutContent'
import './cms-theme.css'

// Server-side rendering configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Dashboard Layout - Server Component
 *
 * Provides the main dashboard structure with sidebar navigation.
 * The parent (cms)/layout.tsx already handles authentication, so we just read user for UI.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to parent layout auth check
  const sidebarUser = {
    name: user?.name ?? 'Staff User',
    email: user?.email ?? 'staff@example.com',
    avatar: undefined as string | undefined,
  }

  const navMain: SidebarNavItem[] = [
    {
      title: 'Blog Posts',
      url: '/dashboard/blog',
      iconKey: 'squareTerminal',
      isActive: true,
      items: [
        { title: 'New Blog Post', url: '/dashboard/blog/new' },
        { title: 'All Blog Posts', url: '/dashboard/blog' },
        { title: 'Categories', url: '/dashboard/blog/categories' },
        { title: 'Trash', url: '/dashboard/blog/trash' },
      ],
    },
    {
      title: 'Events',
      url: '/dashboard/events',
      iconKey: 'calendar',
      items: [
        { title: 'New Event', url: '/dashboard/events/new' },
        { title: 'All Events', url: '/dashboard/events' },
        { title: 'Tags', url: '/dashboard/events/tags' },
        { title: 'Trash', url: '/dashboard/events/trash' },
      ],
    },
    {
      title: 'Donations',
      url: '/dashboard/donations',
      iconKey: 'heart',
      items: [{ title: 'All Donations', url: '/dashboard/donations' }],
    },
    {
      title: 'Newsletter',
      url: '/dashboard/newsletter',
      iconKey: 'mailbox',
      items: [{ title: 'All Subscribers', url: '/dashboard/newsletter' }],
    },
    {
      title: 'Inquiries',
      url: '/dashboard/inquiry',
      iconKey: 'fileText',
      items: [
        { title: 'All Submissions', url: '/dashboard/inquiry' },
        { title: 'Mediation', url: '/dashboard/inquiry/mediation' },
      ],
    },
    {
      title: 'Developer Roadmap',
      url: '/dashboard/roadmap',
      iconKey: 'map',
      items: [
        { title: 'Active Roadmap', url: '/dashboard/roadmap' },
        { title: 'Completed', url: '/dashboard/roadmap/completed' },
      ],
    },
    {
      title: 'Users',
      url: '/dashboard/users',
      iconKey: 'users',
      items: [{ title: 'All Users', url: '/dashboard/users' }],
    },
  ]

  const teams: SidebarTeam[] = [
    { name: 'MCRC CMS', logoKey: 'galleryVerticalEnd', plan: user?.role ?? 'member' },
  ]

  return (
    <CmsThemeProvider>
      <DashboardLayoutContent sidebarUser={sidebarUser} navMain={navMain} teams={teams}>
        {children}
      </DashboardLayoutContent>
    </CmsThemeProvider>
  )
}
