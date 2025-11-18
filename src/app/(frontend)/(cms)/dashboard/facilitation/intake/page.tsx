import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Intake Queue"
      description="Upcoming automation for triaging facilitation requests will live here."
    />
  )
}

