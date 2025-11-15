import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchInquiries } from '@/lib/actions/inquiry-actions'
import { InquiriesTable } from '@/components/Dashboard/Inquiries/InquiriesTable'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RestorativePracticesInquiriesPage() {
  const inquiries = await fetchInquiries('restorativePractices')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Restorative Practices Inquiries</h1>
        <p className="text-muted-foreground">
          View and manage restorative practices service inquiries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
          <CardDescription>
            {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InquiriesTable inquiries={inquiries} serviceArea="restorativePractices" />
        </CardContent>
      </Card>
    </div>
  )
}

