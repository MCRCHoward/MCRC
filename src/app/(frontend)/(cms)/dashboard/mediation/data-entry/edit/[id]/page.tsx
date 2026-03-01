import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser } from '@/lib/custom-auth'
import { fetchPaperIntake } from '@/lib/actions/paper-intake-actions'
import { PaperIntakeForm } from '@/components/Dashboard/DataEntry'
import { formatDateTime } from '@/utilities/formatDateTime'

// =============================================================================
// Next.js Configuration
// =============================================================================

/**
 * These exports tell Next.js how to handle this page:
 *
 * - runtime: 'nodejs' — Use Node.js runtime (needed for Firebase Admin SDK)
 * - dynamic: 'force-dynamic' — Always render fresh (no caching)
 * - revalidate: 0 — Don't cache this page
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// =============================================================================
// TypeScript Types
// =============================================================================

/**
 * In Next.js 15+, params is a Promise that we need to await.
 * This is different from older versions where params was a plain object.
 */
interface EditPageProps {
  params: Promise<{ id: string }>
}

// =============================================================================
// Page Component
// =============================================================================

/**
 * Edit Paper Intake Page
 *
 * This is a Server Component that:
 * 1. Checks if the user is logged in
 * 2. Fetches the intake by ID
 * 3. Shows a 404 if not found
 * 4. Renders the edit form with pre-filled data
 *
 * The URL pattern is: /dashboard/mediation/data-entry/edit/[id]
 * Where [id] is the Firestore document ID of the intake.
 */
export default async function EditPaperIntakePage({ params }: EditPageProps) {
  // =========================================================================
  // Step 1: Get the intake ID from the URL
  // =========================================================================

  /**
   * In Next.js 15+, params is a Promise. We need to await it to get the actual values.
   * This is a change from Next.js 14 where params was a plain object.
   */
  const { id } = await params

  // =========================================================================
  // Step 2: Check Authentication
  // =========================================================================

  /**
   * getCurrentUser() checks if there's a logged-in user.
   * If not, we redirect to the login page.
   *
   * This is important for security — we don't want unauthenticated users
   * accessing or editing intake data.
   */
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // =========================================================================
  // Step 3: Fetch the Intake Data
  // =========================================================================

  /**
   * fetchPaperIntake is a server action that:
   * 1. Connects to Firestore
   * 2. Fetches the document by ID
   * 3. Returns { success: true, intake: {...} } or { success: false, error: '...' }
   */
  const result = await fetchPaperIntake(id)

  /**
   * If the fetch failed or intake doesn't exist, show a 404 page.
   *
   * notFound() is a Next.js function that:
   * 1. Stops rendering this page
   * 2. Shows the nearest not-found.tsx page (or a default 404)
   */
  if (!result.success || !result.intake) {
    notFound()
  }

  const intake = result.intake

  // =========================================================================
  // Step 4: Render the Page
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Edit Paper Intake</h1>
            {intake.editCount && intake.editCount > 0 && (
              <Badge variant="secondary">
                Edited {intake.editCount} time{intake.editCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {intake.caseNumber ? `Case #${intake.caseNumber} — ` : ''}
            {intake.participant1.name}
            {intake.participant2?.name && ` / ${intake.participant2.name}`}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/dashboard/mediation/data-entry/history">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to History
          </Link>
        </Button>
      </div>

      {/* Edit Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" aria-hidden="true" />
            Edit Intake
          </CardTitle>
          <CardDescription>
            Modify the intake details. Changes will be synced to Insightly automatically.
            {intake.lastEditedAt && (
              <span className="block mt-1 text-xs">
                Last edited: {formatDateTime(intake.lastEditedAt)}
                {intake.lastEditedByName && ` by ${intake.lastEditedByName}`}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PaperIntakeForm
            mode="edit"
            userId={user.id}
            userName={user.name || user.email || 'Unknown User'}
            initialData={intake}
          />
        </CardContent>
      </Card>
    </div>
  )
}
