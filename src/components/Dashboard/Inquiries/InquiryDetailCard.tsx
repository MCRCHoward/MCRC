'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { markAsReviewed } from '@/lib/actions/inquiry-actions'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import type { Inquiry } from '@/types/inquiry'
import type { ServiceArea } from '@/lib/service-area-config'

interface InquiryDetailCardProps {
  inquiry: Inquiry
  serviceArea: ServiceArea
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

/**
 * Format field name for display (convert camelCase to Title Case)
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/**
 * Format field value for display
 */
function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return new Date((value as { toDate: () => Date }).toDate()).toLocaleString()
  }
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/**
 * Check if field should be hidden (internal metadata fields)
 */
function shouldHideField(fieldName: string): boolean {
  const hiddenFields = [
    'submittedAt',
    'submittedBy',
    'submissionType',
    'reviewed',
    'reviewedAt',
    'reviewedBy',
    'status',
    'formType',
    'serviceArea',
    'calendlyScheduling',
  ]
  return hiddenFields.includes(fieldName)
}

export function InquiryDetailCard({ inquiry, serviceArea }: InquiryDetailCardProps) {
  const router = useRouter()
  const [reviewed, setReviewed] = useState(inquiry.reviewed)
  const [processing, setProcessing] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set())

  const handleCopy = async (text: string, label: string, fieldName: string) => {
    await copyToClipboard(text, label)
    setCopiedFields((prev) => new Set(prev).add(fieldName))
    setTimeout(() => {
      setCopiedFields((prev) => {
        const next = new Set(prev)
        next.delete(fieldName)
        return next
      })
    }, 2000)
  }

  const handleToggleReviewed = async () => {
    setProcessing(true)
    try {
      await markAsReviewed(serviceArea, inquiry.id)
      setReviewed(true)
      toast.success('Marked as reviewed')
      router.refresh()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update review status. Please try again.'
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  // Get all form fields, excluding hidden ones
  const formFields = Object.entries(inquiry.formData)
    .filter(([key]) => !shouldHideField(key))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="space-y-6">
      {/* Metadata Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Form Type</div>
          <Badge variant="secondary">{inquiry.formType}</Badge>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <InquiryStatusBadge status={inquiry.status} />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Submitted</div>
          <div className="text-sm">{formatDateTimeShort(inquiry.submittedAt)}</div>
        </div>
        {inquiry.reviewedAt && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Reviewed</div>
            <div className="text-sm">{formatDateTimeShort(inquiry.reviewedAt)}</div>
          </div>
        )}
      </div>

      {/* Review Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Review Status:</span>
          <Badge variant={reviewed ? 'default' : 'secondary'}>
            {reviewed ? 'Reviewed' : 'New'}
          </Badge>
        </div>
        {!reviewed && (
          <Button variant="outline" size="sm" onClick={handleToggleReviewed} disabled={processing}>
            {processing ? (
              <Circle className="h-4 w-4 animate-pulse mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            )}
            Mark as Reviewed
          </Button>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Form Data</h3>
        {formFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No form data available.</p>
        ) : (
          formFields.map(([fieldName, value], index) => {
            const formattedValue = formatFieldValue(value)
            const isCopied = copiedFields.has(fieldName)
            const canCopy = typeof value === 'string' && value.length > 0

            return (
              <div key={fieldName}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {formatFieldName(fieldName)}
                    </div>
                    <div className="text-sm break-words">{formattedValue}</div>
                  </div>
                  {canCopy && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() =>
                        handleCopy(String(value), formatFieldName(fieldName), fieldName)
                      }
                      title={`Copy ${formatFieldName(fieldName)}`}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {index < formFields.length - 1 && <Separator className="mt-4" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

