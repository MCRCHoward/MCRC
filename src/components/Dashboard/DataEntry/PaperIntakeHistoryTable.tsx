'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table'
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Inbox,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { retrySyncPaperIntake } from '@/lib/actions/paper-intake-actions'
import type { PaperIntake, OverallSyncStatus } from '@/types/paper-intake'

interface PaperIntakeHistoryTableProps {
  intakes: PaperIntake[]
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

// =============================================================================
// Status Components
// =============================================================================

function StatusBadge({ status }: { status: OverallSyncStatus }) {
  switch (status) {
    case 'success':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
          Synced
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
          Failed
        </Badge>
      )
    case 'partial':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
          <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
          Partial
        </Badge>
      )
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
          Pending
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function SyncStatusIcon({ status }: { status: string | undefined }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Success" />
    case 'linked':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" aria-label="Linked" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" aria-label="Failed" />
    case 'skipped':
      return <span className="text-muted-foreground" aria-label="Skipped">—</span>
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" aria-label="Pending" />
  }
}

// =============================================================================
// Expanded Row Content (ENHANCEMENTS APPLIED)
// =============================================================================

function ExpandedRowContent({
  intake,
  onRetry,
  isRetrying,
}: {
  intake: PaperIntake
  onRetry: () => void
  isRetrying: boolean
}) {
  return (
    <div className="p-4 bg-muted/30 space-y-4">
      {/* Sync Status Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Participant 1 */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <SyncStatusIcon status={intake.participant1Sync?.status} />
            Participant 1 Lead
          </h4>
          {intake.participant1Sync?.leadUrl ? (
            <a
              href={intake.participant1Sync.leadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View in Insightly
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : intake.participant1Sync?.error ? (
            <p className="text-sm text-destructive">{intake.participant1Sync.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {intake.participant1Sync?.status === 'linked' ? 'Linked to existing' : 'Not synced'}
            </p>
          )}
        </div>

        {/* Participant 2 */}
        {intake.participant2 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <SyncStatusIcon status={intake.participant2Sync?.status} />
              Participant 2 Lead
            </h4>
            {intake.participant2Sync?.leadUrl ? (
              <a
                href={intake.participant2Sync.leadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View in Insightly
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : intake.participant2Sync?.error ? (
              <p className="text-sm text-destructive">{intake.participant2Sync.error}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {intake.participant2Sync?.status === 'linked'
                  ? 'Linked to existing'
                  : intake.participant2Sync?.status === 'skipped'
                    ? 'Skipped'
                    : 'Not synced'}
              </p>
            )}
          </div>
        )}

        {/* Case */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <SyncStatusIcon status={intake.caseSync?.status} />
            Case (Opportunity)
          </h4>
          {intake.caseSync?.caseUrl ? (
            <a
              href={intake.caseSync.caseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              View in Insightly
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : intake.caseSync?.error ? (
            <p className="text-sm text-destructive">{intake.caseSync.error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Not synced</p>
          )}
        </div>
      </div>

      {/* Errors */}
      {intake.syncErrors && intake.syncErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 rounded-md">
          <h4 className="font-medium text-sm text-destructive mb-2">Sync Errors</h4>
          <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
            {intake.syncErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm pt-2 border-t">
        <div>
          <span className="text-muted-foreground">Referral Source:</span>{' '}
          <span className="font-medium">{intake.referralSource || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Dispute Type:</span>{' '}
          <span className="font-medium">{intake.disputeType || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Court Ordered:</span>{' '}
          <span className="font-medium">{intake.isCourtOrdered ? 'Yes' : 'No'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Police Involvement:</span>{' '}
          <span
            className={cn(
              'font-medium',
              intake.phoneChecklist.policeInvolvement && 'text-amber-600'
            )}
          >
            {intake.phoneChecklist.policeInvolvement ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* ENHANCEMENT: Staff Notes Section */}
      {intake.staffNotes && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Staff Notes</h4>
          <p className="text-sm bg-background rounded-md p-3 border whitespace-pre-wrap">
            {intake.staffNotes}
          </p>
        </div>
      )}

      {/* ENHANCEMENT: Dispute Description Preview */}
      {intake.disputeDescription && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Dispute Description</h4>
          <p className="text-sm bg-background rounded-md p-3 border line-clamp-4">
            {intake.disputeDescription}
          </p>
        </div>
      )}

      {/* Retry Button */}
      {(intake.overallSyncStatus === 'failed' || intake.overallSyncStatus === 'partial') && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Retrying...
              </>
            ) : (
              <>
                <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Retry Sync
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PaperIntakeHistoryTable({ intakes }: PaperIntakeHistoryTableProps) {
  const router = useRouter()

  // State
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OverallSyncStatus>('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // Debounced search
  const debouncedSetGlobalFilter = useDebouncedCallback((value: string) => {
    setGlobalFilter(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, 300)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    debouncedSetGlobalFilter(e.target.value)
  }

  // Counts
  const counts = useMemo(() => {
    return {
      all: intakes.length,
      success: intakes.filter((i) => i.overallSyncStatus === 'success').length,
      failed: intakes.filter((i) => i.overallSyncStatus === 'failed').length,
      partial: intakes.filter((i) => i.overallSyncStatus === 'partial').length,
      pending: intakes.filter((i) => i.overallSyncStatus === 'pending').length,
    }
  }, [intakes])

  // Filtered data
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return intakes
    return intakes.filter((i) => i.overallSyncStatus === statusFilter)
  }, [intakes, statusFilter])

  // Retry handler
  const handleRetry = async (intakeId: string) => {
    setRetryingId(intakeId)
    try {
      const result = await retrySyncPaperIntake(intakeId)
      if (result.success) {
        toast.success('Sync retry successful!')
        router.refresh()
      } else {
        toast.error(result.error || 'Retry failed')
      }
    } catch (error) {
      toast.error('Retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  // Column definitions
  const columns: ColumnDef<PaperIntake>[] = useMemo(
    () => [
      {
        id: 'expand',
        header: () => null,
        cell: ({ row }) => (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {expandedId === row.original.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">
                {expandedId === row.original.id ? 'Collapse' : 'Expand'} row
              </span>
            </Button>
          </CollapsibleTrigger>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'caseNumber',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Case #
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.caseNumber || '—'}</span>
        ),
      },
      {
        id: 'participants',
        header: 'Participants',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="text-sm font-medium">{row.original.participant1.name}</div>
            {row.original.participant2 && (
              <div className="text-sm text-muted-foreground">
                {row.original.participant2.name}
              </div>
            )}
          </div>
        ),
        filterFn: (row, _columnId, filterValue) => {
          const p1 = row.original.participant1.name.toLowerCase()
          const p2 = row.original.participant2?.name?.toLowerCase() || ''
          const filter = filterValue.toLowerCase()
          return p1.includes(filter) || p2.includes(filter)
        },
      },
      {
        accessorKey: 'intakeDate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Intake Date
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.intakeDate),
      },
      {
        accessorKey: 'overallSyncStatus',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.overallSyncStatus} />,
        filterFn: (row, _columnId, filterValue) => {
          if (filterValue === 'all') return true
          return row.original.overallSyncStatus === filterValue
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Entered
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{formatDateTime(row.original.createdAt)}</div>
            {row.original.dataEntryByName && (
              <div className="text-xs text-muted-foreground">{row.original.dataEntryByName}</div>
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const intake = row.original
          const canRetry =
            intake.overallSyncStatus === 'failed' || intake.overallSyncStatus === 'partial'

          if (!canRetry) return null

          return (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRetry(intake.id)
              }}
              disabled={retryingId === intake.id}
              aria-label="Retry sync"
            >
              {retryingId === intake.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCw className="h-4 w-4" />
              )}
            </Button>
          )
        },
        enableSorting: false,
      },
    ],
    [expandedId, retryingId]
  )

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase()
      const p1 = row.original.participant1.name.toLowerCase()
      const p2 = row.original.participant2?.name?.toLowerCase() || ''
      const caseNum = row.original.caseNumber?.toLowerCase() || ''
      return p1.includes(search) || p2.includes(search) || caseNum.includes(search)
    },
  })

  // Empty state
  if (intakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium">No entries yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Paper intake entries will appear here after submission.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or case #..."
            value={inputValue}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Search entries"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'success', label: 'Synced', count: counts.success },
            { value: 'failed', label: 'Failed', count: counts.failed },
            { value: 'partial', label: 'Partial', count: counts.partial },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setStatusFilter(tab.value as typeof statusFilter)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              className="h-8"
            >
              {tab.label}
              <Badge
                variant={statusFilter === tab.value ? 'secondary' : 'outline'}
                className="ml-1.5 text-xs"
              >
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Collapsible
                  key={row.id}
                  open={expandedId === row.original.id}
                  onOpenChange={(open) => setExpandedId(open ? row.original.id : null)}
                  asChild
                >
                  <>
                    <TableRow
                      className={cn(
                        'cursor-pointer hover:bg-muted/50',
                        expandedId === row.original.id && 'bg-muted/50'
                      )}
                      onClick={() =>
                        setExpandedId(expandedId === row.original.id ? null : row.original.id)
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length} className="p-0">
                          <ExpandedRowContent
                            intake={row.original}
                            onRetry={() => handleRetry(row.original.id)}
                            isRetrying={retryingId === row.original.id}
                          />
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try adjusting your search or filter
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{' '}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '}
          of {table.getFilteredRowModel().rows.length}
          {statusFilter !== 'all' && ` (filtered from ${intakes.length})`}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) =>
                setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))
              }
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
