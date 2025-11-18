'use client'

import Link from 'next/link'
import { useEffect, type ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  AppSidebar,
  type SidebarNavItem,
  type SidebarTeam,
} from '@/components/Dashboard/app-sidebar'
import DashboardBreadcrumbs from '@/components/Dashboard/dashboard-breadcrumbs'
import { useCmsTheme } from '@/providers/CmsTheme'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardLayoutContentProps {
  children: ReactNode
  sidebarUser: {
    id: string
    name: string
    email: string
    role?: string
    avatar?: string
  }
  navMain: SidebarNavItem[]
  teams: SidebarTeam[]
  pendingTaskCount?: number
}

export function DashboardLayoutContent({
  children,
  sidebarUser,
  navMain,
  teams,
  pendingTaskCount,
}: DashboardLayoutContentProps) {
  const { theme } = useCmsTheme()

  // Apply theme to wrapper on mount and when theme changes
  useEffect(() => {
    const wrapper = document.querySelector('[data-cms-theme-wrapper]')
    if (wrapper) {
      wrapper.setAttribute('data-cms-theme', theme)
    }
  }, [theme])

  return (
    <div data-cms-theme-wrapper data-cms-theme={theme} className="min-h-screen">
      <SidebarProvider>
        <AppSidebar user={sidebarUser} navMain={navMain} teams={teams} />
        <SidebarInset>
          {/* Shared dashboard header */}
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1 text-foreground" />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              {/* Dynamic breadcrumbs */}
              <DashboardBreadcrumbs />
            </div>
            <div className="ml-auto flex items-center gap-2 px-4">
              {typeof pendingTaskCount === 'number' && typeof pendingTaskCount !== 'undefined' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/tasks" className="flex items-center gap-2">
                    My Tasks
                    <Badge
                      variant={pendingTaskCount > 0 ? 'default' : 'secondary'}
                      className="min-w-[2rem] justify-center"
                    >
                      {pendingTaskCount}
                    </Badge>
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {/* Every /dashboard/* page content renders here */}
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

