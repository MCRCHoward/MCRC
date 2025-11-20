'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Copy,
  Check,
  CheckCircle2,
  Circle,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { markAsReviewed } from '@/lib/actions/inquiry-actions'
import { syncInquiryWithInsightlyAction } from '@/lib/actions/insightly-actions'
import { retryMondaySyncAction } from '@/lib/actions/monday-actions'
import { InquiryStatusBadge } from './InquiryStatusBadge'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import type { Inquiry } from '@/types/inquiry'
import type { ServiceArea } from '@/lib/service-area-config'

interface InquiryDetailCardProps {
  inquiry: Inquiry
  serviceArea: ServiceArea
}

interface AdditionalContact {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
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
  if (Array.isArray(value)) {
    // Don't try to join objects - they'll be handled separately
    if (value.length > 0 && typeof value[0] === 'object') {
      return `${value.length} contact(s)`
    }
    return value.join(', ')
  }
  return String(value)
}

/**
 * Get primary contact fields (person who filled out the form)
 */
function getPrimaryContactFields(): string[] {
  return [
    'prefix',
    'firstName',
    'lastName',
    'phone',
    'email',
    'preferredContactMethod',
    'allowVoicemail',
    'allowText',
    'streetAddress',
    'city',
    'state',
    'zipCode',
    'referralSource',
  ]
}

/**
 * Get Contact One fields
 */
function getContactOneFields(): string[] {
  return ['contactOneFirstName', 'contactOneLastName', 'contactOnePhone', 'contactOneEmail']
}

