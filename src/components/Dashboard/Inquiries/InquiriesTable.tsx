'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  Eye,
  MoreVertical,
  Mail,
  Phone,
  CheckCircle2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Circle,
  Loader2,
  Inbox,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Keyboard,
} from 'lucide-react'
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
  type RowSelectionState,
  type PaginationState,
} from '@tanstack/react-table'
import {
  markAsReviewed,
  deleteInquiry,
  bulkMarkAsReviewed,
  bulkDeleteInquiries,
} from '@/lib/actions/inquiry-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import type { Inquiry } from '@/types/inquiry'
import type { ServiceArea } from '@/lib/service-area-config'
import { SERVICE_AREA_METADATA } from '@/lib/service-area-config'

interface InquiriesTableProps {
  inquiries: Inquiry[]
  serviceArea: ServiceArea
  isAdmin?: boolean
}

/**
 * Extracts name from form data
 */
function getNameFromFormData(formData: Record<string, unknown>): string {
  const firstName =
    formData.firstName ||
    formData.contactOneFirstName ||
    formData.referrerName ||
    formData.participantName
  const lastName = formData.lastName || formData.contactOneLastName || ''
  const name = formData.name || formData.participantName || formData.referrerName

  if (name && typeof name === 'string') return name
  if (firstName && typeof firstName === 'string') {
    return lastName && typeof lastName === 'string' ? `${firstName} ${lastName}` : firstName
  }
  return 'Unknown'
}

/**
 * Extracts email from form data
 */
function getEmailFromFormData(formData: Record<string, unknown>): string | null {
  const email =
    formData.email ||
    formData.contactOneEmail ||
    formData.referrerEmail ||
    formData.participantEmail
  return email && typeof email === 'string' ? email : null
}

/**
 * Extracts phone from form data
 */
function getPhoneFromFormData(formData: Record<string, unknown>): string | null {
  const phone =
    formData.phone ||
    formData.contactOnePhone ||
    formData.referrerPhone ||
    formData.participantPhone
  return phone && typeof phone === 'string' ? phone : null
}

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

