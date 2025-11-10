'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Download, CheckCircle2, X, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markAttendance, cancelRegistrationAdmin } from './actions'
import type { EventRegistration } from '@/types/event-registration'

interface EventRegistrationsClientProps {
  eventId: string
  eventSlug: string
  eventName: string
  registrations: Array<EventRegistration & { id: string }>
  registrationCount: number
}

type StatusFilter = 'all' | 'registered' | 'cancelled' | 'attended'

/**
 * Format date and time for display
 */
function formatDateTime(dateString: string): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return dateString
  }
}

/**
 * Export registrations to CSV
 */
function exportToCSV(registrations: (EventRegistration & { id: string })[], eventName: string) {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Registration Date',
    'Status',
    'Service Interest',
    'Marketing Consent',
    'Notes',
  ]

  const rows = registrations.map((reg) => [
    reg.name,
    reg.email,
    reg.phone || '',
    formatDateTime(reg.registrationDate),
    reg.status,
    reg.serviceInterest,
    reg.emailMarketingConsent ? 'Yes' : 'No',
    reg.notes || '',
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${eventName.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export registrations to JSON
 */
function exportToJSON(registrations: (EventRegistration & { id: string })[], eventName: string) {
  const jsonContent = JSON.stringify(registrations, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${eventName.replace(/[^a-z0-9]/gi, '_')}_registrations_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function EventRegistrationsClient({
  eventName,
  registrations: initialRegistrations,
}: EventRegistrationsClientProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    let filtered = initialRegistrations

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((reg) => reg.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (reg) =>
          reg.name.toLowerCase().includes(query) ||
          reg.email.toLowerCase().includes(query) ||
          (reg.phone && reg.phone.includes(query)),
      )
    }

    return filtered
  }, [initialRegistrations, statusFilter, searchQuery])

  const handleMarkAttendance = async (registrationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(registrationId))
    try {
      await markAttendance(registrationId)
      toast.success('Attendance marked successfully')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to mark attendance. Please try again.'
      toast.error(errorMessage)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(registrationId)
        return next
      })
    }
  }

  const handleCancelRegistration = async (registrationId: string) => {
    setProcessingIds((prev) => new Set(prev).add(registrationId))
    try {
      await cancelRegistrationAdmin(registrationId)
      toast.success('Registration cancelled successfully')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to cancel registration. Please try again.'
      toast.error(errorMessage)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(registrationId)
        return next
      })
    }
  }

  const getStatusBadge = (status: EventRegistration['status']) => {
    switch (status) {
      case 'registered':
        return <Badge variant="default">Registered</Badge>
      case 'attended':
        return (
          <Badge variant="default" className="bg-success/10 text-success-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Attended
          </Badge>
        )
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Export</CardTitle>
          <CardDescription>Filter registrations and export data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportToCSV(filteredRegistrations, eventName)}
                disabled={filteredRegistrations.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => exportToJSON(filteredRegistrations, eventName)}
                disabled={filteredRegistrations.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Showing <strong>{filteredRegistrations.length}</strong> of <strong>{initialRegistrations.length}</strong>{' '}
            registrations
          </p>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations</CardTitle>
          <CardDescription>View and manage event registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No registrations found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service Interest</TableHead>
                    <TableHead>Marketing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => {
                    const isProcessing = processingIds.has(registration.id)
                    return (
                      <TableRow key={registration.id}>
                        <TableCell className="font-medium">{registration.name}</TableCell>
                        <TableCell>{registration.email}</TableCell>
                        <TableCell>{registration.phone || '—'}</TableCell>
                        <TableCell>{formatDateTime(registration.registrationDate)}</TableCell>
                        <TableCell>{getStatusBadge(registration.status)}</TableCell>
                        <TableCell>{registration.serviceInterest}</TableCell>
                        <TableCell>
                          {registration.emailMarketingConsent ? (
                            <Badge variant="outline" className="bg-success/10 text-success-foreground">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {registration.status === 'registered' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAttendance(registration.id)}
                                disabled={isProcessing}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Mark Attended
                              </Button>
                            )}
                            {registration.status !== 'cancelled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelRegistration(registration.id)}
                                disabled={isProcessing}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

