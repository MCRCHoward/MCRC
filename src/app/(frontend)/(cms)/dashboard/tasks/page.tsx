import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getCurrentUser } from '@/lib/custom-auth'
import { isStaff } from '@/lib/user-roles'
import { fetchTasks, getPendingTaskCount } from '@/lib/actions/task-actions'
import { TasksTable } from '@/components/Dashboard/Tasks/TasksTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getCurrentUser()

  if (!user || !isStaff(user.role)) {
    redirect('/dashboard')
  }

  const [pendingTasks, completedTasks, pendingCount] = await Promise.all([
    fetchTasks(user.id, { status: 'pending', limit: 50 }),
    fetchTasks(user.id, { status: 'done', limit: 20 }),
    getPendingTaskCount(user.id),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Everything assigned to you across Mediation, Facilitation, and Restorative Practices.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Pending{' '}
              <Badge variant="default" className="ml-1 align-middle">
                {pendingCount}
              </Badge>
            </span>
            <span>
              Recently completed{' '}
              <Badge variant="secondary" className="ml-1 align-middle">
                {completedTasks.length}
              </Badge>
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending tasks</CardTitle>
          <CardDescription>Work from newest to oldest. Changes are saved automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <TasksTable tasks={pendingTasks} userId={user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently completed</CardTitle>
          <CardDescription>Latest items you’ve checked off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed tasks in the last batch.</p>
          ) : (
            <ol className="space-y-3">
              {completedTasks.map((task) => (
                <li key={task.id} className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="capitalize">
                        {task.serviceArea.replace(/([A-Z])/g, ' $1')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Completed {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'recently'}
                      </span>
                    </div>
                    <div className="font-medium text-foreground">{task.title}</div>
                    <Link
                      href={task.link}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      View inquiry
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

