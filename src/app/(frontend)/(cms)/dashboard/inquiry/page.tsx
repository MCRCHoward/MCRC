import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Deprecated Inquiry Page
 *
 * This page has been replaced by service-specific inquiry pages.
 * Users should navigate to the new service area sections in the sidebar.
 */
export default async function InquiryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inquiries (Deprecated)</h1>
        <p className="text-muted-foreground">
          This page has been replaced by service-specific inquiry management.
        </p>
      </div>

      <Alert variant="default" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertTitle className="text-orange-800 dark:text-orange-200">
          Page Deprecated
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-300">
          This inquiry page is no longer in use. Please use the new service-specific inquiry
          pages available in the sidebar:
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mediation</CardTitle>
            <CardDescription>View mediation service inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/mediation/inquiries">
              <Button variant="outline" className="w-full">
                Go to Mediation Inquiries
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facilitation</CardTitle>
            <CardDescription>View facilitation service inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/facilitation/inquiries">
              <Button variant="outline" className="w-full">
                Go to Facilitation Inquiries
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restorative Practices</CardTitle>
            <CardDescription>View restorative practices inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/restorative-practices/inquiries">
              <Button variant="outline" className="w-full">
                Go to Restorative Practices Inquiries
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
