import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export default function FacilitationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName='Facilitation'
      stageName='Scheduling'
      description='Calendly and staffing workflows for facilitation will be wired in here soon.'
    />
  )
}
import { ServicePipelinePlaceholder } from '@/components/Dashboard/ServicePipelinePlaceholder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FacilitationSchedulingPage() {
  return (
    <ServicePipelinePlaceholder
      serviceName="Facilitation"
      stageName="Scheduling"
      summary="Track consultation calls and workshop dates sourced from Calendly."
      description="Future iterations will show the facilitation staffing calendar, prep windows, and dependencies so coordinators can confirm logistics in one view."
      nextSteps="Pending integration with the shared scheduling service."
    />
  )
}

