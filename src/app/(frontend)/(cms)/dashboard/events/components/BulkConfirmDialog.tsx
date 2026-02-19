'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export type BulkAction = 'archive' | 'restore' | 'publish' | 'unpublish' | 'list' | 'unlist'

interface ActionContent {
  title: string
  description: string
  confirmLabel: string
  confirmVariant: 'default' | 'destructive'
}

const ACTION_CONTENT: Record<BulkAction, ActionContent> = {
  archive: {
    title: 'Archive these events?',
    description:
      'The selected events will be hidden from public view and registration will be disabled. You can restore them later from the Archived tab.',
    confirmLabel: 'Archive Events',
    confirmVariant: 'destructive',
  },
  restore: {
    title: 'Restore these events?',
    description:
      'The selected events will be restored to the active list. Their previous status (draft/published) and listing settings will be preserved.',
    confirmLabel: 'Restore Events',
    confirmVariant: 'default',
  },
  publish: {
    title: 'Publish these events?',
    description:
      'The selected events will be published and visible to the public (if also listed).',
    confirmLabel: 'Publish Events',
    confirmVariant: 'default',
  },
  unpublish: {
    title: 'Unpublish these events?',
    description:
      'The selected events will be moved to draft status and hidden from public view until published again.',
    confirmLabel: 'Unpublish Events',
    confirmVariant: 'destructive',
  },
  list: {
    title: 'List these events?',
    description:
      'The selected events will appear in the public events listing (if published).',
    confirmLabel: 'List Events',
    confirmVariant: 'default',
  },
  unlist: {
    title: 'Unlist these events?',
    description:
      'The selected events will be hidden from the public events listing but still accessible via direct link (if published).',
    confirmLabel: 'Unlist Events',
    confirmVariant: 'default',
  },
}

interface BulkConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  action: BulkAction
  count: number
  eventNames?: string[]
}

export function BulkConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  action,
  count,
  eventNames = [],
}: BulkConfirmDialogProps) {
  const content = ACTION_CONTENT[action]
  const showEventList = eventNames.length > 0
  const hasMoreEvents = count > eventNames.length

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <span className="font-semibold">{count}</span> event
                {count !== 1 ? 's' : ''} will be affected.
              </p>

              {showEventList && (
                <div className="rounded-md border bg-muted/50 p-3">
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {eventNames.map((name, index) => (
                      <li key={index} className="truncate">
                        {name}
                      </li>
                    ))}
                    {hasMoreEvents && (
                      <li className="text-muted-foreground">
                        ...and {count - eventNames.length} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <p className="text-muted-foreground">{content.description}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              content.confirmVariant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
          >
            {content.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
