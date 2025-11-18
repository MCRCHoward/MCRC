'use client'

import { Badge } from '@/components/ui/badge'
import type { InquiryStatus } from '@/types/inquiry'

interface InquiryStatusBadgeProps {
  status: InquiryStatus
}

const statusConfig: Record<
  InquiryStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  submitted: { label: 'Submitted', variant: 'default' },
  'intake-scheduled': { label: 'Intake Scheduled', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  closed: { label: 'Closed', variant: 'destructive' },
}

export function InquiryStatusBadge({ status }: InquiryStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  )
}

