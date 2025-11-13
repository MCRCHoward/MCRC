'use client'

import { formatDistanceToNow } from 'date-fns'
import { Plus, Bug, Sparkles, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RoadmapItem } from '@/types'
import { deleteRoadmapItem } from '@/app/(frontend)/(cms)/dashboard/roadmap/firebase-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RoadmapTimelineProps {
  items: RoadmapItem[]
  isAdmin: boolean
}

export default function RoadmapTimeline({ items, isAdmin }: RoadmapTimelineProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this roadmap item?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteRoadmapItem(id)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete roadmap item:', error)
      alert('Failed to delete roadmap item. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Bug':
        return <Bug className="h-5 w-5" />
      case 'Enhancement':
        return <Sparkles className="h-5 w-5" />
      default:
        return <Plus className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Bug':
        return 'bg-red-500'
      case 'Enhancement':
        return 'bg-blue-500'
      default:
        return 'bg-green-500'
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No roadmap items yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-card">
      <div className="max-w-2xl mx-auto p-8">
        <div className="flow-root">
          <ul className="-mb-8">
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              const timeAgo = formatDistanceToNow(new Date(item.date), { addSuffix: true })

              return (
                <li key={item.id}>
                  <div className={`relative ${isLast ? '' : 'pb-8'}`}>
                    {!isLast && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-border"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div>
                        <div className="relative px-1">
                          <div
                            className={`h-8 w-8 ${getTypeColor(
                              item.type,
                            )} rounded-full ring-8 ring-background flex items-center justify-center text-white`}
                          >
                            {getTypeIcon(item.type)}
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 py-0">
                        <div className="text-md text-muted-foreground">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href="#" className="font-medium text-foreground mr-2">
                              {item.version}
                            </a>
                            <Badge
                              variant="outline"
                              className="my-0.5 relative inline-flex items-center bg-background rounded-full border px-3 py-0.5 text-sm"
                            >
                              <div className="absolute flex-shrink-0 flex items-center justify-center">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${getTypeColor(
                                    item.type,
                                  )}`}
                                  aria-hidden="true"
                                />
                              </div>
                              <div className="ml-3.5 font-medium text-foreground">
                                {item.type}
                              </div>
                            </Badge>
                            <span className="whitespace-nowrap text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {timeAgo}
                            </span>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                className="ml-auto text-destructive hover:text-destructive"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-foreground">
                          <p className="font-semibold mb-1">{item.title}</p>
                          <p className="text-sm whitespace-pre-line">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

