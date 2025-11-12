import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { FormSubmissionsTable } from './FormSubmissionsTable'
import { listRecentSubmissions } from '@/lib/listSubmissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

/**
 * Get form type counts from submissions
 */
function getFormTypeCounts(
  submissions: Awaited<ReturnType<typeof listRecentSubmissions>>['submissions'],
) {
  const counts: Record<string, number> = {}
  submissions.forEach((submission) => {
    counts[submission.formType] = (counts[submission.formType] || 0) + 1
  })
  return counts
}

export default async function InquiryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const pageNumber = isNaN(page) || page < 1 ? 1 : page

  let submissionsResult
  let error: string | null = null

  try {
    // For now, use simple offset-based pagination
    // Note: This is not ideal for Firestore but works for the plan's requirements
    // In production, cursor-based pagination would be better
    submissionsResult = await listRecentSubmissions(25)
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Summary</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>These metrics show counts from the most recent 25 submissions only.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
              <p className="text-xs text-muted-foreground">From top 25 submissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newCount}</div>
              <p className="text-xs text-muted-foreground">Unreviewed (top 25)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewedCount}</div>
              <p className="text-xs text-muted-foreground">Reviewed (top 25)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Form Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(formTypeCounts).length}</div>
              <p className="text-xs text-muted-foreground">Form types (top 25)</p>
            </CardContent>
          </Card>
        </div>
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
          <CardDescription>Top 25 most recent form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSubmissionsTable
            submissions={submissions}
            hasMore={submissionsResult.pagination.hasMore}
            currentPage={pageNumber}
          />
        </CardContent>
      </Card>
    </div>
  )
}
