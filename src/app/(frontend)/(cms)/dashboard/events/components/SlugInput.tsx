'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Edit2, Lock, Globe } from 'lucide-react'
import { cn } from '@/utilities/ui'

interface SlugInputProps {
  value: string
  onChange: (value: string) => void
  title: string
  baseUrl?: string
  className?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export function SlugInput({
  value,
  onChange,
  title,
  baseUrl = 'mcrchoward.org',
  className,
}: SlugInputProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    if (!isEditing && title) {
      const newSlug = slugify(title)
      setLocalValue(newSlug)
      onChange(newSlug)
    }
  }, [title, isEditing, onChange])

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleToggle = () => {
    if (isEditing) {
      // Save the manual edit
      onChange(localValue)
    }
    setIsEditing(!isEditing)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Only allow lowercase, numbers, and hyphens
    const sanitized = newValue
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '')
    setLocalValue(sanitized)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="slug-input">URL Slug</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8"
        >
          {isEditing ? (
            <>
              <Lock className="mr-2 h-3 w-3" />
              Lock
            </>
          ) : (
            <>
              <Edit2 className="mr-2 h-3 w-3" />
              Edit
            </>
          )}
        </Button>
      </div>
      <div className="space-y-1">
        <Input
          id="slug-input"
          value={localValue}
          onChange={handleChange}
          disabled={!isEditing}
          placeholder="event-slug"
          className="font-mono"
        />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          <span>
            {baseUrl}/events/{localValue || 'event-slug'}
          </span>
        </div>
      </div>
    </div>
  )
}

