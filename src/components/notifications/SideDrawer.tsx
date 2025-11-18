'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, Bell, RefreshCcw, Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ActivityItem } from '@/types/activity'
import {
  fetchActivity,
  markActivityRead,
  markAllActivityRead,
} from '@/lib/actions/activity-actions'
import { cn } from '@/lib/utils'

interface SideDrawerProps {
  userId: string
  defaultOpen?: boolean
  renderTrigger: (context: { unreadCount: number }) => React.ReactNode
}

const listItemBase =
  'flex w-full items-start gap-3 rounded-lg border border-transparent p-3 text-left transition hover:border-border hover:bg-muted'

export function SideDrawer({ userId, defaultOpen = false, renderTrigger }: SideDrawerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadActivity = useCallback(async () => {
    try {
      setIsLoading(true)
      const items = await fetchActivity(userId, { limit: 25 })
      setActivity(items)
    } catch (error) {
      console.error('[SideDrawer] Failed to load activity', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const unreadCount = useMemo(() => activity.filter((item) => !item.read).length, [activity])

  const handleRefresh = () => {
    startTransition(() => {
      void loadActivity()
    })
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      try {
        await markAllActivityRead(userId)
        await loadActivity()
      } catch (error) {
        console.error('[SideDrawer] Failed to mark activity read', error)
      }
    })
  }

  const handleItemClick = async (item: ActivityItem) => {
    try {
      if (!item.read) {
        await markActivityRead(userId, item.id)
        setActivity((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
        )
      }
      setIsOpen(false)
      if (item.link) {
        router.push(item.link)
      }
    } catch (error) {
      console.error('[SideDrawer] Failed to update activity item', error)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} defaultOpen={defaultOpen}>
      <SheetTrigger asChild>{renderTrigger({ unreadCount })}</SheetTrigger>
      <SheetContent className="flex flex-col gap-0 sm:max-w-112">
        <SheetHeader className="border-b py-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-4 w-4" /> Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary">{unreadCount}</Badge>
            )}
          </SheetTitle>
          <SheetDescription hidden />
        </SheetHeader>

        <div className="flex items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {(isLoading || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? 'Loading activity...' : 'Latest updates from the intake team'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAll}>
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 px-4 py-6 text-sm text-muted-foreground">
              <p>Fetching your latest activity...</p>
            </div>
          ) : activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <div>
                <p className="font-medium text-foreground">You&apos;re all caught up</p>
                <p className="text-sm">New intake tasks and updates will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 px-4 py-4">
              {activity.map((item) => (
                <button
                  key={item.id}
                  className={cn(listItemBase, item.read ? 'bg-transparent' : 'bg-primary/5')}
                  type="button"
                  onClick={() => void handleItemClick(item)}
                >
                  <div className="mt-1">
                    {item.read ? (
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Badge className="bg-primary/80 text-white">New</Badge>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{item.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator />
        <div className="px-4 py-3 text-xs text-muted-foreground">
          Notifications are generated automatically from intake tasks and scheduling activity.
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default SideDrawer
