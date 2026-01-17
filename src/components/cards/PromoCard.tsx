import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface PromoCardProps {
  // Challenge level
  challengeLevel?: number // 1-5, displays filled squares

  // Left column - Main content
  title: string
  duration: string
  cost: string
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void

  // Middle column - Illustration
  illustration?: ReactNode

  // Right column - Info blocks
  jobTitle?: string
  jobDescription?: string
  skillset?: string[]
  outcomeLabel?: string
  outcomeValue?: string

  // Styling
  className?: string
}

export default function PromoCard({
  challengeLevel = 3,
  title,
  duration,
  cost,
  ctaText = 'Learn more',
  ctaHref,
  onCtaClick,
  illustration,
  jobTitle,
  jobDescription,
  skillset,
  outcomeLabel,
  outcomeValue,
  className,
}: PromoCardProps) {
  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick()
    } else if (ctaHref) {
      window.location.href = ctaHref
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-[1200px] mx-auto',
        'h-auto min-h-[280px]',
        'bg-neutral-50',
        'rounded-3xl',
        'p-8 md:p-10',
        'border border-neutral-200/50',
        'shadow-sm',
        className,
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center h-full">
        {/* Left Column - Main Content (45-50%) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full">
          {/* Challenge Level */}
          {challengeLevel > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs md:text-sm font-medium text-neutral-500 uppercase tracking-wide">
                Challenge level
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={cn(
                      'w-4 h-4 md:w-5 md:h-5',
                      'rounded-sm',
                      'transition-colors',
                      level <= challengeLevel ? 'bg-neutral-900' : 'bg-neutral-300',
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Primary Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-[1.1] mb-6">
            {title}
          </h2>

          {/* Key Stats */}
          <div className="flex items-center gap-6 mb-8 text-base md:text-lg text-neutral-800">
            <span className="font-medium">{duration}</span>
            <span className="font-bold">{cost}</span>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCtaClick}
            className={cn(
              'self-start',
              'px-6 md:px-8 py-3',
              'rounded-full',
              'bg-orange-400 hover:bg-orange-500',
              'text-neutral-900 font-semibold text-sm md:text-base',
              'transition-colors duration-200',
              'shadow-sm hover:shadow-md',
            )}
          >
            {ctaText}
          </button>
        </div>

        {/* Middle Column - Illustration (20-25%) */}
        {illustration && (
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="w-full max-w-[260px] mx-auto">{illustration}</div>
          </div>
        )}

        {/* Right Column - Info Blocks (30-35%) */}
        <div
          className={cn(
            'lg:col-span-4 flex flex-col gap-5',
            !illustration && 'lg:col-span-7', // Take more space if no illustration
          )}
        >
          {/* Block 1: Job Title */}
          {jobTitle && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-neutral-900 mb-2">Description</h3>
              <p className="text-sm md:text-base text-neutral-700 leading-relaxed">{jobTitle}</p>
              {jobDescription && (
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{jobDescription}</p>
              )}
            </div>
          )}

          {/* Block 2: Skillset */}
          {skillset && skillset.length > 0 && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-neutral-900 mb-2">Requirements</h3>
              <p className="text-sm md:text-base text-neutral-700 leading-relaxed">
                {skillset.join(', ')}
              </p>
            </div>
          )}

          {/* Block 3: Outcome Metric */}
          {outcomeValue && (
            <div>
              <h3 className="text-sm md:text-base font-bold text-neutral-900 mb-2">
                {outcomeLabel}
              </h3>
              <p className="text-base md:text-lg font-bold text-neutral-900">{outcomeValue}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
