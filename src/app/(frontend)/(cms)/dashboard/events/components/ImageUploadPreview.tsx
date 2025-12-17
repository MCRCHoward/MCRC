'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/utilities/ui'
import Image from 'next/image'

interface ImageUploadPreviewProps {
  value?: File | string
  onChange: (file: File | undefined) => void
  onUpload?: (file: File) => Promise<string | undefined>
  existingUrl?: string
  className?: string
  maxSize?: number // in MB
  recommendedSize?: { width: number; height: number }
}

export function ImageUploadPreview({
  value,
  onChange,
  onUpload,
  existingUrl,
  className,
  maxSize = 5,
  recommendedSize = { width: 1200, height: 630 },
}: ImageUploadPreviewProps) {
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)
  const dragCounterRef = React.useRef(0)

  // Manage object URL for File objects
  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value)
      setObjectUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      // Clean up object URL when value is no longer a File
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        setObjectUrl(null)
      }
    }
  }, [value])

  // Cleanup object URL on unmount
  React.useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [objectUrl])

  // Handle file selection
  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setError(null)

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File must be an image')
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.onerror = () => {
        setError('Failed to read image file')
      }
      reader.readAsDataURL(file)

      // Upload if handler provided
      if (onUpload) {
        setIsUploading(true)
        setUploadProgress(0)
        try {
          // Simulate progress (in real implementation, use XMLHttpRequest with progress events)
          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
              if (prev >= 90) {
                clearInterval(progressInterval)
                return 90
              }
              return prev + 10
            })
          }, 200)

          const uploadedUrl = await onUpload(file)
          clearInterval(progressInterval)
          setUploadProgress(100)
          if (uploadedUrl) {
            onChange(file)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed')
          setPreview(null)
        } finally {
          setIsUploading(false)
          setTimeout(() => setUploadProgress(0), 1000)
        }
      } else {
        onChange(file)
      }
    },
    [maxSize, onUpload, onChange],
  )

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = React.useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onDrop([file])
      // Reset input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    dragCounterRef.current = 0
    const file = e.dataTransfer.files[0]
    if (file) {
      onDrop([file])
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(undefined)
    setError(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = React.useMemo(() => {
    if (preview) return preview
    if (value instanceof File && objectUrl) {
      return objectUrl
    }
    if (typeof value === 'string') return value
    if (existingUrl) return existingUrl
    return null
  }, [preview, value, existingUrl, objectUrl])

  return (
    <div className={cn('space-y-4', className)}>
      {displayUrl ? (
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={displayUrl}
              alt="Event preview"
              fill
              className="object-cover"
              unoptimized={value instanceof File || displayUrl.startsWith('blob:')}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {value instanceof File && (
            <div className="mt-2 text-sm text-muted-foreground">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload event image"
          aria-describedby="upload-instructions"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          className={cn(
            'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isDragActive && 'border-primary bg-primary/5',
            !isDragActive && 'border-muted-foreground/25 hover:border-muted-foreground/50',
            isUploading && 'pointer-events-none opacity-50 cursor-not-allowed',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
            aria-label="Event image file input"
          />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <div className="text-center" id="upload-instructions">
                  <span className="text-sm font-medium">
                    {isDragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to {maxSize}MB
                  </p>
                  {recommendedSize && (
                    <p className="text-xs text-muted-foreground">
                      Recommended: {recommendedSize.width}×{recommendedSize.height}px
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isUploading && uploadProgress > 0 && (
        <div className="space-y-1">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  )
}

