import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function MediationDashboardPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Mediation"
      stageName="Overview"
      description="High-level overview for the mediation pipeline. We’ll connect live data soon."
    />
  )
}

