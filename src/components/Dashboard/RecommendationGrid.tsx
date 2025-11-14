'use client'

import { formatDistanceToNow } from 'date-fns'
import { Check, Trash2, Edit2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Recommendation } from '@/types'
import {
  acceptRecommendation,
  deleteRecommendation,
  updateRecommendation,
} from '@/app/(frontend)/(cms)/dashboard/roadmap/firebase-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

interface RecommendationGridProps {
  recommendations: Recommendation[]
  isAdmin: boolean
  currentUserId?: string
}

export default function RecommendationGrid({
  recommendations,
  isAdmin,
  currentUserId,
}: RecommendationGridProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleAccept = async (id: string) => {
    setProcessingId(id)
    try {
      await acceptRecommendation(id)
      toast.success('Recommendation accepted and added to roadmap')
      router.refresh()
    } catch (error) {
      console.error('Failed to accept recommendation:', error)
      toast.error('Failed to accept recommendation. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) {
      return
    }

    setProcessingId(id)
    try {
      await deleteRecommendation(id)
      toast.success('Recommendation deleted')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete recommendation:', error)
      toast.error('Failed to delete recommendation. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleEdit = (rec: Recommendation) => {
    setEditingId(rec.id)
    setEditTitle(rec.title)
    setEditDescription(rec.description)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleSave = async (id: string) => {
    // Client-side validation
    if (!editTitle.trim() || !editDescription.trim()) {
      toast.error('Title and description cannot be empty')
      return
    }

    setSavingId(id)
    try {
      await updateRecommendation(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      })
      toast.success('Recommendation updated successfully')
      setEditingId(null)
      setEditTitle('')
      setEditDescription('')
      router.refresh()
    } catch (error) {
      console.error('Failed to update recommendation:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update recommendation. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSavingId(null)
    }
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No recommendations yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recommendations.map((rec) => {
        const isAccepted = rec.status === 'accepted'
        const timeAgo = formatDistanceToNow(new Date(rec.submittedAt), { addSuffix: true })

        return (
          <Card
            key={rec.id}
            className={`relative overflow-hidden ${
              isAccepted ? 'border-green-500 border-2' : ''
            }`}
          >
            {isAccepted && (
              <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                Accepted
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                {editingId === rec.id ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-semibold flex-1"
                    placeholder="Title"
                    disabled={savingId === rec.id}
                  />
                ) : (
                  <CardTitle className="text-lg pr-8">{rec.title}</CardTitle>
                )}
                <div className="flex gap-1">
                  {/* Edit button - only for owner of pending recommendations */}
                  {currentUserId &&
                    rec.submittedBy === currentUserId &&
                    rec.status === 'pending' &&
                    editingId !== rec.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(rec)}
                        disabled={editingId !== null || processingId === rec.id}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit recommendation"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  {/* Save and Cancel buttons - shown when editing */}
                  {editingId === rec.id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave(rec.id)}
                        disabled={savingId === rec.id}
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Save changes"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                        disabled={savingId === rec.id}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Cancel editing"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {/* Admin buttons */}
                  {isAdmin && editingId !== rec.id && (
                    <>
                      {rec.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleAccept(rec.id)}
                          disabled={processingId === rec.id}
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Accept recommendation"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rec.id)}
                        disabled={processingId === rec.id}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete recommendation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === rec.id ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="text-sm mb-4 min-h-[100px]"
                  placeholder="Description"
                  disabled={savingId === rec.id}
                />
              ) : (
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                  {rec.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>By {rec.submittedByName}</span>
                <span>{timeAgo}</span>
              </div>
              {rec.status === 'pending' && (
                <Badge variant="secondary" className="mt-2">
                  Pending
                </Badge>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

