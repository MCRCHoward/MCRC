import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getInquiryById } from '@/lib/actions/inquiry-actions'
import { InquiryDetailCard } from '@/components/Dashboard/Inquiries/InquiryDetailCard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

export default async function MediationInquiryDetailPage({ params }: RouteParams) {
  const { id } = await params
  const inquiry = await getInquiryById('mediation', id)

  if (!inquiry) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mediation Inquiry Details</h1>
        <p className="text-muted-foreground">View full inquiry submission details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiry #{id.slice(0, 8)}</CardTitle>
          <CardDescription>Submitted on {new Date(inquiry.submittedAt).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <InquiryDetailCard inquiry={inquiry} serviceArea="mediation" />
        </CardContent>
      </Card>
    </div>
  )
}

