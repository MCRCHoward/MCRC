import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  AppSidebar,
  type SidebarNavItem,
  type SidebarTeam,
} from '@/components/Dashboard/app-sidebar'
import { getCurrentUser } from '@/lib/custom-auth'
import DashboardBreadcrumbs from '@/components/Dashboard/dashboard-breadcrumbs'

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
  ]

  const teams: SidebarTeam[] = [
    { name: 'MCRC CMS', logoKey: 'galleryVerticalEnd', plan: user?.role ?? 'member' },
  ]

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} navMain={navMain} teams={teams} />
      <SidebarInset>
        {/* Shared dashboard header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            {/* Dynamic breadcrumbs */}
            <DashboardBreadcrumbs />
          </div>
        </header>

        {/* Every /dashboard/* page content renders here */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
