'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateDonationNotes } from '../firebase-actions'

interface DonationDetailClientProps {
  donationId: string
  initialNotes: string
}

export function DonationDetailClient({ donationId, initialNotes }: DonationDetailClientProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateDonationNotes(donationId, notes)
      toast.success('Notes updated successfully')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notes. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = notes !== initialNotes

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Add notes about this donation..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

