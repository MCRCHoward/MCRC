import { redirect } from 'next/navigation'

/**
 * Deprecated Inquiry Page
 *
 * This page has been replaced by service-specific inquiry pages.
 * We redirect to the mediation inquiries list to preserve old links.
 */
export default function InquiryPage() {
  redirect('/dashboard/mediation/inquiries')
}
