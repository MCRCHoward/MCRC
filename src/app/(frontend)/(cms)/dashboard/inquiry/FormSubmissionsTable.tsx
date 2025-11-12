'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { markSubmissionAsReviewed, markSubmissionAsUnreviewed } from './submission-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import { encodeDocPath } from '@/utilities/encodeDocPath'
import type { SubmissionRow } from '@/lib/listSubmissions'

interface FormSubmissionsTableProps {
  submissions: SubmissionRow[]
  hasMore?: boolean
  currentPage?: number
}

type FormTypeFilter =
  | 'all'
  | 'Mediation Self Referral'
  | 'Group Facilitation Inquiry'
  | 'Restorative Program Referral'
  | 'Community Education Training Request'
type ReviewFilter = 'all' | 'new' | 'reviewed'

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  } catch {
    toast.error('Failed to copy to clipboard')
  }
}

/**
 * Export submissions to CSV
 */
function exportToCSV(submissions: SubmissionRow[]) {
  const headers = [
    'ID',
    'Form Type',
    'Name',
    'Email',
    'Phone',
    'Submission Date',
    'Reviewed',
    'Reviewed Date',
    'Original Document Path',
  ]

  const rows = submissions.map((submission) => [
    submission.id,
    submission.formType,
    submission.name,
    submission.email || '',
    submission.phone || '',
    submission.submittedAt.toISOString(),
    submission.reviewed ? 'Yes' : 'No',
    submission.reviewedAt?.toISOString() || '',
    submission.originalDocPath,
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `form-submissions_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Submissions exported to CSV')
}

export function FormSubmissionsTable({
  submissions: initialSubmissions,
  hasMore = false,
  currentPage = 1,
}: FormSubmissionsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [formTypeFilter, setFormTypeFilter] = useState<FormTypeFilter>('all')
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = initialSubmissions

    // Filter by form type
    if (formTypeFilter !== 'all') {
      filtered = filtered.filter((submission) => submission.formType === formTypeFilter)
    }

    // Filter by review status
    if (reviewFilter === 'new') {
      filtered = filtered.filter((submission) => !submission.reviewed)
    } else if (reviewFilter === 'reviewed') {
      filtered = filtered.filter((submission) => submission.reviewed)
    }

    // Filter by search query (fuzzy search on name/email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (submission) =>
          submission.name.toLowerCase().includes(query) ||
          (submission.email && submission.email.toLowerCase().includes(query)) ||
          (submission.phone && submission.phone.includes(query)) ||
          submission.formType.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [initialSubmissions, formTypeFilter, reviewFilter, searchQuery])

  const handleCopy = async (text: string, label: string, id: string) => {
    await copyToClipboard(text, label)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleReviewed = async (submission: SubmissionRow) => {
    setProcessingIds((prev) => new Set(prev).add(submission.id))
    try {
      if (submission.reviewed) {
        await markSubmissionAsUnreviewed(submission.originalDocPath)
        toast.success('Marked as unreviewed')
      } else {
        await markSubmissionAsReviewed(submission.originalDocPath)
        toast.success('Marked as reviewed')
      }
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update review status. Please try again.'
      toast.error(errorMessage)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(submission.id)
        return next
      })
    }
  }

  if (initialSubmissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No form submissions found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or form type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={formTypeFilter}
          onValueChange={(value) => setFormTypeFilter(value as FormTypeFilter)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by form type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Form Types</SelectItem>
            <SelectItem value="Mediation Self Referral">Mediation Self Referral</SelectItem>
            <SelectItem value="Group Facilitation Inquiry">Group Facilitation Inquiry</SelectItem>
            <SelectItem value="Restorative Program Referral">
              Restorative Program Referral
            </SelectItem>
            <SelectItem value="Community Education Training Request">
              Community Education Training Request
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={reviewFilter}
          onValueChange={(value) => setReviewFilter(value as ReviewFilter)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportToCSV(filteredSubmissions)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Form Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No submissions match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => {
                const isCopied = copiedId === submission.id

                return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Badge variant="secondary">{submission.formType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{submission.name}</div>
                    </TableCell>
                    <TableCell>
                      {submission.email ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{submission.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(submission.email!, 'Email', submission.id)}
                            title="Copy email"
                          >
                            {isCopied && copiedId === submission.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{submission.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopy(submission.phone!, 'Phone', submission.id)}
                            title="Copy phone"
                          >
                            {isCopied && copiedId === submission.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTimeShort(submission.submittedAt.toISOString())}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={submission.reviewed ? 'default' : 'secondary'}>
                          {submission.reviewed ? 'Reviewed' : 'New'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleToggleReviewed(submission)}
                          disabled={processingIds.has(submission.id)}
                          title={submission.reviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
                        >
                          {processingIds.has(submission.id) ? (
                            <Circle className="h-3 w-3 animate-pulse" />
                          ) : submission.reviewed ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/dashboard/inquiry/${encodeDocPath(submission.originalDocPath)}`}
                        >
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count and Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredSubmissions.length} of {initialSubmissions.length} submissions
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              if (currentPage > 2) {
                params.set('page', String(currentPage - 1))
              } else {
                params.delete('page')
              }
              router.push(`/dashboard/inquiry?${params.toString()}`)
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground px-3">Page {currentPage}</div>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(currentPage + 1))
              router.push(`/dashboard/inquiry?${params.toString()}`)
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
