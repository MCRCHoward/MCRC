'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/utilities/ui'

export interface ValueCard {
  /** Optional unique identifier for the card */
  id?: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Background color for the icon circle (Tailwind class) */
  iconBgColor: string
  /** Title text */
  title: string
  /** Description text */
  description: string
}

export interface ValueCardsGridProps {
  /** Array of value cards to display */
  cards: ValueCard[]
  /** Optional section title */
  title?: string
  /** Optional section subtitle */
  subtitle?: string
  /** Text alignment for title and subtitle */
  alignment?: 'center' | 'left' | 'right'
  /** Maximum width for expanded cards in bottom row (e.g., '600px') */
  maxCardWidth?: string
  /** Additional className for the section */
  className?: string
}

export function ValueCardsGrid({
  cards,
  title,
  subtitle,
  alignment = 'center',
  maxCardWidth = '600px',
  className,
}: ValueCardsGridProps) {
  // Calculate last row for expansion logic
  const totalCards = cards.length
  const lastRowCount = totalCards % 3 || 3
  const lastRowStartIndex = totalCards - lastRowCount

  // Alignment classes
  const alignmentClasses = {
    center: 'text-center mx-auto',
    left: 'text-left',
    right: 'text-right ml-auto',
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const titleVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1] as const, // Custom cubic-bezier for smooth easing
      },
    },
  }

  const subtitleVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.4, 0.25, 1] as const,
        delay: 0.1, // Slight delay after title
      },
    },
  }

  return (
    <section className={cn('bg-white py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Optional Header */}
        {(title || subtitle) && (
          <motion.div
            className={cn('max-w-3xl mb-12 md:mb-16', alignmentClasses[alignment])}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            {title && (
              <motion.h2
                className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
                variants={titleVariants}
              >
                {title}
              </motion.h2>
            )}
            {subtitle && (
              <motion.p
                className="text-lg text-slate-600 leading-relaxed"
                variants={subtitleVariants}
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, index) => {
            const IconComponent = card.icon
            const isLastRow = index >= lastRowStartIndex
            const shouldExpand = isLastRow && lastRowCount < 3
            const cardId = card.id || `value-card-${index}`

            // Skip rendering for 2-item bottom row items here (we'll render them in a wrapper below)
            if (shouldExpand && lastRowCount === 2 && index >= lastRowStartIndex) {
              return null
            }

            return (
              <article
                key={card.id || card.title}
                id={cardId}
                className={cn(
                  'bg-gray-50 rounded-2xl p-6 md:p-8 transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-1',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                  // Single item bottom row expansion
                  shouldExpand && lastRowCount === 1 && 'lg:col-span-3',
                  // Apply max-width constraint for single expanded items
                  shouldExpand && lastRowCount === 1 && `lg:mx-auto lg:w-full`,
                  shouldExpand &&
                    lastRowCount === 1 &&
                    maxCardWidth &&
                    `lg:max-w-[${maxCardWidth}]`,
                )}
                tabIndex={0}
                aria-labelledby={`${cardId}-title`}
                aria-describedby={`${cardId}-description`}
              >
                {/* Icon Circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center mb-4',
                    card.iconBgColor,
                  )}
                >
                  <IconComponent className="w-6 h-6 text-slate-800" aria-hidden="true" />
                </div>

                {/* Title */}
                <h3
                  id={`${cardId}-title`}
                  className="text-lg md:text-xl font-semibold text-slate-900 mb-3"
                >
                  {card.title}
                </h3>

                {/* Description */}
                <p
                  id={`${cardId}-description`}
                  className="text-sm md:text-base text-slate-600 leading-relaxed"
                >
                  {card.description}
                </p>
              </article>
            )
          })}

          {/* Handle 2-item bottom row with wrapper */}
          {lastRowCount === 2 && (
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {cards.slice(lastRowStartIndex).map((card, index) => {
                const IconComponent = card.icon
                const actualIndex = lastRowStartIndex + index
                const cardId = card.id || `value-card-${actualIndex}`

                return (
                  <article
                    key={card.id || card.title}
                    id={cardId}
                    className={cn(
                      'bg-gray-50 rounded-2xl p-6 md:p-8 transition-all duration-300',
                      'hover:shadow-lg hover:-translate-y-1',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                      // Apply max-width constraint
                      maxCardWidth && `max-w-[${maxCardWidth}] mx-auto w-full`,
                    )}
                    tabIndex={0}
                    aria-labelledby={`${cardId}-title`}
                    aria-describedby={`${cardId}-description`}
                  >
                    {/* Icon Circle */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center mb-4',
                        card.iconBgColor,
                      )}
                    >
                      <IconComponent className="w-6 h-6 text-slate-800" aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h3
                      id={`${cardId}-title`}
                      className="text-lg md:text-xl font-semibold text-slate-900 mb-3"
                    >
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p
                      id={`${cardId}-description`}
                      className="text-sm md:text-base text-slate-600 leading-relaxed"
                    >
                      {card.description}
                    </p>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
