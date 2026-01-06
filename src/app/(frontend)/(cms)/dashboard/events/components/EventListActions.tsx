'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Event } from '@/types'
import { archiveEvent, restoreEvent, setEventListed, setEventStatus } from '../firebase-actions'
import { ArchiveDialog } from './ArchiveDialog'

interface EventListActionsProps {
  event: Event
}

export function EventListActions({ event }: EventListActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)

  const handleStatusToggle = async () => {
    const newStatus = event.meta?.status === 'published' ? 'draft' : 'published'
    startTransition(async () => {
      try {
        await setEventStatus(event.id, newStatus)
        toast.success('Status updated', {
          description: `Event moved to ${newStatus}.`,
        })
        router.refresh()
      } catch (error) {
        toast.error('Failed to update status', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })
  }

  const handleListToggle = async () => {
    startTransition(async () => {
      try {
        await setEventListed(event.id, !event.listed)
        toast.success(event.listed ? 'Event unlisted' : 'Event listed', {
          description: event.listed
            ? 'Event is now hidden from public view.'
            : 'Event is now visible to the public.',
        })
        router.refresh()
      } catch (error) {
        toast.error('Failed to update listing', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })
  }

  const handleArchive = async () => {
    startTransition(async () => {
      try {
        await archiveEvent(event.id)
        toast.success('Event archived', {
          description: 'Event has been moved to archive.',
        })
        router.refresh()
      } catch (error) {
        toast.error('Failed to archive event', {
          description: error instanceof Error ? error.message : 'An error occurred',
        })
      }
    })
  }

  const handleRestore = async () => {
    startTransition(async () => {
      try {
        await restoreEvent(event.id)
        toast.success('Event restored', {
          description: 'Event has been restored from archive.',
        })
        router.refresh()
      } catch (error) {
        toast.error('Failed to restore event', {
          description: error instanceof Error ? error.message : 'An error occurred',
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

        <Button variant="outline" asChild disabled={isPending}>
          <Link href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            See Event
          </Link>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {event.isArchived ? (
          <Button variant="outline" size="default" onClick={handleRestore} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restore from Archive'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="default"
            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={() => setShowArchiveDialog(true)}
            disabled={isPending}
          >
            Archive Event
          </Button>
        )}

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
              onSelect={handleStatusToggle}
              disabled={isPending || event.isArchived}
            >
              {event.meta?.status === 'published' ? 'Move to Draft' : 'Publish'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleListToggle} disabled={event.isArchived}>
              {event.listed ? 'Unlist Event' : 'List Event'}
            </DropdownMenuItem>
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
