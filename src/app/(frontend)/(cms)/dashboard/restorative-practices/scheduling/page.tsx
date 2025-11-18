import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function RestorativePracticesSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Restorative Practices'
      stageName='Scheduling'
      description='Scheduling flows for circles and conferences will land on this page.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function RestorativePracticesSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Restorative Practices"
      stageName="Scheduling"
      summary="Coordinate prep calls, circles, and follow-ups for restorative cases."
      description="Calendar integrations and facilitator assignments will land here so we can confirm every circle has the right mix of staff, volunteers, and community partners."
      nextSteps="Scheduling UX to be defined once cross-program calendaring is finalized."
    />
  )
}

