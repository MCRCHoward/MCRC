'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Check, Eye } from 'lucide-react'
import { toast } from 'sonner'
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
  const firstName = formData.firstName || formData.contactOneFirstName || formData.referrerName || formData.participantName
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
  const email = formData.email || formData.contactOneEmail || formData.referrerEmail || formData.participantEmail
  return email && typeof email === 'string' ? email : null
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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const metadata = SERVICE_AREA_METADATA[serviceArea]

  const handleCopy = async (text: string, label: string, id: string) => {
    await copyToClipboard(text, label)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleMarkAsReviewed = async (id: string) => {
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
  }

  if (inquiries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No inquiries found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Form Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Reviewed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.map((inquiry) => {
            const name = getNameFromFormData(inquiry.formData)
            const email = getEmailFromFormData(inquiry.formData)
            const isCopied = copiedId === inquiry.id

            return (
              <TableRow key={inquiry.id}>
                <TableCell>
                  <div className="font-medium">{name}</div>
                </TableCell>
                <TableCell>
                  {email ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopy(email, 'Email', inquiry.id)}
                        title="Copy email"
                      >
                        {isCopied ? (
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
                  <Badge variant="secondary">{inquiry.formType}</Badge>
                </TableCell>
                <TableCell>
                  <InquiryStatusBadge status={inquiry.status} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTimeShort(inquiry.submittedAt)}
                  </span>
                </TableCell>
                <TableCell>
                  {inquiry.reviewed ? (
                    <Badge variant="outline" className="text-green-600">
                      Reviewed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600">
                      New
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/${metadata.slug}/inquiries/${inquiry.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    {!inquiry.reviewed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsReviewed(inquiry.id)}
                        disabled={processingId === inquiry.id}
                        title="Mark as reviewed"
                      >
                        {processingId === inquiry.id ? '...' : 'Mark Reviewed'}
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
  )
}

