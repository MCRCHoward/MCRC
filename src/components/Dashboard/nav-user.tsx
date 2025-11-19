'use client'

import { useRouter } from 'next/navigation'
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, Moon, Sparkles, Sun } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { toast } from 'sonner'
import { auth } from '@/firebase/client'
import { signOut } from 'firebase/auth'
import { useCmsTheme } from '@/providers/CmsTheme'
import SideDrawer from '@/components/notifications/SideDrawer'

function getInitials(name?: string) {
  if (!name) return 'U'
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
  return initials.toUpperCase() || 'U'
}

export function NavUser({
  user,
}: {
  user: {
    id: string
    name: string
    email: string
    role?: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { theme, setTheme } = useCmsTheme()

  const onLogout = async () => {
    try {
      // Sign out from Firebase Auth on the client
      await signOut(auth)

      // Clear server session cookie
      const response = await fetch('/api/session', { method: 'DELETE' })

      if (!response.ok) {
        // Even if session deletion fails, we've signed out from Firebase, so continue
        console.warn('Failed to clear server session, but user is signed out from Firebase')
      }

      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Try to redirect anyway, as Firebase sign-out might have succeeded
      toast.error('An error occurred during logout. Redirecting to login...')
      router.push('/login')
      router.refresh()
    }
  }

  const initials = getInitials(user.name)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                This part coming soon
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? <Moon /> : <Sun />}
                {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              </DropdownMenuItem>
              <SideDrawer
                userId={user.id}
                renderTrigger={({ unreadCount }) => (
                  <DropdownMenuItem
                    onSelect={(event) => event.preventDefault()}
                    className="cursor-pointer"
                  >
                    <Bell />
                    Notifications
                    {unreadCount > 0 && (
                      <Badge className="ml-auto bg-primary/10 text-primary">{unreadCount}</Badge>
                    )}
                  </DropdownMenuItem>
                )}
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
