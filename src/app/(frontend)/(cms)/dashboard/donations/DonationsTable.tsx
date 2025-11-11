'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Download } from 'lucide-react'
import { toast } from 'sonner'
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
import { formatPaymentAmount } from '@/utilities/payment-helpers'
import { formatDateTimeShort } from '@/utilities/formatDateTime'

interface Donation {
  id: string
  amount: number
  currency: string
  frequency: 'one-time' | 'monthly'
  donorName: string
  donorEmail: string
  donorPhone?: string
  emailMarketingConsent: boolean
  paymentId: string
  paymentStatus: 'completed' | 'pending' | 'failed'
  paymentDate?: string
  donationDate?: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface DonationsTableProps {
  donations: Donation[]
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'failed'
type FrequencyFilter = 'all' | 'one-time' | 'monthly'

/**
 * Export donations to CSV
 */
function exportToCSV(donations: Donation[]) {
  const headers = [
    'ID',
    'Donor Name',
    'Donor Email',
    'Donor Phone',
    'Amount',
    'Currency',
    'Frequency',
    'Payment Status',
    'Payment ID',
    'Donation Date',
    'Payment Date',
    'Email Marketing Consent',
    'Notes',
  ]

  const rows = donations.map((donation) => [
    donation.id,
    donation.donorName,
    donation.donorEmail,
    donation.donorPhone || '',
    donation.amount.toString(),
    donation.currency,
    donation.frequency,
    donation.paymentStatus,
    donation.paymentId,
    donation.donationDate || '',
    donation.paymentDate || '',
    donation.emailMarketingConsent ? 'Yes' : 'No',
    donation.notes || '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `donations_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Donations exported to CSV')
}

export function DonationsTable({ donations: initialDonations }: DonationsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all')

  // Filter donations
  const filteredDonations = useMemo(() => {
    let filtered = initialDonations

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((donation) => donation.paymentStatus === statusFilter)
    }

    // Filter by frequency
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter((donation) => donation.frequency === frequencyFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (donation) =>
          donation.donorName.toLowerCase().includes(query) ||
          donation.donorEmail.toLowerCase().includes(query) ||
          (donation.donorPhone && donation.donorPhone.includes(query)) ||
          donation.paymentId.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [initialDonations, statusFilter, frequencyFilter, searchQuery])

  if (initialDonations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No donations found.</p>
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
            placeholder="Search by name, email, phone, or payment ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={frequencyFilter}
          onValueChange={(value) => setFrequencyFilter(value as FrequencyFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            <SelectItem value="one-time">One-Time</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportToCSV(filteredDonations)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No donations match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{donation.donorName}</div>
                      <div className="text-sm text-muted-foreground">{donation.donorEmail}</div>
                      {donation.donorPhone && (
                        <div className="text-xs text-muted-foreground">{donation.donorPhone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{formatPaymentAmount(donation.amount, donation.currency)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={donation.frequency === 'one-time' ? 'secondary' : 'default'}>
                      {donation.frequency === 'one-time' ? 'One-Time' : 'Monthly'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        donation.paymentStatus === 'completed'
                          ? 'default'
                          : donation.paymentStatus === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {donation.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {donation.donationDate ? (
                      <div className="text-sm">{formatDateTimeShort(donation.donationDate)}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                      {donation.paymentId || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/donations/${donation.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDonations.length} of {initialDonations.length} donations
      </div>
    </div>
  )
}

