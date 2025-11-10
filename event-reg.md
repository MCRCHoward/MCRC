# Event Registration System Implementation

## Overview

Create a complete event registration system that saves all registrants to Firestore for marketing and outreach. The system works for all authenticated users regardless of role. Registrations are stored in a root-level `eventRegistrations` collection to enable efficient marketing queries.

## Implementation Steps

### 1. Create TypeScript Types for Event Registrations ✅ COMPLETED

- **File**: `src/types/event-registration.ts` (new)
- Define `EventRegistration` interface:
  - `eventId`: string (reference to event document ID)
  - `userId`: string (Firebase Auth UID)
  - `name`: string
  - `email`: string
  - `phone?`: string (optional)
  - `registrationDate`: string (ISO timestamp)
  - `status`: 'registered' | 'cancelled' | 'attended'
  - `emailMarketingConsent`: boolean
  - `serviceInterest`: 'Mediation' | 'Facilitation' | 'Restorative Practices' | 'Other' | 'None'
  - `notes?`: string (optional, for admin use)
  - Denormalized event data (flat fields, not in metadata object):
    - `eventName`: string (copied from event.title)
    - `eventDate`: string (ISO timestamp, copied from event.startAt)
    - `eventSlug`: string (copied from event.slug)
- Note: Document ID is handled separately by Firestore, not stored in the document data

### 2. Create Server Actions for Registration ✅ COMPLETED

- **File**: `src/app/(frontend)/(default)/events/[slug]/actions.ts` (new)
- Functions:
  - `registerForEvent(eventId: string, registrationData: Partial<EventRegistration>)`
    - Creates registration in root-level `eventRegistrations` collection
    - Fetches event details from `events/{eventId}` using Admin SDK
    - Denormalizes `eventName`, `eventDate`, `eventSlug` into registration document (flat fields)
    - Checks for duplicate registrations (same userId + eventId with status 'registered')
    - Validates user authentication using `requireAuth()` - throws error if not authenticated
  - `getUserRegistrations(userId: string)`
    - Queries `eventRegistrations` collection: `where('userId', '==', userId)`
    - Orders by `registrationDate` DESC
    - Returns array of EventRegistration objects
  - `getEventRegistrations(eventId: string)`
    - Admin-only function
    - Queries `eventRegistrations` collection: `where('eventId', '==', eventId)`
    - Orders by `registrationDate` DESC
  - `cancelRegistration(registrationId: string)`
    - Updates status to 'cancelled' in `eventRegistrations/{registrationId}`
    - Validates user owns the registration or is admin
- Use Firebase Admin SDK for all server-side operations

### 3. Create Registration Form Component ✅ COMPLETED

- **File**: `src/components/events/EventRegistrationForm.tsx` (new)
- Client component with form fields:
  - Name (pre-filled from user profile if available)
  - Email (pre-filled from user profile, read-only)
  - Phone (optional text input)
  - Service Interest (dropdown/select):
    - Options: 'Mediation', 'Facilitation', 'Restorative Practices', 'Other', 'None'
    - Required field
  - Email Marketing Consent (checkbox)
    - Label: "I consent to receive email marketing communications"
    - Required for registration
- Form validation using zod schema
- Success/error handling with toast notifications (using sonner)
- Loading states during submission
- Redirect to login if user is not authenticated:
  - Check authentication status on mount
  - If not authenticated, redirect to `/login?returnUrl=/events/{slug}`
  - Show message: "Please sign in to register for this event"

### 4. Update EventPageClient Component ✅ COMPLETED

- **File**: `src/components/clients/EventPageClient.tsx`
- Authentication check:
  - If user is not authenticated: Show "Sign in to Register" button
  - Button redirects to `/login?returnUrl=/events/{slug}`
- If user is authenticated:
  - Check if user is already registered for this event
  - If registered: Show "Registered" badge and "Cancel Registration" button
  - If not registered: Show registration form (from Step 3)
- Display registration count for admins:
  - Use Firestore `count()` query: `query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId), where('status', '==', 'registered'))`
  - Display count in sidebar or header
- Handle registration status updates (registered/cancelled)


### 5. Add Firestore Indexes ✅ COMPLETED

- **File**: `firestore.indexes.json`
- Add composite indexes for root-level `eventRegistrations` collection:
  - **For User Dashboard (My Events page):**
    - Collection: `eventRegistrations`
    - Fields: `userId` (ASC), `registrationDate` (DESC)
  - **For Admin Dashboard (filtering by event & status):**
    - Collection: `eventRegistrations`
    - Fields: `eventId` (ASC), `status` (ASC), `registrationDate` (DESC)
  - **For Marketing Queries (date range filtering):**
    - Collection: `eventRegistrations`
    - Fields: `registrationDate` (DESC)
  - **For Event-specific queries:**
    - Collection: `eventRegistrations`
    - Fields: `eventId` (ASC), `registrationDate` (DESC)

### 6. Update Firestore Security Rules ✅ COMPLETED

- **File**: `firestore.rules`
- Add rules for root-level `eventRegistrations` collection:
  ```
  match /eventRegistrations/{regId} {
    // Users can only create registrations for themselves
    allow create: if isSignedIn() && 
                     request.resource.data.userId == request.auth.uid;
    
    // Users can read/update their own registrations
    allow read, update: if isSignedIn() && 
                           resource.data.userId == request.auth.uid;
    
    // Admins can read/list all registrations
    allow read, list: if isAdmin();
    
    // Only admins can delete registrations
    allow delete: if isAdmin();
  }
  ```
- Remove old subcollection rules for `events/{eventId}/registrations` (no longer used)

