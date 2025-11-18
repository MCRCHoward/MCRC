import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function MediationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Mediation'
      stageName='Scheduling'
      description='Automation hooks for matching mediators and booking sessions will appear here.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Scheduling"
      summary="Monitor Calendly bookings and follow-ups for mediation cases."
      description="This screen will visualize upcoming intake calls, no-shows, and automated reminders that originate from the shared Calendly workflows."
      nextSteps="Once Calendly webhook data is replicated locally, we will populate this view with real-time availability and escalation cues."
    />
  )
}

