import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { getCurrentUser } from '@/lib/custom-auth'

/**
 * CMS Layout - Server Component
 *
 * Acts as a security gatekeeper for the entire CMS section.
 * Validates authentication and redirects unauthenticated users to login.
 *
 * @param children - Child components to render if authenticated
 */
export default async function CmsLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    // Redirect unauthenticated users to login
    redirect('/login')
  }

  // Render the dashboard (all authenticated users can access)
  return <NuqsAdapter>{children}</NuqsAdapter>
}
