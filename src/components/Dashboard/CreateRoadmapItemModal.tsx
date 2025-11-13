'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createRoadmapItem } from '@/app/(frontend)/(cms)/dashboard/roadmap/firebase-actions'
import { toast } from 'sonner'
import type { RoadmapItemType } from '@/types'

interface CreateRoadmapItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateRoadmapItemModal({
  open,
  onOpenChange,
}: CreateRoadmapItemModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    version: '',
    type: 'Feature' as RoadmapItemType,
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.version.trim() || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert date to ISO timestamp
      if (!formData.date) {
        toast.error('Please select a date')
        setIsSubmitting(false)
        return
      }
      const dateISO = new Date(formData.date).toISOString()

      await createRoadmapItem({
        version: formData.version.trim(),
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: dateISO,
      })
      toast.success('Roadmap item created successfully!')
      setFormData({
        version: '',
        type: 'Feature',
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      })
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to create roadmap item:', error)
      toast.error('Failed to create roadmap item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Roadmap Item</DialogTitle>
          <DialogDescription>
            Add a new item to the developer roadmap timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                placeholder="e.g., v3.2.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as RoadmapItemType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feature">Feature</SelectItem>
                  <SelectItem value="Bug">Bug</SelectItem>
                  <SelectItem value="Enhancement">Enhancement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief title for the roadmap item"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the roadmap item in detail (supports line breaks)..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

