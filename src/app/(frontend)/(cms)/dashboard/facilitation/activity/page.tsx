import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function FacilitationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Facilitation'
      stageName='Activity Log'
      description='Recent facilitation touches, reminders, and automations will show here.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Activity Log"
      summary="Audit every automation event tied to facilitation cases."
      description="We will stream the shared task + activity feed into this service-specific lens so coordinators see commitments, follow-ups, and ownership at a glance."
      nextSteps="Hooking this view into the Firestore activity feed once the filters are finished."
    />
  )
}

