'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { markAsReviewed } from '@/lib/actions/inquiry-actions'
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
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import type { Inquiry } from '@/types/inquiry'
import type { ServiceArea } from '@/lib/service-area-config'
import { SERVICE_AREA_METADATA } from '@/lib/service-area-config'

interface InquiriesTableProps {
  inquiries: Inquiry[]
  serviceArea: ServiceArea
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

export function InquiriesTable({ inquiries, serviceArea }: InquiriesTableProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'submittedAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const metadata = SERVICE_AREA_METADATA[serviceArea]

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

  // Define columns
  const columns = useMemo<ColumnDef<Inquiry>[]>(
    () => [
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
          const email = getEmailFromFormData(row.original.formData)
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
              {email && (
                <div className="text-sm text-muted-foreground truncate max-w-[200px]" title={email}>
                  {email}
                </div>
              )}
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
        accessorKey: 'formType',
        header: 'Form Type',
        cell: ({ row }) => (
          <Badge variant="secondary" className="whitespace-nowrap">
            {row.original.formType}
          </Badge>
        ),
        filterFn: (row, columnId, filterValue) => {
          return row.original.formType.toLowerCase().includes(filterValue.toLowerCase())
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <InquiryStatusBadge status={row.original.status} />,
        filterFn: (row, columnId, filterValue) => {
          return row.original.status.toLowerCase().includes(filterValue.toLowerCase())
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
              <span>Reviewed</span>
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
        cell: ({ row }) =>
          row.original.reviewed ? (
            <Badge variant="outline" className="text-green-600">
              Reviewed
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600">
              New
            </Badge>
          ),
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
                      <p className="text-xs text-muted-foreground truncate">{inquiry.formType}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/${metadata.slug}/inquiries/${inquiry.id}`}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </Link>
                  </DropdownMenuItem>

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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [serviceArea, metadata.slug, processingId, handleMarkAsReviewed],
  )

  const table = useReactTable({
    data: inquiries,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const name = getNameFromFormData(row.original.formData)
      const email = getEmailFromFormData(row.original.formData)
      const formType = row.original.formType
      const status = row.original.status
      const reviewedStatus = row.original.reviewed ? 'reviewed' : 'new'
      const submittedDate = formatDateTimeShort(row.original.submittedAt)

      const searchValue = filterValue.toLowerCase()

      return (
        name.toLowerCase().includes(searchValue) ||
        (email?.toLowerCase().includes(searchValue) ?? false) ||
        formType.toLowerCase().includes(searchValue) ||
        status.toLowerCase().includes(searchValue) ||
        reviewedStatus.includes(searchValue) ||
        submittedDate.toLowerCase().includes(searchValue)
      )
    },
  })

  if (inquiries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No inquiries found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inquiries..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        {globalFilter && (
          <Button variant="ghost" onClick={() => setGlobalFilter('')} className="h-10 px-4">
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={
                        header.id === 'email'
                          ? 'hidden md:table-cell'
                          : header.id === 'formType'
                            ? 'hidden md:table-cell'
                            : header.id === 'submittedAt'
                              ? 'hidden lg:table-cell'
                              : header.id === 'actions'
                                ? 'w-[80px]'
                                : header.id === 'name'
                                  ? 'w-[200px] min-w-[150px]'
                                  : ''
                      }
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
                    className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/50 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`py-3 ${
                          cell.column.id === 'email'
                            ? 'hidden md:table-cell'
                            : cell.column.id === 'formType'
                              ? 'hidden md:table-cell'
                              : cell.column.id === 'submittedAt'
                                ? 'hidden lg:table-cell'
                                : ''
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Footer */}
        <div className="px-4 py-3 bg-muted/20 border-t text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length === inquiries.length ? (
            <>
              Showing {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
            </>
          ) : (
            <>
              Showing {table.getFilteredRowModel().rows.length} of {inquiries.length}{' '}
              {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
