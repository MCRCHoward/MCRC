import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { adminDb } from '@/lib/firebase-admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SubmissionDetailClient } from './SubmissionDetailClient'
import { formatDateTimeShort } from '@/utilities/formatDateTime'
import { decodeDocPath } from '@/utilities/encodeDocPath'
import type { Timestamp } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Convert Firestore Timestamp or value to ISO string
 */
function toISOString(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return (value as Timestamp).toDate().toISOString()
  }
  if (typeof value === 'string') return value
  return undefined
}

/**
 * Get form type display name from document path
 */
function getFormTypeFromPath(path: string): string {
  const parts = path.split('/')
  const formIdIndex = parts.indexOf('forms')
  if (formIdIndex >= 0 && formIdIndex + 1 < parts.length) {
    const formId = parts[formIdIndex + 1]
    if (!formId) return 'Unknown'
    const formNameMap: Record<string, string> = {
      mediationSelfReferral: 'Mediation Self Referral',
      groupFacilitationInquiry: 'Group Facilitation Inquiry',
      restorativeProgramReferral: 'Restorative Program Referral',
      communityEducationTrainingRequest: 'Community Education Training Request',
    }
    return formNameMap[formId] || formId
  }
  return 'Unknown'
}

async function getSubmissionByPath(docPath: string) {
  try {
    const docRef = adminDb.doc(docPath)
    const snapshot = await docRef.get()

    if (!snapshot.exists) {
      return null
    }

    const data = snapshot.data() as Record<string, unknown>

    return {
      id: snapshot.id,
      path: docPath,
      formType: getFormTypeFromPath(docPath),
      data,
      submittedAt: toISOString(data.submittedAt),
      reviewed: Boolean(data.reviewed),
      reviewedAt: toISOString(data.reviewedAt),
    }
  } catch (error) {
    console.error('[getSubmissionByPath] Error:', error)
    return null
  }
}

export default async function SubmissionDetailPage({ params }: RouteParams) {
  const { id } = await params

  let docPath: string
  try {
    docPath = decodeDocPath(id)
  } catch (error) {
    console.error('[SubmissionDetailPage] Error decoding path:', error)
    notFound()
  }

  const submission = await getSubmissionByPath(docPath)

  if (!submission) {
    notFound()
  }

  const { data, formType, submittedAt, reviewed, reviewedAt } = submission

  // Extract common fields
  const firstName = (data.firstName as string) || ''
  const lastName = (data.lastName as string) || ''
  const name =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : (data.name as string) || (data.referrerName as string) || '—'
  const email =
    (data.email as string) ||
    (data.referrerEmail as string) ||
    (data.participantEmail as string) ||
    ''
  const phone =
    (data.phone as string) ||
    (data.referrerPhone as string) ||
    (data.participantPhone as string) ||
    (data.contactOnePhone as string) ||
    ''

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/inquiry">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submission Details</h1>
          <p className="text-muted-foreground">View and manage form submission information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Submission Information */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Information</CardTitle>
            <CardDescription>Metadata and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Form Type</span>
                <Badge variant="secondary">{formType}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={reviewed ? 'default' : 'secondary'}>
                  {reviewed ? 'Reviewed' : 'New'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Submitted At</span>
                <span className="text-sm">
                  {submittedAt ? formatDateTimeShort(submittedAt) : '—'}
                </span>
              </div>
              {reviewedAt && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reviewed At</span>
                    <span className="text-sm">{formatDateTimeShort(reviewedAt)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Submission ID</span>
                <span className="text-xs font-mono text-muted-foreground break-all">
                  {submission.id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{name}</span>
              </div>
              {email && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">
                      {email}
                    </a>
                  </div>
                </>
              )}
              {phone && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <a href={`tel:${phone}`} className="text-sm text-primary hover:underline">
                      {phone}
                    </a>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Data */}
      <Card>
        <CardHeader>
          <CardTitle>Form Data</CardTitle>
          <CardDescription>Complete submission data</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionDetailClient
            submissionId={submission.id}
            docPath={docPath}
            formType={formType}
            initialReviewed={reviewed}
            formData={data}
          />
        </CardContent>
      </Card>
    </div>
  )
}
