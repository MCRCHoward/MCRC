import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function FacilitationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Facilitation'
      stageName='Intake Queue'
      description='Upcoming automation for triaging facilitation requests will live here.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Intake Queue"
      summary="Centralize new facilitation requests that require staff triage."
      description="This placeholder will evolve into a kanban-style queue that highlights group size, desired outcomes, and readiness so facilitators know what to scope next."
      nextSteps="Design handoff pending the facilitation questionnaire refresh."
    />
  )
}

