import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Scheduling"
      description="Calendly and staffing workflows for facilitation will be wired in here soon."
    />
  )
}

