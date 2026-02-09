import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/custom-auth'
import { fetchPaperIntakeHistory } from '@/lib/actions/paper-intake-actions'
import { PaperIntakeHistoryTable } from '@/components/Dashboard/DataEntry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function PaperIntakeHistoryPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all intakes
  const result = await fetchPaperIntakeHistory()
  const intakes = result.intakes || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <History className="h-8 w-8" aria-hidden="true" />
            Paper Intake History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all digitized paper intake entries
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mediation/data-entry">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Data Entry
          </Link>
        </Button>
      </div>

      {/* History Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Entry History</CardTitle>
          <CardDescription>
            All paper intake entries with sync status and Insightly links. Click any row to expand
            details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaperIntakeHistoryTable intakes={intakes} />
        </CardContent>
      </Card>
    </div>
  )
}
