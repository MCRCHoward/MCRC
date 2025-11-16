import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 text-center',
        className,
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-muted-foreground">{description}</p>
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild variant="outline">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

