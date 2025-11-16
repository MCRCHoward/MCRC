import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getInquiryById } from '@/lib/actions/inquiry-actions'
import { InquiryDetailCard } from '@/components/Dashboard/Inquiries/InquiryDetailCard'
import { formatDate } from '@/utilities/formatDateTime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

export default async function RestorativePracticesInquiryDetailPage({ params }: RouteParams) {
  const { id } = await params
  const inquiry = await getInquiryById('restorativePractices', id)

  if (!inquiry) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Restorative Practices Inquiry Details</h1>
        <p className="text-muted-foreground">View full inquiry submission details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiry #{id.slice(0, 8)}</CardTitle>
          <CardDescription>Submitted on {formatDate(inquiry.submittedAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <InquiryDetailCard inquiry={inquiry} serviceArea="restorativePractices" />
        </CardContent>
      </Card>
    </div>
  )
}

