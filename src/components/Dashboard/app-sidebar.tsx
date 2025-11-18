'use client'

import * as React from 'react'
import { NavMain } from '@/components/Dashboard/nav-main'
import { NavProjects } from '@/components/Dashboard/nav-projects'
import { NavUser } from '@/components/Dashboard/nav-user'
import { TeamSwitcher } from '@/components/Dashboard/team-switcher'
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

export function AppSidebar({ user, navMain, projects = [], teams = [], ...props }: Props) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
