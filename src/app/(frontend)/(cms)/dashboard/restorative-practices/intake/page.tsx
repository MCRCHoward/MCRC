import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function RestorativePracticesIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Restorative Practices'
      stageName='Intake Queue'
      description='Capture and triage restorative practice inquiries in this upcoming module.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function RestorativePracticesIntakePage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Restorative Practices"
      stageName="Intake Queue"
      summary="Prepare restorative circles by reviewing new referrals here."
      description="Circle goals, referring partners, and readiness checks will appear in this queue so facilitators can align on scope before outreach."
      nextSteps="Awaiting final schema for restorative inquiry forms."
    />
  )
}

