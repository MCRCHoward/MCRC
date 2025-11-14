import { getCurrentUser } from '@/lib/custom-auth'
import { fetchAllUsers } from './user-actions'
import UsersTable from '@/components/Dashboard/UsersTable'
import { isAdmin, isStaff } from '@/lib/user-roles'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function UsersPage() {
  const [users, currentUser] = await Promise.all([fetchAllUsers(), getCurrentUser()])

  const userIsStaff = isStaff(currentUser?.role)

  if (!userIsStaff) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">
          You must be an administrator or coordinator to view this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user roles. You can promote or demote users to different roles.
        </p>
      </div>
      <UsersTable
        users={users}
        currentUserId={currentUser?.id}
        currentUserRole={currentUser?.role}
      />
    </div>
  )
}

