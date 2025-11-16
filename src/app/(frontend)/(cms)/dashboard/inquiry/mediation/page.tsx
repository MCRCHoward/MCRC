import { redirect } from 'next/navigation'

/**
 * Redirect to the new mediation inquiries page
 * This page is deprecated in favor of /dashboard/mediation/inquiries
 */
export default function MediationInquiryPage() {
  redirect('/dashboard/mediation/inquiries')
}
