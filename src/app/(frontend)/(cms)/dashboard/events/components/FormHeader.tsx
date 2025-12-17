'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Eye, Save, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utilities/ui'

interface FormHeaderProps {
  title: string
  status?: 'draft' | 'published'
  lastSaved?: Date
  isSaving?: boolean
  isDirty?: boolean
  onPreview?: () => void
  onSaveDraft?: () => void
  backHref?: string
  className?: string
}

export function FormHeader({
  title,
  status,
  lastSaved,
  isSaving = false,
  isDirty = false,
  onPreview,
  onSaveDraft,
  backHref = '/dashboard/events',
  className,
}: FormHeaderProps) {
  const router = useRouter()

  const formatTime = (date?: Date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push(backHref)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {status && (
              <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                {status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isDirty ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Saved {formatTime(lastSaved)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onPreview && (
          <Button type="button" variant="outline" size="sm" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        )}
        {onSaveDraft && (
          <Button type="button" variant="outline" size="sm" onClick={onSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
        )}
      </div>
    </div>
  )
}

