'use client'

import { useId, useMemo, useState } from 'react'
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  FilterIcon,
  Loader2,
} from 'lucide-react'
import type {
  Column,
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Inquiry, InquiryStatus } from '@/types/inquiry'
import Link from 'next/link'

type FacilitationRow = {
  id: string
  name: string
  email: string
  phone?: string
  organizationName?: string
  organizationType?: string
  groupSize?: number
  supports: string[]
  submittedAt: string
  requestedDate?: string
  status: InquiryStatus
  reviewed: boolean
}

const statusClassMap: Record<InquiryStatus | 'pending-review', string> = {
  submitted: 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  'intake-scheduled': 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  scheduled: 'bg-sky-600/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
  'in-progress': 'bg-amber-600/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  completed: 'bg-green-600/10 text-green-600 dark:bg-green-500/15 dark:text-green-300',
  closed: 'bg-slate-500/20 text-slate-600 dark:bg-slate-400/15 dark:text-slate-200',
  'pending-review': 'bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
}

type ColumnMeta = {
  filterVariant?: 'select' | 'range'
}

const columns: ColumnDef<FacilitationRow, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
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
    size: 48,
  },
  {
    header: 'Contact',
    accessorKey: 'name',
    size: 320,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-10 bg-primary/5 text-primary">
          <AvatarFallback className="text-xs font-semibold uppercase">
            {row.original.name
              .split(' ')
              .map((part) => part.charAt(0))
              .join('')
              .slice(0, 2) || 'NA'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue<string>('name')}</span>
          <span className="text-sm text-muted-foreground">{row.original.email || '—'}</span>
          {row.original.phone && (
            <span className="text-xs text-muted-foreground">{row.original.phone}</span>
          )}
        </div>
      </div>
    ),
  },
  {
    header: 'Organization',
    accessorKey: 'organizationType',
    meta: { filterVariant: 'select' } satisfies ColumnMeta,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="capitalize">{row.original.organizationType || '—'}</span>
        <span className="text-sm text-muted-foreground">
          {row.original.organizationName || 'Not provided'}
        </span>
      </div>
    ),
  },
  {
    header: 'Supports requested',
    accessorKey: 'supports',
    meta: { filterVariant: 'select' } satisfies ColumnMeta,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        {row.original.supports.length ? (
          row.original.supports.map((support) => (
            <Badge key={support} variant="secondary" className="capitalize">
              {support}
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
    ),
  },
  {
    header: 'Requested date',
    accessorKey: 'requestedDate',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {row.original.requestedDate
            ? formatDate(row.original.requestedDate)
            : 'Not specified'}
        </span>
      </div>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    meta: { filterVariant: 'select' } satisfies ColumnMeta,
    cell: ({ row }) => {
      const status = row.getValue<InquiryStatus>('status')
      const badgeClass =
        statusClassMap[status] ??
        statusClassMap[row.original.reviewed ? status : 'pending-review']

      return (
        <Badge className={cn('border-none capitalize focus-visible:outline-none', badgeClass)}>
          {row.original.reviewed ? status.replace('-', ' ') : 'Pending review'}
        </Badge>
      )
    },
  },
  {
    header: 'Submitted',
    accessorKey: 'submittedAt',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{formatDate(row.original.submittedAt)}</span>
    ),
  },
  {
    id: 'actions',
    header: () => 'Actions',
    enableSorting: false,
    enableHiding: false,
    size: 120,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" asChild aria-label="View inquiry">
              <Link href={`/dashboard/facilitation/inquiries/${row.original.id}`}>
                <EyeIcon className="size-4.5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View</TooltipContent>
        </Tooltip>
        <RowActions inquiryId={row.original.id} />
      </div>
    ),
  },
]

