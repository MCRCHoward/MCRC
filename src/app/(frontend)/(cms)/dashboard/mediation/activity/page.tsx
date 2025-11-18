import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function MediationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Mediation'
      stageName='Activity Log'
      description='We will surface recent mediation tasks, notes, and automations shortly.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Activity Log"
      summary="Review every automated task and timeline event tied to mediation cases."
      description="We will plug the existing task + activity feeds into this dedicated view so staff can audit the case history without pivoting between tabs."
      nextSteps="TBD after the activity feed API is finalized for multi-service filtering."
    />
  )
}