/**
 * Get fields to hide from the "Other Details" section
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
    // Hide primary contact fields (shown in dedicated section)
    ...getPrimaryContactFields(),
    // Hide Contact One fields (shown in dedicated section)
    ...getContactOneFields(),
    // Hide additional contacts (shown in dedicated section)
    'additionalContacts',
  ]
  return hiddenFields.includes(fieldName)
}

export function InquiryDetailCard({ inquiry, serviceArea }: InquiryDetailCardProps) {
  const router = useRouter()
  const [reviewed, setReviewed] = useState(inquiry.reviewed)
  const [processing, setProcessing] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set())
  const [syncingInsightly, setSyncingInsightly] = useState(false)
  const [syncingMonday, setSyncingMonday] = useState(false)
  const supportsInsightly =
    inquiry.formType === 'mediation-self-referral' ||
    inquiry.formType === 'restorative-program-referral'
  const supportsMonday = supportsInsightly

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

  // Extract primary contact full name
  const fullName = [
    inquiry.formData.prefix,
    inquiry.formData.firstName,
    inquiry.formData.lastName,
  ]
    .filter(Boolean)
    .join(' ')

  // Extract Contact One info
  const contactOneFields = getContactOneFields()
  const hasContactOne = contactOneFields.some(
    (field) => inquiry.formData[field] && String(inquiry.formData[field]).trim().length > 0,
  )

  // Extract additional contacts
  const additionalContacts = (inquiry.formData.additionalContacts as AdditionalContact[]) || []

  // Get remaining form fields for "Other Details"
  const otherFields = Object.entries(inquiry.formData)
    .filter(([key]) => !shouldHideField(key))
    .sort(([a], [b]) => a.localeCompare(b))

  const CopyButton = ({
    value,
    label,
    fieldName,
  }: {
    value: string
    label: string
    fieldName: string
  }) => {
    const isCopied = copiedFields.has(fieldName)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 shrink-0"
        onClick={() => handleCopy(value, label, fieldName)}
        title={`Copy ${label}`}
      >
        {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    )
  }

  const insightlyStatus =
    (inquiry.insightlySyncStatus ??
      (inquiry.insightlyLeadId ? 'success' : undefined)) as
      | 'pending'
      | 'success'
      | 'failed'
      | undefined

  const mondayStatus =
    (inquiry.mondaySyncStatus ??
      (inquiry.mondayItemId ? 'success' : undefined)) as
      | 'pending'
      | 'success'
      | 'failed'
      | undefined

  const handleSyncInsightly = async () => {
    setSyncingInsightly(true)
    try {
      const result = await syncInquiryWithInsightlyAction({
        inquiryId: inquiry.id,
        serviceArea,
      })
      if (result.success) {
        toast.success('Insightly lead synced')
      } else {
        toast.error(result.error ?? 'Unable to sync with Insightly')
      }
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sync with Insightly'
      toast.error(message)
      console.error('[InquiryDetailCard] Insightly sync failed', error)
    } finally {
      setSyncingInsightly(false)
    }
  }

  const handleSyncMonday = async () => {
    setSyncingMonday(true)
    try {
      const result = await retryMondaySyncAction({
        inquiryId: inquiry.id,
        serviceArea,
      })
      if (result.success) {
        toast.success('Monday item synced')
      } else {
        toast.error(result.error ?? 'Unable to sync with Monday')
      }
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sync with Monday'
      toast.error(message)
      console.error('[InquiryDetailCard] Monday sync failed', error)
    } finally {
      setSyncingMonday(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metadata Section */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      {/* Review Status Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Review Status:</span>
          <Badge variant={reviewed ? 'default' : 'secondary'}>{reviewed ? 'Reviewed' : 'New'}</Badge>
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

      {supportsInsightly ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Insightly Lead</span>
              {insightlyStatus ? (
                <Badge
                  variant={
                    insightlyStatus === 'success'
                      ? 'default'
                      : insightlyStatus === 'failed'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {insightlyStatus === 'success'
                    ? 'Synced'
                    : insightlyStatus === 'failed'
                      ? 'Failed'
                      : 'Pending'}
                </Badge>
              ) : (
                <Badge variant="outline">Not yet created</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Lead ID</div>
                <div>
                  {inquiry.insightlyLeadId ? (
                    inquiry.insightlyLeadUrl ? (
                      <a
                        href={inquiry.insightlyLeadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        #{inquiry.insightlyLeadId}
                      </a>
                    ) : (
                      `#${inquiry.insightlyLeadId}`
                    )
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last synced</div>
                <div>
                  {inquiry.insightlyLastSyncedAt
                    ? formatDateTimeShort(inquiry.insightlyLastSyncedAt)
                    : '—'}
                </div>
              </div>
            </div>
            {inquiry.insightlyLastSyncError ? (
              <div className="text-sm text-destructive">
                Last error: {inquiry.insightlyLastSyncError}
              </div>
            ) : null}
            <div>
              <Button onClick={handleSyncInsightly} disabled={syncingInsightly}>
                {syncingInsightly ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : inquiry.insightlyLeadId ? (
                  'Resync Insightly Lead'
                ) : (
                  'Create Insightly Lead'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {supportsMonday ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-semibold">
              <span>Monday Sync</span>
              {mondayStatus ? (
                <Badge
                  variant={
                    mondayStatus === 'success'
                      ? 'default'
                      : mondayStatus === 'failed'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {mondayStatus === 'success'
                    ? 'Synced'
                    : mondayStatus === 'failed'
                      ? 'Failed'
                      : 'Pending'}
                </Badge>
              ) : (
                <Badge variant="outline">Not yet created</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <div className="text-muted-foreground">Item ID</div>
                <div>
                  {inquiry.mondayItemId ? (
                    inquiry.mondayItemUrl ? (
                      <a
                        href={inquiry.mondayItemUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        #{inquiry.mondayItemId}
                      </a>
                    ) : (
                      `#${inquiry.mondayItemId}`
                    )
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last synced</div>
                <div>
                  {inquiry.mondayLastSyncedAt
                    ? formatDateTimeShort(inquiry.mondayLastSyncedAt)
                    : '—'}
                </div>
              </div>
            </div>
            {inquiry.mondaySyncError ? (
              <div className="text-sm text-destructive">
                Last error: {inquiry.mondaySyncError}
              </div>
            ) : null}
            <div>
              <Button onClick={handleSyncMonday} disabled={syncingMonday}>
                {syncingMonday ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing…
                  </>
                ) : inquiry.mondayItemId ? (
                  'Resync Monday Item'
                ) : (
                  'Create Monday Item'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Separator />

      {/* PRIMARY CONTACT - Person who filled out the form */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Primary Contact (Inquiry Submitter)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <>
            {fullName ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Full Name</div>
                  <div className="text-lg font-semibold">{fullName}</div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {inquiry.formData.phone ? (
                <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                  <a
                    href={`tel:${inquiry.formData.phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {String(inquiry.formData.phone)}
                  </a>
                  {inquiry.formData.allowText === 'Yes' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Text OK
                    </Badge>
                  )}
                  {inquiry.formData.allowVoicemail === 'Yes' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      VM OK
                    </Badge>
                  )}
                </div>
                <CopyButton
                  value={String(inquiry.formData.phone)}
                  label="Phone"
                  fieldName="phone"
                />
                </div>
              ) : null}
              {inquiry.formData.email ? (
                <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <a
                    href={`mailto:${inquiry.formData.email}`}
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {String(inquiry.formData.email)}
                  </a>
                </div>
                <CopyButton
                  value={String(inquiry.formData.email)}
                  label="Email"
                  fieldName="email"
                />
                </div>
              ) : null}
            </div>

          {(inquiry.formData.streetAddress ||
            inquiry.formData.city ||
            inquiry.formData.state ||
            inquiry.formData.zipCode) ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </div>
                <div className="text-sm">
                  {inquiry.formData.streetAddress ? (
                    <div>{String(inquiry.formData.streetAddress)}</div>
                  ) : null}
                  <div>
                    {[
                      inquiry.formData.city,
                      inquiry.formData.state,
                      inquiry.formData.zipCode,
                    ]
                      .filter(Boolean)
                      .map(String)
                      .join(', ')}
                  </div>
                </div>
              </div>
              {inquiry.formData.streetAddress ? (
                <CopyButton
                  value={`${inquiry.formData.streetAddress}, ${[inquiry.formData.city, inquiry.formData.state, inquiry.formData.zipCode].filter(Boolean).join(', ')}`}
                  label="Address"
                  fieldName="address"
                />
              ) : null}
            </div>
          ) : null}

          {inquiry.formData.preferredContactMethod ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Preferred Contact Method
                </div>
                <div className="text-sm">
                  <Badge variant="outline">{String(inquiry.formData.preferredContactMethod)}</Badge>
                </div>
              </div>
            </div>
          ) : null}

          {inquiry.formData.referralSource ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  How They Heard About Us
                </div>
                <div className="text-sm">{String(inquiry.formData.referralSource)}</div>
              </div>
            </div>
          ) : null}
          </>
        </CardContent>
      </Card>

      {/* OTHER PARTICIPANTS */}
      {(hasContactOne || additionalContacts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Other Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact One */}
            {hasContactOne && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Contact 1</h4>
                <div className="grid gap-3 md:grid-cols-2 pl-4 border-l-2">
                  {inquiry.formData.contactOneFirstName && inquiry.formData.contactOneLastName ? (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Name</div>
                      <div className="text-sm">
                        {String(inquiry.formData.contactOneFirstName)}{' '}
                        {String(inquiry.formData.contactOneLastName)}
                      </div>
                    </div>
                  ) : null}
                  {inquiry.formData.contactOnePhone ? (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Phone</div>
                        <a
                          href={`tel:${inquiry.formData.contactOnePhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {String(inquiry.formData.contactOnePhone)}
                        </a>
                      </div>
                      <CopyButton
                        value={String(inquiry.formData.contactOnePhone)}
                        label="Contact 1 Phone"
                        fieldName="contactOnePhone"
                      />
                    </div>
                  ) : null}
                  {inquiry.formData.contactOneEmail ? (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <a
                          href={`mailto:${inquiry.formData.contactOneEmail}`}
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {String(inquiry.formData.contactOneEmail)}
                        </a>
                      </div>
                      <CopyButton
                        value={String(inquiry.formData.contactOneEmail)}
                        label="Contact 1 Email"
                        fieldName="contactOneEmail"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Additional Contacts */}
            {additionalContacts.length > 0 && (
              <>
                {hasContactOne ? <Separator /> : null}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Additional Contacts ({additionalContacts.length})
                  </h4>
                  {additionalContacts.map((contact, index) => (
                    <div key={index} className="space-y-3 pl-4 border-l-2">
                      <div className="font-medium text-sm">Contact {index + 2}</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {contact.firstName && contact.lastName ? (
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Name</div>
                            <div className="text-sm">
                              {contact.firstName} {contact.lastName}
                            </div>
                          </div>
                        ) : null}
                        {contact.phone ? (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Phone</div>
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-sm text-primary hover:underline"
                              >
                                {contact.phone}
                              </a>
                            </div>
                            <CopyButton
                              value={contact.phone}
                              label={`Contact ${index + 2} Phone`}
                              fieldName={`additionalContact${index}Phone`}
                            />
                          </div>
                        ) : null}
                        {contact.email ? (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground">Email</div>
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {contact.email}
                              </a>
                            </div>
                            <CopyButton
                              value={contact.email}
                              label={`Contact ${index + 2} Email`}
                              fieldName={`additionalContact${index}Email`}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* OTHER DETAILS */}
      {otherFields.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Other Details</h3>
            {otherFields.map(([fieldName, value], index) => {
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
                      <div className="text-sm break-words whitespace-pre-wrap">
                        {formattedValue}
                      </div>
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
                  {index < otherFields.length - 1 && <Separator className="mt-4" />}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
