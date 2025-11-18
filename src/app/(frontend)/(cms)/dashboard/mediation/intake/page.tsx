import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Intake Queue"
      description="This placeholder will track new mediation inquiries as they move through intake triage."
    />
  )
}

