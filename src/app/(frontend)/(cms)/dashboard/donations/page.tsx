import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DonationsTable } from './DonationsTable'
import { formatPaymentAmount } from '@/utilities/payment-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Fetches all donations from Firestore, ordered by most recent donation date
 */
async function fetchDonations() {
  try {
    const snapshot = await adminDb
      .collection('donations')
      .orderBy('donationDate', 'desc')
      .limit(100)
      .get()

    if (snapshot.empty) {
      return []
    }

    const toISOString = (value: unknown): string | undefined => {
      if (!value) return undefined
      if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }
      if (typeof value === 'string') return value
      return undefined
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        frequency: data.frequency || 'one-time',
        donorName: data.donorName || '',
        donorEmail: data.donorEmail || '',
        donorPhone: data.donorPhone,
        emailMarketingConsent: Boolean(data.emailMarketingConsent),
        paymentId: data.paymentId || '',
        paymentStatus: data.paymentStatus || 'completed',
        paymentDate: toISOString(data.paymentDate),
        donationDate: toISOString(data.donationDate),
        notes: data.notes,
        createdAt: toISOString(data.createdAt),
        updatedAt: toISOString(data.updatedAt),
      }
    })
  } catch (error) {
    console.error('[fetchDonations] Error:', error)
    return []
  }
}

export default async function DonationsPage() {
  const donations = await fetchDonations()

  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
  const oneTimeCount = donations.filter((d) => d.frequency === 'one-time').length
  const completedCount = donations.filter((d) => d.paymentStatus === 'completed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donations</h1>
          <p className="text-muted-foreground">View and manage all donations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPaymentAmount(totalAmount, 'USD')}</div>
            <p className="text-xs text-muted-foreground">{donations.length} total donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">One-Time Gifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oneTimeCount}</div>
            <p className="text-xs text-muted-foreground">One-time donations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Donations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
          <CardDescription>View and manage donation records</CardDescription>
        </CardHeader>
        <CardContent>
          <DonationsTable donations={donations} />
        </CardContent>
      </Card>
    </div>
  )
}
