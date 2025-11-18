import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function RestorativePracticesActivityPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Restorative Practices"
      stageName="Activity Log"
      description="We will log upcoming restorative practice tasks, notes, and alerts here."
    />
  )
}

