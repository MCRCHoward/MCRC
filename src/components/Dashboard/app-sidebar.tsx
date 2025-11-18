'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { NavMain } from '@/components/Dashboard/nav-main'
import { NavProjects } from '@/components/Dashboard/nav-projects'
import { NavUser } from '@/components/Dashboard/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

export type SidebarNavItem = {
  title: string
  url: string
  iconKey?: string
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export type SidebarProject = {
  name: string
  url: string
  iconKey: string
}

export type SidebarTeam = {
  name: string
  logoKey: string
  plan: string
}

export type SidebarUser = {
  id: string
  name: string
  email: string
  role?: string
  avatar?: string
}

type Props = React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser
  navMain: SidebarNavItem[]
  projects?: SidebarProject[]
  teams?: SidebarTeam[]
}

export function AppSidebar({ user, navMain, projects = [], teams: _teams = [], ...props }: Props) {
  const pathname = usePathname()
  const isDashboardRoute = pathname === '/dashboard'

  const formattedRole = React.useMemo(() => {
    const role = user.role ?? ''
    if (!role.trim()) return 'Team member'
    return role
      .split(/[ _-]/)
      .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
      .join(' ')
  }, [user.role])

  const subtitle = isDashboardRoute ? formattedRole : 'Back to dashboard'

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md px-2 py-3 text-left text-sm font-semibold transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg font-semibold">
            M
          </div>
          <div className="grid flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm">MCRC CMS</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{subtitle}</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {!!projects.length && <NavProjects projects={projects} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
