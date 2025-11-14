/**
 * User Roles Configuration
 *
 * This file centralizes all role definitions and metadata for the application.
 * To add a new role:
 * 1. Add the role to the UserRole type in src/types/user.ts
 * 2. Add the role to the ROLES array below with its display name and description
 * 3. Update the role hierarchy in canPromoteTo() and canDemoteTo() if needed
 * 4. Update Firestore security rules if the role needs special permissions
 * 5. Update custom claims in Firebase Auth if the role needs token-based permissions
 */

// Import UserRole from types - this is the canonical source
// When adding new roles, update the UserRole type in src/types/user.ts first
type UserRole = 'admin' | 'coordinator' | 'mediator' | 'participant' | 'volunteer'

/**
 * Role metadata for display and management
 */
export interface RoleMetadata {
  value: UserRole
  label: string
  description: string
  level: number // Higher number = more permissions (for promotion/demotion logic)
}

/**
 * All available roles with their metadata
 * Add new roles here as they are added to the UserRole type
 */
export const ROLES: RoleMetadata[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full system control; can manage users, roles, content, and settings',
    level: 5,
  },
  {
    value: 'coordinator',
    label: 'Coordinator',
    description: 'Can manage content and view user data',
    level: 4,
  },
  {
    value: 'mediator',
    label: 'Mediator',
    description: 'Can access mediation-related features',
    level: 3,
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    description: 'Can access volunteer-related features',
    level: 2,
  },
  {
    value: 'participant',
    label: 'Participant',
    description: 'Basic user with limited access',
    level: 1,
  },
]

/**
 * Get role metadata by role value
 */
export function getRoleMetadata(role: UserRole): RoleMetadata {
  const found = ROLES.find((r) => r.value === role)
  return found ?? ROLES[ROLES.length - 1]!
}

/**
 * Get all roles that can be promoted to from a given role
 * Admins can promote to any role except admin (to prevent privilege escalation)
 * Other roles can only be promoted to roles one level higher
 */
export function canPromoteTo(currentRole: UserRole, targetRole: UserRole): boolean {
  const current = getRoleMetadata(currentRole)
  const target = getRoleMetadata(targetRole)

  // Admins can promote to any role except admin (to prevent creating other admins)
  if (current.value === 'admin') {
    return target.value !== 'admin'
  }

  // Others can only promote one level up
  return target.level === current.level + 1
}

/**
 * Get all roles that can be demoted to from a given role
 * Admins can demote to any role
 * Others can only demote one level down
 */
export function canDemoteTo(currentRole: UserRole, targetRole: UserRole): boolean {
  const current = getRoleMetadata(currentRole)
  const target = getRoleMetadata(targetRole)

  // Admins can demote to any role
  if (current.value === 'admin') {
    return true
  }

  // Others can only demote one level down
  return target.level === current.level - 1
}

/**
 * Get available roles for promotion from a given role
 */
export function getPromotableRoles(currentRole: UserRole): RoleMetadata[] {
  return ROLES.filter((role) => canPromoteTo(currentRole, role.value))
}

/**
 * Get available roles for demotion from a given role
 */
export function getDemotableRoles(currentRole: UserRole): RoleMetadata[] {
  return ROLES.filter((role) => canDemoteTo(currentRole, role.value))
}

/**
 * Check if a role change is valid (promotion or demotion)
 */
export function isValidRoleChange(
  currentRole: UserRole,
  newRole: UserRole,
  isAdmin: boolean,
): boolean {
  // Admins can change any role to any role (except creating other admins)
  if (isAdmin) {
    return newRole !== 'admin' || currentRole === 'admin'
  }

  // Non-admins can only promote/demote one level
  return canPromoteTo(currentRole, newRole) || canDemoteTo(currentRole, newRole)
}

/**
 * Helper functions to check role types
 */
export function isAdmin(role?: UserRole | null): boolean {
  return role === 'admin'
}

export function isCoordinator(role?: UserRole | null): boolean {
  return role === 'coordinator'
}

export function isStaff(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'coordinator'
}

/**
 * Get all role values as a tuple for Zod enum validation
 * This ensures the Zod schema stays in sync with the ROLES array
 */
export function getRoleValues(): [UserRole, ...UserRole[]] {
  const values = ROLES.map((r) => r.value) as UserRole[]
  // TypeScript requires at least one element for z.enum
  if (values.length === 0) {
    throw new Error('ROLES array must contain at least one role')
  }
  return [values[0]!, ...values.slice(1)]
}
