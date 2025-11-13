'use client'

import { formatDistanceToNow } from 'date-fns'
import { Check, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Recommendation } from '@/types'
import {
  acceptRecommendation,
  deleteRecommendation,
} from '@/app/(frontend)/(cms)/dashboard/roadmap/firebase-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RecommendationGridProps {
  recommendations: Recommendation[]
  isAdmin: boolean
}

export default function RecommendationGrid({
  recommendations,
  isAdmin,
}: RecommendationGridProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAccept = async (id: string) => {
    setProcessingId(id)
    try {
      await acceptRecommendation(id)
      router.refresh()
    } catch (error) {
      console.error('Failed to accept recommendation:', error)
      alert('Failed to accept recommendation. Please try again.')
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
      router.refresh()
    } catch (error) {
      console.error('Failed to delete recommendation:', error)
      alert('Failed to delete recommendation. Please try again.')
    } finally {
      setProcessingId(null)
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
                <CardTitle className="text-lg pr-8">{rec.title}</CardTitle>
                {isAdmin && (
                  <div className="flex gap-1">
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
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                {rec.description}
              </p>
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

