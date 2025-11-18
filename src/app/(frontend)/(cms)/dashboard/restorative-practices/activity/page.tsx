import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function RestorativePracticesActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Restorative Practices'
      stageName='Activity Log'
      description='We will log upcoming restorative practice tasks, notes, and alerts here.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function RestorativePracticesActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Restorative Practices"
      stageName="Activity Log"
      summary="See the running log of commitments for restorative practice partners."
      description="Once the shared activity feed supports service filters, this page will display timeline events and next steps tailored to restorative program leads."
      nextSteps="Implementation blocked on activity feed filtering—tracked in Phase 2."
    />
  )
}

