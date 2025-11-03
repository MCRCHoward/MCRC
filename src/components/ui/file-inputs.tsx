'use client'

import { cn } from '@/lib/utils'
import { FileIcon, Trash2, Upload } from 'lucide-react'
import * as React from 'react'
import { Button } from './button'

interface FileInputProps {
  className?: string
  value?: File | null
  onChange?: (file: File | null) => void
  disabled?: boolean
  accept?: string
  // Optional max size in megabytes; if provided, files larger than this are rejected
  maxSizeMB?: number
  // Optional error callback for validation failures
  onError?: (message: string) => void
}

const FileInput = ({
  className,
  value,
  onChange,
  disabled,
  accept = '*',
  maxSizeMB,
  onError,
}: FileInputProps) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelection = (file: File | null) => {
    if (!disabled) onChange?.(file)
  }

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isOver: boolean) => {
    e.preventDefault()
    if (!disabled) setIsDragging(isOver)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (!disabled) {
      const file = e.dataTransfer.files?.[0] ?? null
      if (file && maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`File exceeds maximum size of ${maxSizeMB} MB`)
        return
      }
      handleFileSelection(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file && maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      onError?.(`File exceeds maximum size of ${maxSizeMB} MB`)
      return
    }
    handleFileSelection(file)
  }

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleFileSelection(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.dataTransfer.dropEffect = 'copy'
          handleDragEvents(e, true)
        }}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-md border border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:bg-muted/50',
          isDragging && 'border-muted-foreground/50 bg-muted/50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        aria-label={value ? `Selected file ${value.name}` : 'Upload file'}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span> or drag and drop
          </p>
        </div>
      </div>
      {value && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
          <div className="rounded-md bg-background p-2">
            <FileIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={handleRemove}
            className="flex-none size-8"
          >
            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  )
}

export { FileInput }
