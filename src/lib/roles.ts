export const ALLOWED_ROLES = new Set(['admin', 'editor', 'coordinator'] as const)
export type UserRole = 'admin' | 'editor' | 'coordinator' | 'mediator' | 'volunteer' | 'participant'
export function canUseCMS(role?: string | null) {
  return role ? (ALLOWED_ROLES as Set<string>).has(role) : false
}
