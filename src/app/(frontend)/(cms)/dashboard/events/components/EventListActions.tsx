'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import type { Event } from '@/types'
import { archiveEvent, restoreEvent, setEventListed, setEventStatus } from '../firebase-actions'
import { ArchiveDialog } from './ArchiveDialog'

interface EventListActionsProps {
  event: Event
}

export function EventListActions({ event }: EventListActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const handleStatusToggle = async () => {
    const newStatus = event.meta?.status === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      try {
        await setEventStatus(event.id, newStatus)
        toast({
          title: 'Status updated',
          description: `Event moved to ${newStatus}.`,
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update status',
          variant: 'destructive',
        })
      }
    })
  }

  const handleListToggle = async () => {
    startTransition(async () => {
      try {
        await setEventListed(event.id, !event.listed)
        toast({
          title: event.listed ? 'Event unlisted' : 'Event listed',
          description: event.listed 
            ? 'Event is now hidden from public view.' 
            : 'Event is now visible to the public.',
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to update listing',
          variant: 'destructive',
        })
      }
    })
  }

  const handleArchive = async () => {
    startTransition(async () => {
      try {
        await archiveEvent(event.id)
        toast({
          title: 'Event archived',
          description: 'Event has been moved to archive.',
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to archive event',
          variant: 'destructive',
        })
      }
    })
  }

  const handleRestore = async () => {
    startTransition(async () => {
      try {
        await restoreEvent(event.id)
        toast({
          title: 'Event restored',
          description: 'Event has been restored from archive.',
        })
        router.refresh()
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to restore event',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" asChild disabled={isPending}>
          <Link href={`/dashboard/events/${event.slug}`}>Edit</Link>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant={event.meta?.status === 'published' ? 'secondary' : 'default'}
          size="default"
          onClick={handleStatusToggle}
          disabled={isPending || event.isArchived}
          aria-disabled={event.isArchived}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : event.meta?.status === 'published' ? (
            'Move to Draft'
          ) : (
            'Publish'
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={handleListToggle}
              disabled={event.isArchived}
            >
              {event.listed ? 'Unlist Event' : 'List Event'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {event.isArchived ? (
              <DropdownMenuItem onSelect={handleRestore}>
                Restore from Archive
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => setShowArchiveDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                Archive Event
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ArchiveDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={handleArchive}
        eventName={event.name}
      />
    </>
  )
}
