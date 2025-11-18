# Service Area Naming Conventions

This document defines the naming conventions for service areas across the codebase to ensure consistency.

## Service Areas

### Mediation
- **URL/Route**: `mediation` (kebab-case)
- **Code/Type**: `mediation` (camelCase)
- **Display**: "Mediation"
- **Firestore Document ID**: `mediation`
- **Firestore Path**: `serviceAreas/mediation/inquiries/{id}`

### Facilitation
- **URL/Route**: `facilitation` (kebab-case)
- **Code/Type**: `facilitation` (camelCase)
- **Display**: "Facilitation"
- **Firestore Document ID**: `facilitation`
- **Firestore Path**: `serviceAreas/facilitation/inquiries/{id}`

### Restorative Practices
- **URL/Route**: `restorative-practices` (kebab-case)
- **Code/Type**: `restorativePractices` (camelCase)
- **Display**: "Restorative Practices"
- **Firestore Document ID**: `restorativePractices`
- **Firestore Path**: `serviceAreas/restorativePractices/inquiries/{id}`

## Form Types

- `mediation-self-referral` → `mediation` service area
- `restorative-program-referral` → `restorativePractices` service area
- `group-facilitation-inquiry` → `facilitation` service area (future)

## General Rules

1. **URLs/Routes**: Always use kebab-case (e.g., `/dashboard/restorative-practices/inquiries`)
2. **Code/Types**: Always use camelCase (e.g., `restorativePractices`)
3. **Firestore Document IDs**: Use camelCase (e.g., `serviceAreas/restorativePractices`)
4. **Firestore Collection Paths**: Use camelCase for document IDs, kebab-case is not valid in Firestore
5. **Display Text**: Use proper spacing and capitalization (e.g., "Restorative Practices")
6. **Variable Names**: Use camelCase (e.g., `serviceArea`, `formType`)

## Examples

### Correct Usage

```typescript
// Type definition
type ServiceArea = 'mediation' | 'facilitation' | 'restorativePractices'

// Route path
const route = `/dashboard/restorative-practices/inquiries`

// Firestore path
const firestorePath = `serviceAreas/restorativePractices/inquiries/${id}`

// Display text
const label = 'Restorative Practices'
```

### Incorrect Usage

```typescript
// ❌ Don't use kebab-case in code/types
type ServiceArea = 'restorative-practices' // Wrong!

// ❌ Don't use camelCase in URLs
const route = `/dashboard/restorativePractices/inquiries` // Wrong!

// ❌ Don't use kebab-case in Firestore document IDs
const path = `serviceAreas/restorative-practices/inquiries/${id}` // Wrong!
```

