import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSubmissionsTable } from './FormSubmissionsTable'
import { listRecentSubmissions } from '@/lib/listSubmissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Get form type counts from submissions
 */
function getFormTypeCounts(submissions: Awaited<ReturnType<typeof listRecentSubmissions>>['submissions']) {
  const counts: Record<string, number> = {}
  submissions.forEach((submission) => {
    counts[submission.formType] = (counts[submission.formType] || 0) + 1
  })
  return counts
}

export default async function InquiryPage() {
  let submissionsResult
  let error: string | null = null

  try {
    submissionsResult = await listRecentSubmissions(10)
  } catch (err) {
    console.error('[InquiryPage] Error fetching submissions:', err)
    error = err instanceof Error ? err.message : 'Failed to load submissions'
    submissionsResult = { submissions: [], pagination: { hasMore: false } }
  }

  const submissions = submissionsResult.submissions
  const formTypeCounts = getFormTypeCounts(submissions)
  const newCount = submissions.filter((s) => !s.reviewed).length
  const reviewedCount = submissions.filter((s) => s.reviewed).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-muted-foreground">View and manage all form submissions</p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-sm text-destructive">
              <p className="font-semibold">Error loading submissions</p>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">Recent submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
            <p className="text-xs text-muted-foreground">Unreviewed submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewedCount}</div>
            <p className="text-xs text-muted-foreground">Reviewed submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Form Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(formTypeCounts).length}</div>
            <p className="text-xs text-muted-foreground">Different form types</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Type Breakdown */}
      {Object.keys(formTypeCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Form Type</CardTitle>
            <CardDescription>Breakdown of recent submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(formTypeCounts).map(([formType, count]) => (
                <div key={formType} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{formType}</span>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Top 10 most recent form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSubmissionsTable submissions={submissions} />
        </CardContent>
      </Card>
    </div>
  )
}
