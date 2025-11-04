'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import type { Media as MediaType } from '@/types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

interface OptimizedVideoPlayerProps {
  resource: MediaType | string | null
  poster?: string
  className?: string
  onClick?: () => void
}

export function OptimizedVideoPlayer({ resource, poster, className }: OptimizedVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const containerNode = containerRef.current
    if (!containerNode) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true)
          observer.unobserve(containerNode)
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(containerNode)

    return () => {
      observer.unobserve(containerNode)
    }
  }, [])

  if (!resource) {
    return null
  }

  let videoUrl: string
  let posterUrl: string | undefined
  let mimeType = 'video/mp4'

  if (typeof resource === 'object' && resource !== null) {
    videoUrl = getMediaUrl(resource.url)
    posterUrl = poster || getMediaUrl(resource.url)
    mimeType = resource.mimeType || 'video/mp4'
  } else {
    videoUrl = resource
    posterUrl = poster
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full aspect-video overflow-hidden rounded-lg bg-black', className)}
    >
      {/* This video will only render when it's near the viewport. Once rendered,
        the `autoPlay`, `muted`, and `loop` attributes will cause it to play immediately.
      */}
      {isInView ? (
        <video
          className="h-full w-full object-cover"
          poster={posterUrl}
          autoPlay
          muted
          loop
          playsInline // Important for mobile browsers
          preload="metadata"
          controls={false} // Hide default browser controls
        >
          <source src={videoUrl} type={mimeType} />
          Your browser does not support the video tag.
        </video>
      ) : (
        // Show the poster image as a placeholder before the video loads
        posterUrl && (
          <Image
            src={posterUrl}
            alt={typeof resource === 'object' ? resource.alt || 'Video poster' : 'Video poster'}
            fill
            className="object-cover"
            priority // Load the poster image quickly
          />
        )
      )}
    </div>
  )
}
