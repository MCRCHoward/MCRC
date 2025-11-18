import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Activity Log"
      description="Recent facilitation touches, reminders, and automations will show here."
    />
  )
}

