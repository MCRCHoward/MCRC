import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function RestorativePracticesSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Restorative Practices"
      stageName="Scheduling"
      description="Scheduling flows for circles and conferences will land on this page."
    />
  )
}

