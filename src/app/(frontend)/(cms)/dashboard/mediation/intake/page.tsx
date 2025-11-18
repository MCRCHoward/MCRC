import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function MediationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Mediation'
      stageName='Intake Queue'
      description='This placeholder will track new mediation inquiries as they move through intake triage.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Intake Queue"
      summary="Track new mediation submissions that still need coordinator review."
      description="We will surface the intake questionnaire, triage metadata, and assignment controls here so coordinators can move each case through the funnel without leaving the dashboard."
      nextSteps="This placeholder keeps the route live while we finalize the intake triage data model for Phase 2."
    />
  )
}

