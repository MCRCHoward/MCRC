'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  FileCheck,
  FileMinus,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  bulkArchiveEvents,
  bulkRestoreEvents,
  bulkSetEventStatus,
  bulkSetEventListed,
} from '../firebase-actions'
import { BulkConfirmDialog, type BulkAction } from './BulkConfirmDialog'

interface BulkActionsBarProps {
  selectedIds: Set<string>
  selectedCount: number
  view: 'active' | 'archived'
  onClearSelection: () => void
  selectedEventNames?: string[]
  className?: string
}

type ActionType = 'archive' | 'restore' | 'publish' | 'unpublish' | 'list' | 'unlist'

interface ActionConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: BulkAction
  variant: 'default' | 'destructive' | 'outline' | 'secondary'
}

const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  archive: {
    label: 'Archive',
    icon: Archive,
    action: 'archive',
    variant: 'destructive',
  },
  restore: {
    label: 'Restore',
    icon: ArchiveRestore,
    action: 'restore',
    variant: 'default',
  },
  publish: {
    label: 'Publish',
    icon: FileCheck,
    action: 'publish',
    variant: 'default',
  },
  unpublish: {
    label: 'Unpublish',
    icon: FileMinus,
    action: 'unpublish',
    variant: 'secondary',
  },
  list: {
    label: 'List',
    icon: Eye,
    action: 'list',
    variant: 'outline',
  },
  unlist: {
    label: 'Unlist',
    icon: EyeOff,
    action: 'unlist',
    variant: 'outline',
  },
}

export function BulkActionsBar({
  selectedIds,
  selectedCount,
  view,
  onClearSelection,
  selectedEventNames = [],
  className,
}: BulkActionsBarProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingAction, setProcessingAction] = useState<ActionType | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    action: BulkAction
    actionType: ActionType
  }>({
    open: false,
    action: 'archive',
    actionType: 'archive',
  })

  if (selectedCount === 0) {
    return null
  }

  const idsArray = Array.from(selectedIds)

  const handleAction = async (actionType: ActionType) => {
    const needsConfirmation = ['archive', 'restore', 'unpublish'].includes(actionType)

    if (needsConfirmation) {
      setConfirmDialog({
        open: true,
        action: ACTION_CONFIGS[actionType].action,
        actionType,
      })
      return
    }

    await executeAction(actionType)
  }

  const executeAction = async (actionType: ActionType) => {
    setIsProcessing(true)
    setProcessingAction(actionType)

    try {
      let result: { success: number; failed: number }

      switch (actionType) {
        case 'archive':
          result = await bulkArchiveEvents(idsArray)
          break
        case 'restore':
          result = await bulkRestoreEvents(idsArray)
          break
        case 'publish':
          result = await bulkSetEventStatus(idsArray, 'published')
          break
        case 'unpublish':
          result = await bulkSetEventStatus(idsArray, 'draft')
          break
        case 'list':
          result = await bulkSetEventListed(idsArray, true)
          break
        case 'unlist':
          result = await bulkSetEventListed(idsArray, false)
          break
        default:
          throw new Error(`Unknown action: ${actionType}`)
      }

      if (result.failed === 0) {
        toast.success(`${ACTION_CONFIGS[actionType].label} successful`, {
          description: `${result.success} event${result.success !== 1 ? 's' : ''} updated.`,
        })
      } else if (result.success === 0) {
        toast.error(`${ACTION_CONFIGS[actionType].label} failed`, {
          description: `Failed to update ${result.failed} event${result.failed !== 1 ? 's' : ''}.`,
        })
      } else {
        toast.warning(`${ACTION_CONFIGS[actionType].label} partially completed`, {
          description: `${result.success} succeeded, ${result.failed} failed.`,
        })
      }

      onClearSelection()
      router.refresh()
    } catch (error) {
      console.error(`Bulk ${actionType} error:`, error)
      toast.error(`${ACTION_CONFIGS[actionType].label} failed`, {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      })
    } finally {
      setIsProcessing(false)
      setProcessingAction(null)
    }
  }

  const handleConfirm = async () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }))
    await executeAction(confirmDialog.actionType)
  }

  const handleCloseDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }))
  }

  const availableActions: ActionType[] =
    view === 'archived'
      ? ['restore']
      : ['archive', 'publish', 'unpublish', 'list', 'unlist']

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
          'flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg',
          'animate-in fade-in slide-in-from-bottom-4 duration-200',
          className,
        )}
        role="toolbar"
        aria-label="Bulk actions"
      >
        <span className="px-2 text-sm font-medium text-foreground">
          {selectedCount} event{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          {availableActions.map((actionType) => {
            const config = ACTION_CONFIGS[actionType]
            const Icon = config.icon
            const isCurrentlyProcessing = isProcessing && processingAction === actionType

            return (
              <Button
                key={actionType}
                variant={config.variant}
                size="sm"
                onClick={() => handleAction(actionType)}
                disabled={isProcessing}
                className="gap-1.5"
              >
                {isCurrentlyProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            )
          })}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing}
          aria-label="Clear selection"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <BulkConfirmDialog
        open={confirmDialog.open}
        onOpenChange={handleCloseDialog}
        onConfirm={handleConfirm}
        action={confirmDialog.action}
        count={selectedCount}
        eventNames={selectedEventNames.slice(0, 5)}
      />
    </>
  )
}
