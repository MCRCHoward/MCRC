import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Activity Log"
      description="We will surface recent mediation tasks, notes, and automations shortly."
    />
  )
}

