import { getCurrentUser } from '@/lib/custom-auth'
import { redirect } from 'next/navigation'
import AccountForm from './AccountForm'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function AccountPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences. You can update your name and email, but
          role changes must be made by an administrator.
        </p>
      </div>
      <AccountForm user={user} />
    </div>
  )
}

