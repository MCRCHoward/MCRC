'use client'

import { useState, useMemo } from 'react'
import { Search, Download } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import type { NewsletterSubscriber } from '@/types/newsletter'

interface NewsletterTableProps {
  subscribers: NewsletterSubscriber[]
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`
    }

    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`
    }

    const diffInYears = Math.floor(diffInDays / 365)
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`
  } catch {
    return formatDateTimeShort(dateString)
  }
}

/**
 * Export subscribers to CSV
 */
function exportToCSV(subscribers: NewsletterSubscriber[]) {
  const headers = ['ID', 'Email', 'First Name', 'Subscribed Date', 'Source', 'Kit Subscriber ID']

  const rows = subscribers.map((subscriber) => [
    subscriber.id,
    subscriber.email,
    subscriber.firstName || '',
    subscriber.subscribedAt,
    subscriber.source,
    subscriber.kitSubscriberId?.toString() || '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success('Subscribers exported to CSV')
}

export function NewsletterTable({ subscribers: initialSubscribers }: NewsletterTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter subscribers
  const filteredSubscribers = useMemo(() => {
    let filtered = initialSubscribers

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (subscriber) =>
          subscriber.email.toLowerCase().includes(query) ||
          (subscriber.firstName && subscriber.firstName.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [initialSubscribers, searchQuery])

  if (initialSubscribers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No subscribers found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => exportToCSV(filteredSubscribers)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Subscribed Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Kit ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subscribers match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>
                    <div className="font-medium">{subscriber.email}</div>
                  </TableCell>
                  <TableCell>
                    {subscriber.firstName ? (
                      <div className="text-sm">{subscriber.firstName}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatRelativeTime(subscriber.subscribedAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTimeShort(subscriber.subscribedAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{subscriber.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {subscriber.kitSubscriberId ? (
                      <div className="font-mono text-xs text-muted-foreground">
                        {subscriber.kitSubscriberId}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredSubscribers.length} of {initialSubscribers.length} subscribers
      </div>
    </div>
  )
}

