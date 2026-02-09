import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileText, History, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/custom-auth'
import { getPaperIntakeStats } from '@/lib/actions/paper-intake-actions'
import { PaperIntakeForm } from '@/components/Dashboard/DataEntry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaperIntakeDataEntryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch stats for dashboard cards
  const statsResult = await getPaperIntakeStats()
  const stats = statsResult.stats || {
    total: 0,
    synced: 0,
    failed: 0,
    partial: 0,
    pending: 0,
  }

  const needsAttention = stats.failed + stats.partial

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paper Intake Data Entry</h1>
          <p className="text-muted-foreground mt-1">
            Digitize historical paper mediation intake forms into Insightly
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mediation/data-entry/history">
            <History className="mr-2 h-4 w-4" aria-hidden="true" />
            View History
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entered</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Paper forms digitized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Synced</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
            <p className="text-xs text-muted-foreground">In Insightly CRM</p>
          </CardContent>
        </Card>

        <Card className={needsAttention > 0 ? 'border-amber-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            {needsAttention > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${needsAttention > 0 ? 'text-amber-600' : ''}`}>
              {needsAttention}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.failed > 0 && `${stats.failed} failed`}
              {stats.failed > 0 && stats.partial > 0 && ', '}
              {stats.partial > 0 && `${stats.partial} partial`}
              {needsAttention === 0 && 'All synced successfully'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting sync</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>New Paper Intake</CardTitle>
          <CardDescription>
            Enter data from a paper mediation intake form. The form will guide you through
            duplicate checking, case details, participant information, and final review before
            syncing to Insightly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaperIntakeForm userId={user.id} userName={user.name || user.email} />
        </CardContent>
      </Card>
    </div>
  )
}
