import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DonationDetailClient } from './DonationDetailClient'
import { formatPaymentAmount } from '@/utilities/payment-helpers'
import { formatDateTimeShort } from '@/utilities/formatDateTime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

async function getDonationById(donationId: string) {
  try {
    const snapshot = await adminDb.doc(`donations/${donationId}`).get()

    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data()

    const toISOString = (value: unknown): string | undefined => {
      if (!value) return undefined
      if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }
      if (typeof value === 'string') return value
      return undefined
    }

    return {
      id: snapshot.id,
      amount: data?.amount || 0,
      currency: data?.currency || 'USD',
      frequency: data?.frequency || 'one-time',
      donorName: data?.donorName || '',
      donorEmail: data?.donorEmail || '',
      donorPhone: data?.donorPhone,
      emailMarketingConsent: Boolean(data?.emailMarketingConsent),
      paymentId: data?.paymentId || '',
      paymentStatus: data?.paymentStatus || 'completed',
      paymentDate: toISOString(data?.paymentDate),
      donationDate: toISOString(data?.donationDate),
      notes: data?.notes,
      createdAt: toISOString(data?.createdAt),
      updatedAt: toISOString(data?.updatedAt),
    }
  } catch (error) {
    console.error('[getDonationById] Error:', error)
    return null
  }
}

export default async function DonationDetailPage({ params }: RouteParams) {
  const { id } = await params
  const donation = await getDonationById(id)

  if (!donation) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/donations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Donations
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donation Details</h1>
          <p className="text-muted-foreground">View and manage donation information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Donation Information */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Information</CardTitle>
            <CardDescription>Payment and donation details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-lg font-semibold">{formatPaymentAmount(donation.amount, donation.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <Badge variant={donation.frequency === 'one-time' ? 'secondary' : 'default'}>
                  {donation.frequency === 'one-time' ? 'One-Time' : 'Monthly'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Badge
                  variant={
                    donation.paymentStatus === 'completed'
                      ? 'default'
                      : donation.paymentStatus === 'pending'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {donation.paymentStatus}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Donation Date</span>
                <span className="text-sm">
                  {donation.donationDate ? formatDateTimeShort(donation.donationDate) : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Date</span>
                <span className="text-sm">
                  {donation.paymentDate ? formatDateTimeShort(donation.paymentDate) : '—'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment ID</span>
                <span className="text-xs font-mono text-muted-foreground break-all">{donation.paymentId || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Information</CardTitle>
            <CardDescription>Contact and consent details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{donation.donorName}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <a href={`mailto:${donation.donorEmail}`} className="text-sm text-primary hover:underline">
                  {donation.donorEmail}
                </a>
              </div>
              {donation.donorPhone && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <a href={`tel:${donation.donorPhone}`} className="text-sm text-primary hover:underline">
                      {donation.donorPhone}
                    </a>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email Marketing Consent</span>
                <Badge variant={donation.emailMarketingConsent ? 'default' : 'secondary'}>
                  {donation.emailMarketingConsent ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
          <CardDescription>Add internal notes about this donation</CardDescription>
        </CardHeader>
        <CardContent>
          <DonationDetailClient donationId={donation.id} initialNotes={donation.notes || ''} />
        </CardContent>
      </Card>
    </div>
  )
}

