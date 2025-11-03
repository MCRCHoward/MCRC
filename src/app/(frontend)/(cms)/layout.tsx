import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/custom-auth'

/**
 * This is a Server Component that acts as a security gatekeeper for the entire CMS.
 * It fetches the current user on the server and checks their role.
 * All authenticated users can access the dashboard (no role restriction).
 */
export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    console.log('[LAYOUT] No authenticated user. Redirecting to /login.')
    return redirect('/login')
  }

  console.log(`[LAYOUT] Authenticated user: ${user.email} (role: ${user.role}). Rendering page.`)

  // Render the dashboard (all authenticated users can access)
  return <>{children}</>
}
