import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconIllustrationProps {
  icon: LucideIcon
  size?: 'sm' | 'md' | 'lg'
  color?: string
  backgroundColor?: string
  showBackground?: boolean
  strokeWidth?: number
  ariaLabel?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-[100px] h-[100px] md:w-[120px] md:h-[120px]',
  md: 'w-[120px] h-[120px] md:w-[160px] md:h-[160px]',
  lg: 'w-[140px] h-[140px] md:w-[200px] md:h-[200px]',
}

export function IconIllustration({
  icon: Icon,
  size = 'md',
  color = 'text-neutral-700',
  backgroundColor = 'bg-rose-100',
  showBackground = true,
  strokeWidth = 1.5,
  ariaLabel,
  className,
}: IconIllustrationProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label={ariaLabel || 'Illustration'}
    >
      {/* Background Circle with offset */}
      {showBackground && (
        <div
          className={cn(
            'absolute rounded-full translate-x-5 translate-y-5 z-0',
            sizeClasses[size],
            backgroundColor,
          )}
          aria-hidden="true"
        />
      )}
      
      {/* Icon in front */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <Icon
          className={cn('w-full h-full', color)}
          strokeWidth={strokeWidth}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
