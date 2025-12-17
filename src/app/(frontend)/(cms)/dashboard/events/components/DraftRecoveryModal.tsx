'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

interface DraftRecoveryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRestore: () => void
  onDiscard: () => void
  lastSaved?: Date
}

export function DraftRecoveryModal({
  open,
  onOpenChange,
  onRestore,
  onDiscard,
  lastSaved,
}: DraftRecoveryModalProps) {
  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown'
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Restore Draft?
          </DialogTitle>
          <DialogDescription>
            We found a saved draft from {lastSaved ? formatDate(lastSaved) : 'earlier'}. Would you
            like to restore it or start fresh?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>
            Start Fresh
          </Button>
          <Button onClick={onRestore}>Restore Draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

