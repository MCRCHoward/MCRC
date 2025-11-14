'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types'
import { updateUserRole } from '@/app/(frontend)/(cms)/dashboard/users/user-actions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getRoleMetadata,
  getPromotableRoles,
  getDemotableRoles,
} from '@/lib/user-roles'
import { formatDateTimeShort } from '@/utilities/formatDateTime'

interface UsersTableProps {
  users: User[]
  currentUserId?: string
}

export default function UsersTable({ users, currentUserId }: UsersTableProps) {
  const router = useRouter()
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    setUpdatingUserId(userId)
    try {
      await updateUserRole(userId, newRole)
      toast.success('User role updated successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to update user role:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update user role. Please try again.'
      toast.error(errorMessage)
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No users found.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Change Role</TableHead>
            <TableHead>Member Since</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const currentRoleMeta = getRoleMetadata(user.role)
            const promotableRoles = getPromotableRoles(user.role)
            const demotableRoles = getDemotableRoles(user.role)
            const availableRoles = [...promotableRoles, ...demotableRoles].filter(
              (r) => r.value !== user.role,
            )
            const isUpdating = updatingUserId === user.id
            const isCurrentUser = user.id === currentUserId

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  {isCurrentUser && (
                    <span className="text-xs text-muted-foreground">(You)</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {currentRoleMeta.label}
                  </Badge>
                  <div className="mt-1 text-xs text-muted-foreground max-w-xs">
                    {currentRoleMeta.description}
                  </div>
                </TableCell>
                <TableCell>
                  {isCurrentUser ? (
                    <span className="text-sm text-muted-foreground">
                      Cannot change your own role
                    </span>
                  ) : (
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value as User['role'])
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-[180px]" disabled={isUpdating}>
                        <SelectValue placeholder="Select role" />
                        {isUpdating && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      </SelectTrigger>
                      <SelectContent>
                        {/* Current role */}
                        <SelectItem value={user.role} disabled>
                          {currentRoleMeta.label} (Current)
                        </SelectItem>
                        {/* Promotable roles */}
                        {promotableRoles.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Promote To
                            </div>
                            {promotableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex flex-col">
                                  <span>{role.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {role.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {/* Demotable roles */}
                        {demotableRoles.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                              Demote To
                            </div>
                            {demotableRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex flex-col">
                                  <span>{role.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {role.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {/* If no available roles, show message */}
                        {availableRoles.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            No role changes available
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTimeShort(user.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

