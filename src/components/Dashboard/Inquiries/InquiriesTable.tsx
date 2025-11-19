'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Copy, Check, Eye, MoreVertical, Mail, Phone, CheckCircle2 } from 'lucide-react'
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
  const metadata = SERVICE_AREA_METADATA[serviceArea]

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
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[200px] min-w-[150px]">Contact</TableHead>
              <TableHead className="hidden md:table-cell">Form Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry, index) => {
              const name = getNameFromFormData(inquiry.formData)
              const email = getEmailFromFormData(inquiry.formData)
              const phone = getPhoneFromFormData(inquiry.formData)
              const isProcessing = processingId === inquiry.id

              return (
                <TableRow
                  key={inquiry.id}
                  className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/50 transition-colors`}
                >
                  {/* Contact Info Column */}
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {name}
                        {!inquiry.reviewed && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      {email && (
                        <div
                          className="text-sm text-muted-foreground truncate max-w-[200px]"
                          title={email}
                        >
                          {email}
                        </div>
                      )}
                      {/* Show submitted date on mobile */}
                      <div className="text-xs text-muted-foreground lg:hidden">
                        {formatDateTimeShort(inquiry.submittedAt)}
                      </div>
                    </div>
                  </TableCell>

                  {/* Form Type Column - Hidden on mobile */}
                  <TableCell className="hidden md:table-cell py-3">
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {inquiry.formType}
                    </Badge>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-3">
                    <InquiryStatusBadge status={inquiry.status} />
                  </TableCell>

                  {/* Submitted Column - Hidden on mobile/tablet */}
                  <TableCell className="hidden lg:table-cell py-3">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTimeShort(inquiry.submittedAt)}
                    </span>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-right py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isProcessing}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {inquiry.formType}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* View Details */}
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/${metadata.slug}/inquiries/${inquiry.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                        </DropdownMenuItem>

                        {/* Copy Email */}
                        {email && (
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(email, 'Email')}
                            className="cursor-pointer"
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Copy Email</span>
                          </DropdownMenuItem>
                        )}

                        {/* Copy Phone */}
                        {phone && (
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(phone, 'Phone')}
                            className="cursor-pointer"
                          >
                            <Phone className="mr-2 h-4 w-4" />
                            <span>Copy Phone</span>
                          </DropdownMenuItem>
                        )}

                        {/* Mark as Reviewed */}
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
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile-friendly summary */}
      <div className="px-4 py-3 bg-muted/20 border-t text-sm text-muted-foreground">
        Showing {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
      </div>
    </div>
  )
}
