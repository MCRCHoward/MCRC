# User Roles Management Guide

This guide explains how to add new user roles to the system.

## Current Roles

The system currently supports the following roles (in order of permissions, highest to lowest):

1. **admin** - Full system control; can manage users, roles, content, and settings
2. **coordinator** - Can manage content and view user data
3. **mediator** - Can access mediation-related features
4. **volunteer** - Can access volunteer-related features
5. **participant** - Basic user with limited access (default role)

## Adding a New Role

To add a new role to the system, follow these steps in order:

### Step 1: Update TypeScript Types

**File:** `src/types/user.ts`

Add the new role to the `UserRole` type:

```typescript
export interface User {
  // ... existing fields
  role: 'admin' | 'coordinator' | 'mediator' | 'participant' | 'volunteer' | 'your-new-role'
  // ... rest of fields
}
```

Also update the `UserInput` interface if it exists.

### Step 2: Update Roles Configuration

**File:** `src/lib/user-roles.ts`

1. Add the new role to the `UserRole` type at the top of the file (must match `src/types/user.ts`)
2. Add the role metadata to the `ROLES` array:

```typescript
export const ROLES: RoleMetadata[] = [
  // ... existing roles
  {
    value: 'your-new-role',
    label: 'Your New Role',
    description: 'Description of what this role can do',
    level: 3, // Set appropriate level (1-5, higher = more permissions)
  },
]
```

**Important:** The `level` field determines promotion/demotion rules:
- Admins can promote/demote to any role
- Other roles can only promote one level up or demote one level down
- Adjust levels carefully to maintain proper hierarchy

### Step 3: Update Server Actions

**File:** `src/app/(frontend)/(cms)/dashboard/users/user-actions.ts`

Update the Zod schema to include the new role:

```typescript
const UpdateUserRoleSchema = z.object({
  role: z.enum(['admin', 'coordinator', 'mediator', 'participant', 'volunteer', 'your-new-role']),
})
```

### Step 4: Update Firebase Auth Custom Claims (if needed)

**File:** `src/app/(frontend)/(cms)/dashboard/users/user-actions.ts`

If your new role needs custom claims for Firestore security rules, update the `updateUserRole` function:

```typescript
if (newRole === 'admin') {
  await adminAuth.setCustomUserClaims(userId, { admin: true, coordinator: true })
} else if (newRole === 'coordinator') {
  await adminAuth.setCustomUserClaims(userId, { coordinator: true, admin: false })
} else if (newRole === 'your-new-role') {
  await adminAuth.setCustomUserClaims(userId, { yourNewRole: true, admin: false, coordinator: false })
} else {
  // Remove custom claims for non-privileged roles
  await adminAuth.setCustomUserClaims(userId, { admin: false, coordinator: false })
}
```

### Step 5: Update Firestore Security Rules (if needed)

**File:** `firestore.rules`

If your new role needs special permissions, add helper functions and update rules:

```javascript
function isYourNewRole() {
  return isSignedIn() && request.auth.token.yourNewRole == true;
}

// Then use in rules as needed
match /yourCollection/{docId} {
  allow read, write: if isYourNewRole() || isAdmin();
}
```

### Step 6: Update Role Checks (if needed)

**File:** `src/lib/custom-auth.ts` or `src/lib/roles.ts`

If your new role should have CMS access or special permissions, update:

- `canUseCMS()` function in `src/lib/roles.ts`
- `requireRole()` function in `src/lib/custom-auth.ts` (if the role needs protected routes)

### Step 7: Test

1. Build the application: `pnpm build`
2. Test role assignment in the Users page (`/dashboard/users`)
3. Verify custom claims are set correctly in Firebase Auth
4. Test Firestore security rules with the new role
5. Verify UI displays the new role correctly

## Role Hierarchy

The current hierarchy (by level):

- Level 5: admin
- Level 4: coordinator
- Level 3: mediator
- Level 2: volunteer
- Level 1: participant

When adding a new role, consider where it fits in this hierarchy and set the `level` accordingly.

## Notes

- **Admins cannot change their own role** - This is a safety feature to prevent lockout
- **Admins can promote to any role except admin** - This prevents privilege escalation
- **Custom claims** are used for Firestore security rules and should be updated when roles change
- **Role changes require page refresh** - The UI uses `router.refresh()` to update after role changes

## Example: Adding a "facilitator" Role

1. Update `src/types/user.ts`: Add `'facilitator'` to the role union type
2. Update `src/lib/user-roles.ts`: Add facilitator with level 3 (same as mediator)
3. Update `user-actions.ts`: Add `'facilitator'` to the Zod enum
4. Update custom claims if facilitator needs special permissions
5. Test the changes

That's it! The Users page will automatically show the new role in the dropdown.

