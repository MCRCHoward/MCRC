import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function MediationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Scheduling"
      description="Automation hooks for matching mediators and booking sessions will appear here."
    />
  )
}