export function InquiriesTable({ inquiries, serviceArea, isAdmin = false }: InquiriesTableProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Core state
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submittedAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [inputValue, setInputValue] = useState('')

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed'>('all')

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [inquiryToDelete, setInquiryToDelete] = useState<{
    id: string
    name: string
    hasExternalLinks: boolean
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Scroll indicator state
  const [hasHorizontalScroll, setHasHorizontalScroll] = useState(false)
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false)

  const metadata = SERVICE_AREA_METADATA[serviceArea]

  // Counts for status filter tabs
  const counts = useMemo(() => {
    const newCount = inquiries.filter(i => !i.reviewed).length
    const reviewedCount = inquiries.filter(i => i.reviewed).length
    return { all: inquiries.length, new: newCount, reviewed: reviewedCount }
  }, [inquiries])

  // Filter data by status before passing to table
  const filteredData = useMemo(() => {
    if (statusFilter === 'all') return inquiries
    if (statusFilter === 'new') return inquiries.filter(i => !i.reviewed)
    return inquiries.filter(i => i.reviewed)
  }, [inquiries, statusFilter])

  // Debounced search
  const debouncedSetGlobalFilter = useDebouncedCallback(
    (value: string) => setGlobalFilter(value),
    300
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    debouncedSetGlobalFilter(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    setGlobalFilter('')
  }

  const handleMarkAsReviewed = useCallback(
    async (id: string) => {
      setProcessingId(id)
      try {
        await markAsReviewed(serviceArea, id)
        toast.success('Inquiry marked as reviewed')
        router.refresh()
      } catch (error) {
        toast.error('Failed to mark inquiry as reviewed')
        console.error('Error marking as reviewed:', error)
      } finally {
        setProcessingId(null)
      }
    },
    [serviceArea, router],
  )

  const handleDeleteInquiry = useCallback(async () => {
    if (!inquiryToDelete) return

    setIsDeleting(true)
    try {
      const result = await deleteInquiry(serviceArea, inquiryToDelete.id)

      if (result.success) {
        toast.success('Inquiry deleted successfully')
        setDeleteDialogOpen(false)
        setInquiryToDelete(null)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete inquiry')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Error deleting inquiry:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [inquiryToDelete, serviceArea, router])

  // Bulk action handlers
  const handleBulkMarkAsReviewed = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) return

    setProcessingId('bulk')
    try {
      const result = await bulkMarkAsReviewed(serviceArea, selectedIds)
      if (result.success) {
        toast.success(`Marked ${selectedIds.length} inquiries as reviewed`)
        setRowSelection({})
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to mark inquiries as reviewed')
      }
    } catch (error) {
      toast.error('Failed to mark some inquiries as reviewed')
      console.error('Bulk review error:', error)
    } finally {
      setProcessingId(null)
    }
  }, [rowSelection, serviceArea, router])

  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection)
    if (selectedIds.length === 0) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteInquiries(serviceArea, selectedIds)
      if (result.success) {
        toast.success(`Deleted ${selectedIds.length} inquiries`)
        setRowSelection({})
        setBulkDeleteDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to delete inquiries')
      }
    } catch (error) {
      toast.error('Failed to delete some inquiries')
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [rowSelection, serviceArea, router])

  // Define columns
  const columns = useMemo<ColumnDef<Inquiry>[]>(
    () => [
      // Checkbox column for row selection
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false) // ASC
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true) // DESC
                } else {
                  column.clearSorting() // Reset
                }
              }}
              className="h-8 px-2 -ml-2 hover:bg-transparent"
            >
              <span>Name</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const name = getNameFromFormData(row.original.formData)
          return (
            <div className="space-y-1">
              <div className="font-medium text-foreground flex items-center gap-2">
                {name}
                {!row.original.reviewed && (
                  <Badge
                    variant="outline"
                    className="text-xs px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                  >
                    New
                  </Badge>
                )}
              </div>
              {/* Show submitted date on mobile (hidden on lg+) */}
              <div className="text-xs text-muted-foreground lg:hidden">
                {formatDateTimeShort(row.original.submittedAt)}
              </div>
            </div>
          )
        },
        accessorFn: (row) => getNameFromFormData(row.formData),
        filterFn: (row, columnId, filterValue) => {
          const name = getNameFromFormData(row.original.formData)
          const email = getEmailFromFormData(row.original.formData)
          const searchValue = filterValue.toLowerCase()
          return (
            name.toLowerCase().includes(searchValue) ||
            (email?.toLowerCase().includes(searchValue) ?? false)
          )
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false)
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true)
                } else {
                  column.clearSorting()
                }
              }}
              className="h-8 px-2 -ml-2 hover:bg-transparent hidden md:flex"
            >
              <span>Email</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const email = getEmailFromFormData(row.original.formData)
          return email ? (
            <span className="text-sm truncate max-w-[200px] block" title={email}>
              {email}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        },
        accessorFn: (row) => getEmailFromFormData(row.formData) ?? '',
        filterFn: (row, columnId, filterValue) => {
          const email = getEmailFromFormData(row.original.formData)
          return email?.toLowerCase().includes(filterValue.toLowerCase()) ?? false
        },
      },
      {
        accessorKey: 'submittedAt',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false)
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true)
                } else {
                  column.clearSorting()
                }
              }}
              className="h-8 px-2 -ml-2 hover:bg-transparent hidden lg:flex"
            >
              <span>Submitted</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateTimeShort(row.original.submittedAt)}
          </span>
        ),
        sortingFn: 'datetime',
        filterFn: (row, columnId, filterValue) => {
          const formatted = formatDateTimeShort(row.original.submittedAt)
          return formatted.toLowerCase().includes(filterValue.toLowerCase())
        },
      },
      {
        id: 'view',
        header: () => <div className="text-center">View</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <Button asChild variant="outline" size="sm" className="h-8">
              <Link href={`/dashboard/${metadata.slug}/inquiries/${row.original.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'reviewed',
        header: ({ column }) => {
          const isSorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              onClick={() => {
                if (!isSorted) {
                  column.toggleSorting(false)
                } else if (isSorted === 'asc') {
                  column.toggleSorting(true)
                } else {
                  column.clearSorting()
                }
              }}
              className="h-8 px-2 -ml-2 hover:bg-transparent"
            >
              <span>Status</span>
              {isSorted === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : isSorted === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
              )}
            </Button>
          )
        },
        cell: ({ row }) => {
          const inquiry = row.original
          const isProcessing = processingId === inquiry.id

          if (inquiry.reviewed) {
            return (
              <div className="flex items-center justify-center">
                <div
                  className="flex items-center gap-1.5 text-green-600 cursor-default"
                  title="Already reviewed"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-xs hidden sm:inline">Done</span>
                </div>
              </div>
            )
          }

          return (
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-orange-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => handleMarkAsReviewed(inquiry.id)}
                disabled={isProcessing}
                title="Click to mark as reviewed"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Circle className="h-4 w-4 mr-1" />
                    <span className="text-xs">Mark</span>
                  </>
                )}
              </Button>
            </div>
          )
        },
        sortingFn: 'basic',
        filterFn: (row, columnId, filterValue) => {
          const status = row.original.reviewed ? 'reviewed' : 'new'
          return status.includes(filterValue.toLowerCase())
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const inquiry = row.original
          const name = getNameFromFormData(inquiry.formData)
          const email = getEmailFromFormData(inquiry.formData)
          const phone = getPhoneFromFormData(inquiry.formData)
          const isProcessing = processingId === inquiry.id

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={isProcessing}>
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{name}</p>
                      {email && (
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {email && (
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(email, 'Email')}
                      className="cursor-pointer"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      <span>Copy Email</span>
                    </DropdownMenuItem>
                  )}

                  {phone && (
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(phone, 'Phone')}
                      className="cursor-pointer"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      <span>Copy Phone</span>
                    </DropdownMenuItem>
                  )}

                  {!inquiry.reviewed && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleMarkAsReviewed(inquiry.id)}
                        disabled={isProcessing}
                        className="cursor-pointer"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        <span>{isProcessing ? 'Marking...' : 'Mark as Reviewed'}</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const hasExternalLinks = !!(inquiry.insightlyLeadId || inquiry.mondayItemId)
                          setInquiryToDelete({
                            id: inquiry.id,
                            name,
                            hasExternalLinks
                          })
                          setDeleteDialogOpen(true)
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Inquiry</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [metadata.slug, processingId, handleMarkAsReviewed, isAdmin],
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const name = getNameFromFormData(row.original.formData)
      const email = getEmailFromFormData(row.original.formData)
      const reviewedStatus = row.original.reviewed ? 'reviewed' : 'new'
      const submittedDate = formatDateTimeShort(row.original.submittedAt)

      const searchValue = filterValue.toLowerCase()

      return (
        name.toLowerCase().includes(searchValue) ||
        (email?.toLowerCase().includes(searchValue) ?? false) ||
        reviewedStatus.includes(searchValue) ||
        submittedDate.toLowerCase().includes(searchValue)
      )
    },
  })

  // Scroll detection effect
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const checkScroll = () => {
      setHasHorizontalScroll(container.scrollWidth > container.clientWidth)
      setIsScrolledToEnd(
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 10
      )
    }

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
        }
        return
      }

      const rows = table.getRowModel().rows
      const selectedIds = Object.keys(rowSelection)

      switch (e.key) {
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
          break
        case 'j':
          // Move selection down
          if (rows.length > 0) {
            const lastSelected = selectedIds[selectedIds.length - 1]
            const currentIndex = rows.findIndex((r) => r.id === lastSelected)
            const nextIndex = Math.min(currentIndex + 1, rows.length - 1)
            const nextRow = rows[nextIndex]
            if (nextRow) {
              setRowSelection({ [nextRow.id]: true })
            }
          }
          break
        case 'k':
          // Move selection up
          if (rows.length > 0) {
            const lastSelected = selectedIds[selectedIds.length - 1]
            const currentIndex = rows.findIndex((r) => r.id === lastSelected)
            const prevIndex = Math.max(currentIndex - 1, 0)
            const prevRow = rows[prevIndex]
            if (prevRow) {
              setRowSelection({ [prevRow.id]: true })
            }
          }
          break
        case 'Enter':
          // Open selected inquiry
          if (selectedIds.length === 1) {
            const inquiry = rows.find((r) => r.id === selectedIds[0])?.original
            if (inquiry) {
              router.push(`/dashboard/${metadata.slug}/inquiries/${inquiry.id}`)
            }
          }
          break
        case 'r':
          // Mark selected as reviewed
          if (selectedIds.length === 1) {
            const inquiry = rows.find((r) => r.id === selectedIds[0])?.original
            if (inquiry && !inquiry.reviewed) {
              handleMarkAsReviewed(inquiry.id)
            }
          }
          break
        case 'Escape':
          // Clear selection
          setRowSelection({})
          handleClearSearch()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [table, rowSelection, router, metadata.slug, handleMarkAsReviewed])

  if (inquiries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No inquiries yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          New form submissions will appear here automatically. Check back later or verify your form is connected.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Skip Link for Accessibility */}
      <a
        href="#inquiries-table"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-background focus:border"
      >
        Skip to inquiries table
      </a>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        <Button
          variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('all')}
          className="h-8"
          aria-pressed={statusFilter === 'all'}
          aria-label={`Show all inquiries. ${counts.all} items`}
        >
          All
          <Badge variant="outline" className="ml-2 h-5 px-1.5">
            {counts.all}
          </Badge>
        </Button>
        <Button
          variant={statusFilter === 'new' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('new')}
          className="h-8"
          aria-pressed={statusFilter === 'new'}
          aria-label={`Filter by new inquiries. ${counts.new} items`}
        >
          <Circle className="h-3 w-3 mr-1.5 text-orange-500 fill-orange-500" />
          New
          <Badge variant="outline" className="ml-2 h-5 px-1.5">
            {counts.new}
          </Badge>
        </Button>
        <Button
          variant={statusFilter === 'reviewed' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter('reviewed')}
          className="h-8"
          aria-pressed={statusFilter === 'reviewed'}
          aria-label={`Filter by reviewed inquiries. ${counts.reviewed} items`}
        >
          <CheckCircle2 className="h-3 w-3 mr-1.5 text-green-600" />
          Reviewed
          <Badge variant="outline" className="ml-2 h-5 px-1.5">
            {counts.reviewed}
          </Badge>
        </Button>
      </div>

      {/* Search Input with Keyboard Shortcuts */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-search-input
            placeholder="Search by name, email, or date..."
            value={inputValue}
            onChange={handleSearchChange}
            className="pl-9"
            aria-label="Search inquiries by name, email, or submission date"
          />
        </div>
        {inputValue && (
          <Button variant="ghost" onClick={handleClearSearch} className="h-10 px-4">
            Clear
          </Button>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="text-xs space-y-1">
                <p>
                  <kbd className="px-1 bg-muted rounded">/</kbd> Focus search
                </p>
                <p>
                  <kbd className="px-1 bg-muted rounded">j</kbd>/
                  <kbd className="px-1 bg-muted rounded">k</kbd> Navigate rows
                </p>
                <p>
                  <kbd className="px-1 bg-muted rounded">Enter</kbd> Open selected
                </p>
                <p>
                  <kbd className="px-1 bg-muted rounded">r</kbd> Mark as reviewed
                </p>
                <p>
                  <kbd className="px-1 bg-muted rounded">Esc</kbd> Clear selection
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Bulk Actions Toolbar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{Object.keys(rowSelection).length} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkMarkAsReviewed}
            disabled={processingId === 'bulk'}
          >
            {processingId === 'bulk' ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Mark as Reviewed
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
            Clear selection
          </Button>
        </div>
      )}

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows.map((row) => {
          const inquiry = row.original
          const name = getNameFromFormData(inquiry.formData)
          const email = getEmailFromFormData(inquiry.formData)
          const phone = getPhoneFromFormData(inquiry.formData)
          const isProcessing = processingId === inquiry.id

          return (
            <Card
              key={row.id}
              className={cn('transition-colors', row.getIsSelected() && 'ring-2 ring-primary')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    className="mt-1"
                    aria-label={`Select ${name}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{name}</span>
                      {!inquiry.reviewed && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                        >
                          New
                        </Badge>
                      )}
                    </div>
                    {email && (
                      <p className="text-sm text-muted-foreground truncate">{email}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTimeShort(inquiry.submittedAt)}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/${metadata.slug}/inquiries/${inquiry.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {!inquiry.reviewed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsReviewed(inquiry.id)}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          {isProcessing ? 'Marking...' : 'Review'}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {email && (
                            <DropdownMenuItem onClick={() => copyToClipboard(email, 'Email')}>
                              <Mail className="mr-2 h-4 w-4" />
                              Copy Email
                            </DropdownMenuItem>
                          )}
                          {phone && (
                            <DropdownMenuItem onClick={() => copyToClipboard(phone, 'Phone')}>
                              <Phone className="mr-2 h-4 w-4" />
                              Copy Phone
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  const hasExternalLinks = !!(
                                    inquiry.insightlyLeadId || inquiry.mondayItemId
                                  )
                                  setInquiryToDelete({ id: inquiry.id, name, hasExternalLinks })
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Desktop Table View */}
      <div
        className="hidden md:block rounded-md border overflow-hidden"
        role="region"
        aria-label="Inquiries table"
      >
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
          >
            <div className="min-w-[900px]">
              <Table id="inquiries-table">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            header.id === 'select'
                              ? 'w-[50px]'
                              : header.id === 'name'
                                ? 'w-[180px] min-w-[150px]'
                                : header.id === 'email'
                                  ? 'w-[200px] min-w-[180px]'
                                  : header.id === 'view'
                                    ? 'w-[100px] text-center'
                                    : header.id === 'reviewed'
                                      ? 'w-[120px]'
                                      : header.id === 'submittedAt'
                                        ? 'w-[140px] hidden lg:table-cell'
                                        : header.id === 'actions'
                                          ? 'w-[60px]'
                                          : '',
                            header.column.getIsSorted() && 'bg-muted/50'
                          )}
                        >
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
                    table.getRowModel().rows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        className={cn(
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                          'hover:bg-muted/50 transition-colors',
                          row.getIsSelected() && 'bg-primary/5'
                        )}
                        aria-selected={row.getIsSelected()}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              'py-3',
                              cell.column.id === 'submittedAt' && 'hidden lg:table-cell'
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <SearchX className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">No results found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search or filter to find what you&apos;re looking
                            for.
                          </p>
                          <Button variant="link" size="sm" onClick={handleClearSearch} className="mt-2">
                            Clear search
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Right fade indicator when scrollable */}
          {hasHorizontalScroll && !isScrolledToEnd && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length}
            {statusFilter !== 'all' && ` (filtered from ${inquiries.length})`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => {
                setPagination((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 0 }))
              }}
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
            <span className="text-sm text-muted-foreground mr-2">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the inquiry from{' '}
              <span className="font-semibold">{inquiryToDelete?.name}</span>.
              {inquiryToDelete?.hasExternalLinks && (
                <span className="text-amber-600 dark:text-amber-500 block mt-2 font-medium">
                  Note: This will not delete the associated Insightly Lead or Monday item.
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone and will remove all associated data.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInquiry}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Inquiry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {Object.keys(rowSelection).length} inquiries?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-semibold">{Object.keys(rowSelection).length} inquiries</span>.
              <span className="text-amber-600 dark:text-amber-500 block mt-2 font-medium">
                Note: This will not delete any associated Insightly Leads or Monday items.
              </span>
              <span className="block mt-2">
                This action cannot be undone and will remove all associated data.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : `Delete ${Object.keys(rowSelection).length} Inquiries`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
