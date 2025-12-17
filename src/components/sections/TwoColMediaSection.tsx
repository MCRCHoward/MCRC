'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from '@/utilities/ui'

export interface BulletPoint {
  /** Optional unique identifier */
  id?: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Bullet point text */
  text: string
}

export interface TwoColMediaSectionProps {
  /** Section title */
  title: string
  /** Section subtitle/description */
  subtitle: string
  /** Array of bullet points with icons */
  bulletPoints: BulletPoint[]
  /** Media configuration (image or video) */
  media: {
    type: 'image' | 'video'
    src: string
    alt: string
    poster?: string // For video poster image
  }
  /** Additional className for the section */
  className?: string
}

export function TwoColMediaSection({
  title,
  subtitle,
  bulletPoints,
  media,
  className,
}: TwoColMediaSectionProps) {
  // Animation variants
  const titleVariants = {
    hidden: {
      opacity: 0,
      x: -30,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    },
  }

  const subtitleVariants = {
    hidden: {
      opacity: 0,
      x: -30,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: 0.1,
        ease: [0.25, 0.4, 0.25, 1] as const,
      },
    },
  }

  const bulletContainerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const bulletItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
      },
    },
  }

  return (
    <section className={cn('bg-blue overflow-hidden', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left Column - Content */}
        <div className="px-6 md:px-12 py-12 md:py-16 flex flex-col justify-center">
          <div className="max-w-2xl">
            {/* Title */}
            <motion.h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary mb-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={titleVariants}
            >
              {title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-blue-foreground mb-8 md:mb-12 leading-relaxed"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={subtitleVariants}
            >
              {subtitle}
            </motion.p>

            {/* Bullet Points */}
            <motion.ul
              className="space-y-4 md:space-y-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={bulletContainerVariants}
            >
              {bulletPoints.map((bullet, index) => {
                const IconComponent = bullet.icon
                const bulletId = bullet.id || `bullet-${index}`

                return (
                  <motion.li
                    key={bulletId}
                    className="flex items-start gap-4"
                    variants={bulletItemVariants}
                  >
                    {/* Icon Circle */}
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <IconComponent
                        className="w-5 h-5 md:w-6 md:h-6 text-secondary"
                        aria-hidden="true"
                      />
                    </div>

                    {/* Bullet Text */}
                    <p className="text-base md:text-lg text-blue-foreground leading-relaxed pt-2">
                      {bullet.text}
                    </p>
                  </motion.li>
                )
              })}
            </motion.ul>
          </div>
        </div>

        {/* Right Column - Media */}
        <div className="relative min-h-[400px] lg:min-h-0">
          {media.type === 'video' ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={media.poster}
              className="w-full h-full object-cover"
              aria-label={media.alt}
            >
              <source src={media.src} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          )}
        </div>
      </div>
    </section>
  )
}