export function FacilitationInquiriesTable({ inquiries }: { inquiries: Inquiry[] }) {
  const data = useMemo(() => inquiries.map(mapInquiryToRow), [inquiries])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
      globalFilter,
    },
    enableSortingRemoval: false,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const paginationMeta = useMemo(
    () =>
      getPaginationMeta({
        currentPage: table.getState().pagination.pageIndex + 1,
        totalPages: table.getPageCount(),
        siblings: 1,
      }),
    [table],
  )

  return (
    <div className="w-full">
      <div className="border-b">
        <div className="flex flex-col gap-4 border-b bg-muted/10 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <FilterIcon className="size-4 text-muted-foreground" />
            <span className="text-xl font-semibold">Filter inquiries</span>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Filter column={table.getColumn('status')} label="Status" />
            <Filter column={table.getColumn('organizationType')} label="Organization type" />
            <Filter column={table.getColumn('supports')} label="Support needed" />
            <div className="space-y-2">
              <Label>Search by contact, email, organization</Label>
              <Input
                placeholder="Search inquiries..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12 border-t">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() ? `${header.getSize()}px` : undefined }}
                    className="text-muted-foreground first:pl-4 last:pr-4 last:text-center"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          'flex h-full cursor-pointer select-none items-center gap-2',
                          header.column.getCanSort() && 'justify-between',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            header.column.getToggleSortingHandler()?.(event)
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUpIcon className="size-4 opacity-60" aria-hidden="true" />,
                          desc: <ChevronDownIcon className="size-4 opacity-60" aria-hidden="true" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-transparent"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="h-14 first:pl-4 last:pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No inquiries match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing{' '}
          <span>
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}
          </span>{' '}
          of <span>{table.getFilteredRowModel().rows.length}</span> inquiries
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Go to previous page"
              >
                <ChevronLeftIcon className="size-4" />
                Previous
              </Button>
            </PaginationItem>

            {paginationMeta.showLeftEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {paginationMeta.pages.map((page) => {
              const isActive = page === table.getState().pagination.pageIndex + 1
              return (
                <PaginationItem key={page}>
                  <Button
                    size="icon"
                    variant={isActive ? 'default' : 'ghost'}
                    onClick={() => table.setPageIndex(page - 1)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                </PaginationItem>
              )
            })}

            {paginationMeta.showRightEllipsis && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            <PaginationItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Go to next page"
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

function mapInquiryToRow(inquiry: Inquiry): FacilitationRow {
  const form = inquiry.formData ?? {}
  const supports = Array.isArray(form.supports) ? (form.supports as string[]) : []
  const requestedDate =
    typeof form.requestedDate === 'string'
      ? form.requestedDate
      : typeof form.requestedDate === 'object' && form.requestedDate !== null
        ? (form.requestedDate as { _seconds?: number })._seconds
          ? new Date((form.requestedDate as { _seconds: number })._seconds * 1000).toISOString()
          : undefined
        : undefined

  return {
    id: inquiry.id,
    name: [form.firstName, form.lastName].filter(Boolean).join(' ') || 'Unnamed contact',
    email: (form.email as string) ?? inquiry.submittedBy ?? '',
    phone: form.phone as string | undefined,
    organizationName: (form.organizationName as string) || undefined,
    organizationType: (form.organizationType as string) || undefined,
    groupSize:
      typeof form.groupSize === 'number'
        ? form.groupSize
        : typeof form.groupSize === 'string'
          ? Number(form.groupSize)
          : undefined,
    supports,
    submittedAt: inquiry.submittedAt,
    requestedDate,
    status: inquiry.status,
    reviewed: inquiry.reviewed ?? false,
  }
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getPaginationMeta({
  currentPage,
  totalPages,
  siblings,
}: {
  currentPage: number
  totalPages: number
  siblings: number
}) {
  const pages: number[] = []
  const startPage = Math.max(1, currentPage - siblings)
  const endPage = Math.min(totalPages, currentPage + siblings)

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page)
  }

  return {
    pages,
    showLeftEllipsis: startPage > 1,
    showRightEllipsis: endPage < totalPages,
  }
}

function Filter({
  column,
  label,
}: {
  column: Column<FacilitationRow, unknown> | undefined
  label: string
}) {
  const id = useId()
  const columnFilterValue = column?.getFilterValue()

  const sortedUniqueValues = useMemo(() => {
    if (!column) return []
    const values = Array.from(column.getFacetedUniqueValues().keys())
    const flattened = values.flatMap((value) => (Array.isArray(value) ? value : [value]))
    return Array.from(new Set(flattened.filter(Boolean))).sort()
  }, [column])

  if (!column) {
    return (
      <div className="w-full space-y-2">
        <Label>{label}</Label>
        <div className="flex h-10 items-center rounded-md border px-3 text-sm text-muted-foreground">
          Loading filters...
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      <Label htmlFor={`${id}-select`}>{label}</Label>
      <Select
        value={columnFilterValue?.toString() ?? 'all'}
        onValueChange={(value) => {
          column.setFilterValue(value === 'all' ? undefined : value)
        }}
      >
        <SelectTrigger id={`${id}-select`} className="w-full capitalize">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {sortedUniqueValues.map((value) => (
            <SelectItem key={String(value)} value={String(value)} className="capitalize">
              {String(value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function RowActions({ inquiryId }: { inquiryId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full p-2" aria-label="More actions">
          <ChevronDownIcon className="size-4.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/facilitation/inquiries/${inquiryId}`}>View details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Mark as reviewed (coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