### 7. Create Cloud Function for Event Deletion Cleanup ⚠️ PENDING

- **File**: `functions/src/index.ts` (create if doesn't exist, or add to existing)
- **Note**: Functions directory not found in project. This needs to be set up separately.
- Function: `cleanupEventRegistrations`
- Trigger: `onDocumentDeleted` for `events/{eventId}`
- Logic:
  - When an event is deleted, query `eventRegistrations` collection
  - Find all documents where `eventId == deletedEventId`
  - Delete all matching registration documents in batch
  - Log cleanup operation with count of deleted registrations
- Deployment: Add to Firebase Functions configuration
- Error handling: Wrap in try-catch, log errors to Firebase Console

### 8. Create User Dashboard for Event Registrations ✅ COMPLETED

- **File**: `src/app/(frontend)/(default)/dashboard/my-events/page.tsx` (new)
- Server component that:
  - Requires authentication (redirect if not logged in)
  - Fetches user registrations using `getUserRegistrations(userId)`
  - Separates upcoming vs past events based on `eventDate`
- Display sections:
  - **Upcoming Events**: Events where `eventDate >= today` and `status == 'registered'`
    - Show event name, date, time, location
    - "Cancel Registration" button for each
    - Link to event details page
  - **Past Events**: Events where `eventDate < today` or `status == 'attended'`
    - Show event name, date, attendance status
    - Link to event details page
- Empty states for no registrations
- Loading states while fetching

### 9. Create Admin View for Event Registrations ✅ COMPLETED

- **File**: `src/app/(frontend)/(cms)/dashboard/events/[slug]/registrations/page.tsx` (new)
- Server component that:
  - Requires admin role (use `requireRole('admin')`)
  - Fetches event registrations using `getEventRegistrations(eventId)`
- Features:
  - **List View**: Table of all registrations
    - Columns: Name, Email, Phone, Registration Date, Status, Service Interest, Marketing Consent
    - Sortable columns
    - Pagination for large lists
  - **Filters**:
    - By status (registered/cancelled/attended)
    - By registration date range
    - Search by name/email
  - **Export Functionality**:
    - Export to CSV button
    - Export to JSON button
    - Include all registration fields + denormalized event data
  - **Actions**:
    - Mark attendance (update status to 'attended')
    - Cancel registration (admin override)
    - View registration details
- Display registration count at top (using `getCount()` query)

### 10. Add Registration Status Helper to Event Type ✅ COMPLETED

- **File**: `src/types/event.ts`
- Add helper type/interface (not stored on event, computed client-side):
  - `EventWithRegistrationStatus` extends `Event`:
    - `userRegistrationStatus?`: 'registered' | 'cancelled' | null
    - `registrationCount?`: number (computed on-demand, not stored)
- Note: `registrationCount` should be computed using Firestore `count()` query, not denormalized

## Data Structure

Registrations are stored in **root-level collection** (not subcollection):

```
eventRegistrations/{registrationId}
```

Each registration document (document ID is auto-generated by Firestore):

```typescript
{
  userId: string,                    // Firebase Auth UID
  eventId: string,                   // Reference to event document ID
  name: string,
  email: string,
  phone?: string,
  registrationDate: string,           // ISO timestamp
  status: 'registered' | 'cancelled' | 'attended',
  emailMarketingConsent: boolean,
  serviceInterest: 'Mediation' | 'Facilitation' | 'Restorative Practices' | 'Other' | 'None',
  notes?: string,
  // Denormalized event data (flat fields, not in metadata object)
  eventName: string,                 // Copied from event.title
  eventDate: string,                 // ISO timestamp, copied from event.startAt
  eventSlug: string                  // Copied from event.slug
}
```

**Important**: The document ID (`registrationId`) is separate from the data and retrieved when querying, not stored inside the document.

## Marketing/Outreach Features

### Data Collection
- Email marketing consent checkbox (required)
- Service interest selection for targeted campaigns
All user contact information (name, email, phone)

### Query Capabilities (using root-level collection)

**All registrations from last 30 days:**
```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
query(collection(db, 'eventRegistrations'), 
  where('registrationDate', '>=', thirtyDaysAgo),
  orderBy('registrationDate', 'desc'))
```

**All unique users who registered:**
```typescript
// Query all, extract unique userIds client-side
// Or use aggregation query if available in your Firebase version
```

**Users registered for specific event:**
```typescript
query(collection(db, 'eventRegistrations'), 
  where('eventId', '==', eventId),
  where('status', '==', 'registered'))
```

**Users registered for multiple events:**
```typescript
// Query by userId, then group by eventId client-side
query(collection(db, 'eventRegistrations'), 
  where('userId', '==', userId))
```

**Find users registered for Event A and Event B:**
```typescript
// Query Event A registrations, get userIds array
// Then query Event B with array-contains-any (if supported)
// Or filter client-side
```

### Export Features
- Export to CSV for email marketing tools (Mailchimp, Constant Contact, etc.)
- Export to JSON for data analysis
- Filter exports by date range, event, status, service interest
- Include all fields including denormalized event data

## Authentication Flow

1. User visits event page
2. Clicks "Register" button
3. If not authenticated:
   - Redirect to `/login?returnUrl=/events/{slug}`
   - After login, redirect back to event page
4. If authenticated:
   - Show registration form
   - User completes form and submits
   - Registration created in `eventRegistrations` collection

## Cleanup Strategy

When an event is deleted:
1. Cloud Function `cleanupEventRegistrations` is triggered
2. Queries `eventRegistrations` for all documents with matching `eventId`
3. Deletes all orphaned registration documents in batch
4. Logs cleanup operation

This prevents orphaned registration documents from cluttering the database.
