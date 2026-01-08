import { getCurrentUser } from '@/lib/custom-auth'
import { fetchParticipants } from './participant-actions'
import ParticipantsTable from '@/components/Dashboard/ParticipantsTable'
import { isStaff } from '@/lib/user-roles'

// Server-side rendering configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export default async function ParticipantsPage() {
  const [participants, currentUser] = await Promise.all([
    fetchParticipants(),
    getCurrentUser(),
  ])

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
        <h1 className="text-3xl font-bold text-foreground">Participants</h1>
        <p className="text-muted-foreground">
          View and manage participant demographic data collected from various forms.
        </p>
      </div>
      <ParticipantsTable participants={participants} />
    </div>
  )
}
