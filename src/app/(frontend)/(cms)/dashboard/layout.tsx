import type { ReactNode } from 'react'
import { type SidebarNavItem, type SidebarTeam } from '@/components/Dashboard/app-sidebar'
import { getCurrentUser } from '@/lib/custom-auth'
import { CmsThemeProvider } from '@/providers/CmsTheme'
import { DashboardLayoutContent } from './DashboardLayoutContent'
import { isStaff } from '@/lib/user-roles'
import { getPendingTaskCount } from '@/lib/actions/task-actions'
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
    id: user?.id ?? 'anonymous',
    name: user?.name ?? 'Staff User',
    email: user?.email ?? 'staff@example.com',
    role: user?.role ?? 'participant',
    avatar: undefined as string | undefined,
  }

  const isAdmin = user?.role === 'admin'
  const isStaffUser = isStaff(user?.role)
  const pendingTaskCount = isStaffUser && user ? await getPendingTaskCount(user.id) : undefined

  const serviceNavItems: SidebarNavItem[] = [
    {
      title: 'Mediation',
      url: '/dashboard/mediation',
      iconKey: 'handshake',
      items: [
        { title: 'Overview', url: '/dashboard/mediation' },
        { title: 'Inquiries', url: '/dashboard/mediation/inquiries' },
        { title: 'Intake Queue', url: '/dashboard/mediation/intake' },
        { title: 'Scheduling', url: '/dashboard/mediation/scheduling' },
        { title: 'Activity Log', url: '/dashboard/mediation/activity' },
      ],
    },
    {
      title: 'Facilitation',
      url: '/dashboard/facilitation',
      iconKey: 'layers',
      items: [
        { title: 'Overview', url: '/dashboard/facilitation' },
        { title: 'Inquiries', url: '/dashboard/facilitation/inquiries' },
        { title: 'Intake Queue', url: '/dashboard/facilitation/intake' },
        { title: 'Scheduling', url: '/dashboard/facilitation/scheduling' },
        { title: 'Activity Log', url: '/dashboard/facilitation/activity' },
      ],
    },
    {
      title: 'Restorative Practices',
      url: '/dashboard/restorative-practices',
      iconKey: 'heart',
      items: [
        { title: 'Overview', url: '/dashboard/restorative-practices' },
        { title: 'Inquiries', url: '/dashboard/restorative-practices/inquiries' },
        { title: 'Intake Queue', url: '/dashboard/restorative-practices/intake' },
        { title: 'Scheduling', url: '/dashboard/restorative-practices/scheduling' },
        { title: 'Activity Log', url: '/dashboard/restorative-practices/activity' },
      ],
    },
  ]

  const cmsNavItems: SidebarNavItem[] = [
    {
      title: 'Blog Posts',
      url: '/dashboard/blog',
      iconKey: 'squareTerminal',
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
      iconKey: 'piggyBank',
      items: [{ title: 'All Donations', url: '/dashboard/donations' }],
    },
    {
      title: 'Newsletter',
      url: '/dashboard/newsletter',
      iconKey: 'mailbox',
      items: [{ title: 'All Subscribers', url: '/dashboard/newsletter' }],
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
  ]

  const navMain: SidebarNavItem[] = [
    ...(isStaffUser
      ? [
          {
            title: 'My Tasks',
            url: '/dashboard/tasks',
            iconKey: 'checkSquare',
            items: [{ title: 'My Queue', url: '/dashboard/tasks' }],
          },
        ]
      : []),
    ...serviceNavItems,
    ...(isAdmin ? cmsNavItems : []),
    ...(isStaffUser
      ? [
          {
            title: 'Users',
            url: '/dashboard/users',
            iconKey: 'users',
            items: [{ title: 'All Users', url: '/dashboard/users' }],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: 'Settings',
            url: '/dashboard/settings/calendly',
            iconKey: 'frame',
            items: [{ title: 'Calendly', url: '/dashboard/settings/calendly' }],
          },
        ]
      : []),
  ]

  const teams: SidebarTeam[] = [
    { name: 'MCRC CMS', logoKey: 'galleryVerticalEnd', plan: user?.role ?? 'member' },
  ]

  return (
    <CmsThemeProvider>
      <DashboardLayoutContent
        sidebarUser={sidebarUser}
        navMain={navMain}
        teams={teams}
        pendingTaskCount={pendingTaskCount}
      >
        {children}
      </DashboardLayoutContent>
    </CmsThemeProvider>
  )
}
