# Calendly OAuth Integration Plan

## Overview
Implement full Calendly OAuth integration with webhooks to track scheduling after form submissions. Forms will route to specific event types with pre-filled user data.

## Redirect URI Configuration
When setting up your Calendly OAuth app, use these Redirect URIs:
- **Production**: `https://mcrchoward.org/api/calendly/callback`
- **Development**: `http://localhost:3000/api/calendly/callback`

## Implementation Steps

### 1. Environment Configuration
Add Calendly credentials to `.env.local`:
```bash
#Calendly
#Production
PRODUCTION_CALENDLY_CLIENT_ID=
PRODUCTION_CALENDLY_CLIENT_SECRET=
PRODUCTION_CALENDLY_REDIRECT_URI=
PRODUCTION_CALENDLY_WEBHOOK_SIGNING_KEY=

#Sandbox
SANDBOX_CALENDLY_CLIENT_ID=
SANDBOX_CALENDLY_CLIENT_SECRET=
SANDBOX_CALENDLY_REDIRECT_URI=
SANDBOX_CALENDLY_WEBHOOK_SIGNING_KEY=
```

### 2. Create Calendly Types
Create `src/types/calendly.ts` with TypeScript interfaces for:
- OAuth tokens
- Event types
- Scheduled events
- Invitee information
- Webhook payloads

### 3. Implement OAuth Flow
Create route handlers in `src/app/api/calendly/`:
- **`authorize/route.ts`**: Initiates OAuth flow (admin only)
- **`callback/route.ts`**: Handles OAuth callback, exchanges code for tokens
- **`refresh/route.ts`**: Refreshes access tokens when expired

Store tokens in Firestore `settings/calendly` document with encryption.

### 4. Create Calendly Service Layer
Create `src/lib/calendly-service.ts` with functions:
- `getAccessToken()`: Retrieves and refreshes tokens as needed
- `getEventTypes()`: Fetches available event types from Calendly
- `createSchedulingLink()`: Generates scheduling URL with pre-filled data
- `getScheduledEvent()`: Retrieves event details by URI
- `listUserEvents()`: Gets all scheduled events

### 5. Map Forms to Event Types
Create `src/lib/calendly-config.ts`:
```typescript
export const FORM_TO_EVENT_TYPE = {
  'mediation-self-referral': 'CALENDLY_EVENT_TYPE_UUID_1',
  'restorative-program-referral': 'CALENDLY_EVENT_TYPE_UUID_2',
} as const
```

Store event type mappings in Firestore for admin configurability.

### 6. Update Form Submissions
Modify form submission logic in:
- `src/hooks/useFirestoreFormSubmit.ts`: Store submission ID for webhook correlation
- Add `schedulingInfo` field to submission documents

### 7. Update Form Success Screens
Modify `selfReferralForm.tsx` and `restorativeProgramReferralForm.tsx`:
- After successful submission, fetch Calendly scheduling link via new API route
- Display Calendly inline widget or popup with pre-filled data
- Include submission ID as `salesforce_uuid` or custom parameter for tracking

### 8. Create Scheduling API Route
Create `src/app/api/forms/[formType]/schedule/route.ts`:
- Accepts submission ID
- Generates Calendly scheduling link with pre-filled invitee data
- Returns URL for embedding widget

### 9. Implement Webhook Endpoint
Create `src/app/api/calendly/webhook/route.ts`:
- Verify webhook signature
- Handle `invitee.created` event
- Update form submission in Firestore with:
  - Scheduled event URI
  - Scheduled time
  - Calendly invitee data
  - Status: "scheduled"

### 10. Create Admin Configuration UI
Add to `src/app/(frontend)/(cms)/dashboard/settings/calendly/page.tsx`:
- OAuth connection button (initiates authorize flow)
- Display connection status
- List available event types
- Map event types to forms
- Test webhook endpoint

### 11. Add Calendly Embed Component
Create `src/components/CalendlyWidget.tsx`:
- Loads Calendly embed script
- Renders inline or popup widget
- Handles scheduling completion callback
- Shows loading and error states

### 12. Update Firestore Structure
Add new collections/documents:
- `settings/calendly`: OAuth tokens and configuration
- `formSubmissions/{id}`: Add `calendlyScheduling` field with event details
- `calendlyEventTypes`: Maps form types to Calendly event type UUIDs

### 13. Security Considerations
- Encrypt OAuth tokens before storing in Firestore
- Verify webhook signatures
- Rate limit API routes
- Admin-only OAuth setup routes
- Public scheduling link generation (with CSRF protection)

## Key Files to Create/Modify
- **New**: `src/types/calendly.ts`
- **New**: `src/lib/calendly-service.ts`
- **New**: `src/lib/calendly-config.ts`
- **New**: `src/app/api/calendly/authorize/route.ts`
- **New**: `src/app/api/calendly/callback/route.ts`
- **New**: `src/app/api/calendly/refresh/route.ts`
- **New**: `src/app/api/calendly/webhook/route.ts`
- **New**: `src/app/api/forms/[formType]/schedule/route.ts`
- **New**: `src/components/CalendlyWidget.tsx`
- **New**: `src/app/(frontend)/(cms)/dashboard/settings/calendly/page.tsx`
- **Modify**: `src/Forms/formDisplay/selfReferralForm.tsx`
- **Modify**: `src/Forms/formDisplay/restorativeProgramReferralForm.tsx`
- **Modify**: `src/hooks/useFirestoreFormSubmit.ts`

## Testing Checklist
- OAuth connection flow works
- Tokens refresh automatically
- Scheduling links generate with pre-filled data
- Webhooks update submission records
- Different forms route to correct event types
- Admin can configure event type mappings

## Implementation Status

### Completed Foundation (Current Phase)
- ✅ Environment configuration and documentation
- ✅ TypeScript types for Calendly API
- ✅ Configuration helpers and form-to-event-type mapping
- ✅ Encryption utilities for token storage
- ✅ Calendly service layer with token management
- ✅ OAuth flow (authorize, callback, refresh routes)
- ✅ Scheduling link generation API
- ✅ Webhook endpoint with signature verification
- ✅ Firestore settings actions (encrypted token storage)
- ✅ Inquiry documents include calendlyScheduling placeholder
- ✅ Admin settings page with connection status

### API Endpoints

#### OAuth Endpoints
- `GET /api/calendly/authorize` - Initiates OAuth flow (admin only)
- `GET /api/calendly/callback` - Handles OAuth callback
- `POST /api/calendly/refresh` - Manually refresh tokens (admin only)

#### Scheduling Endpoint
- `POST /api/forms/[formType]/schedule` - Generate scheduling link
  - Body: `{ inquiryId: string }`
  - Returns: `{ schedulingUrl: string, eventUri?: string }`

#### Webhook Endpoint
- `POST /api/calendly/webhook` - Receives Calendly webhook events
  - Verifies signature automatically
  - Currently logs events (TODO: Update inquiry records)

### Next Steps (Future Implementation)

1. **Custom Thank You Pages**
   - Create thank you page components for each form type
   - Embed Calendly widget with pre-filled data
   - Display scheduling link after form submission

2. **Webhook Event Handling**
   - Implement `invitee.created` handler to update inquiry records
   - Implement `invitee.canceled` handler
   - Implement `invitee.rescheduled` handler

3. **Event Type Mapping UI**
   - Add admin UI to map forms to event types
   - Store mappings in Firestore settings

4. **Calendly Widget Component**
   - Create reusable Calendly embed component
   - Support inline and popup modes
   - Handle scheduling completion callbacks

## QA Checklist

### OAuth Flow
- [ ] Admin can initiate OAuth connection
- [ ] OAuth callback successfully stores encrypted tokens
- [ ] Connection status displays correctly in settings page
- [ ] Admin can disconnect Calendly

### Token Management
- [ ] Tokens automatically refresh when expired
- [ ] Manual refresh endpoint works
- [ ] Encrypted tokens stored securely in Firestore

### Scheduling Links
- [ ] Scheduling link generation works for each form type
- [ ] Pre-filled data includes name, email, phone
- [ ] Inquiry ID passed as salesforce_uuid for tracking

### Webhooks
- [ ] Webhook signature verification works
- [ ] Webhook endpoint receives events (check logs)
- [ ] Events are logged for debugging

### Settings Page
- [ ] Connection status displays correctly
- [ ] Event types list loads and displays
- [ ] Webhook URL is shown correctly

Your plan is comprehensive, logical, and covers all the key areas: UI (sidebar), data structure (Firestore), and logic (form hooks & server actions).

I have one critical recommendation to fix a flaw in your Firestore structure, and a few minor optimizations to make your plan even cleaner and more professional.

1. Critical Flaw: The Firestore Collection Structure
Your plan correctly identifies the need for separation, but the proposed structure is technically ambiguous and clunky.

The Problem: Your plan says "Create three top-level collections: mediation, facilitation..." but then shows a path mediation/inquiries/{id}. In Firestore, a subcollection (inquiries) can only live on a document, not on a collection.

This means your path would have to be mediation/{some_doc_id}/inquiries/{id}, which is awkward. You would need to create dummy "holder" documents.

The "Best Practice" Solution: Instead of three separate top-level collections, create one top-level collection called serviceAreas. The documents inside this collection will be your three services. This is a much cleaner, more scalable, and standard Firestore pattern.

Here is the recommended Firestore structure:

serviceAreas/ (Collection)
  ├─ mediation/ (Document)
  │   ├─ inquiries/ (Subcollection)
  │   │   └─ {inquiryId}
  │   ├─ participants/ (Subcollection - for the future)
  │   └─ sessions/ (Subcollection - for the future)
  │
  ├─ facilitation/ (Document)
  │   ├─ inquiries/ (Subcollection)
  │   │   └─ {inquiryId}
  │   └─ participants/ (Subcollection - for the future)
  │
  └─ restorativePractices/ (Document)
      ├─ inquiries/ (Subcollection)
      │   └─ {inquiryId}
      └─ participants/ (Subcollection - for the future)
Why is this better?

It's logically correct. serviceAreas is a collection of "service area" documents.

It's more organized, grouping all your services under one parent.

It's more scalable. If you add a new service (e.g., "Training"), you just add a new document to serviceAreas.

2. Optimization: Centralize Server Actions
Your Plan (Step 9): src/app/(frontend)/(cms)/dashboard/[serviceArea]/inquiries/inquiry-actions.ts

The Problem: This creates a new server action file for every service area, which is a bit complex and repetitive.

The Fix: Create one server action file for all inquiry logic: src/lib/actions/inquiry-actions.ts. The functions inside will just take serviceArea as their first argument.

Example:

TypeScript

// src/lib/actions/inquiry-actions.ts
'use server'
import { ServiceArea } from '@/lib/service-area-config'
import { adminDb } from '@/lib/firebase-admin'

export async function markAsReviewed(serviceArea: ServiceArea, id: string) {
  const docPath = `serviceAreas/${serviceArea}/inquiries/${id}`;
  await adminDb.doc(docPath).update({ reviewed: true, /* ... */ });
  // ...
}
3. Recommendation: Data Migration
Your Plan (Step 10): You list "Option A (Migrate)" and "Option B (Dual Read)".

My Recommendation: I strongly recommend Option A: Migrate Existing Data.

Reason: Option B (Dual Read) is a temporary hack that will make your new dashboard pages complex, slow, and full of messy Promise.all() logic. It's classic technical debt.

The Fix: Take the one-time hit. Write a simple migration script (e.g., scripts/migrate-forms.ts and run it with npx tsx scripts/migrate-forms.ts) that reads all documents from the old structure, transforms them, and writes them to the new serviceAreas/.../inquiries structure. This will keep your new dashboard code 100% clean and fast.

Here is an idea that you can take and intergrate with your current plan to create the best outcome:

Restructure CMS Service Areas & Firestore (v2)

Overview

Restructure the dashboard and Firestore to support three distinct service areas (Mediation, Facilitation, Restorative Practices), each with their own inquiry tracking and future participant pipelines. This is a prerequisite for the Calendly integration.

New Firestore Collection Structure (Recommended)

Create a single top-level collection serviceAreas. Each service will be a document within this collection, containing its own inquiries subcollection.

serviceAreas/ (Collection)
  ├─ mediation/ (Document)
  │   ├─ inquiries/ (Subcollection)
  │   │   └─ {inquiryId}
  │   ├─ participants/ (Subcollection - Future)
  │   └─ sessions/ (Subcollection - Future)
  │
  ├─ facilitation/ (Document)
  │   ├─ inquiries/ (Subcollection)
  │   │   └─ {inquiryId}
  │   └─ participants/ (Subcollection - Future)
  │
  └─ restorativePractices/ (Document)
      ├─ inquiries/ (Subcollection)
      │   └─ {inquiryId}
      └─ participants/ (Subcollection - Future)


Form to Service Area Mapping

// src/lib/service-area-config.ts
export const FORM_TO_SERVICE_AREA = {
  'mediation-self-referral': 'mediation',
  'restorative-program-referral': 'restorativePractices',
  'group-facilitation-inquiry': 'facilitation',
} as const;

export type ServiceAreaId = keyof typeof FORM_TO_SERVICE_AREA;
export type ServiceArea = (typeof FORM_TO_SERVICE_AREA)[ServiceAreaId];

Implementation Steps
1. Create Service Area Configuration
File: src/lib/service-area-config.ts (new)

Define service area types and constants as shown above.

Export metadata (labels, icons, colors) for each service area (e.g., mediation: { label: 'Mediation', icon: 'handshake' }).

2. Update Dashboard Sidebar Navigation
File: src/app/(frontend)/(cms)/dashboard/layout.tsx (or nav-main.tsx)

Remove the current "Inquiries" section.

Add three new top-level nav sections (or a dropdown group):

Mediation (icon: handshake)

Inquiries → /dashboard/mediation/inquiries

Facilitation (icon: users)

Inquiries → /dashboard/facilitation/inquiries

Restorative Practices (icon: heart)

Inquiries → /dashboard/restorative-practices/inquiries

3. Create New Dashboard Inquiry Pages
File: src/app/(frontend)/(cms)/dashboard/mediation/inquiries/page.tsx

Server Component.

Fetches inquiries from serviceAreas/mediation/inquiries.

Renders the shared <InquiriesTable /> component.

File: src/app/(frontend)/(cms)/dashboard/facilitation/inquiries/page.tsx

Server Component.

Fetches inquiries from serviceAreas/facilitation/inquiries.

Renders the shared <InquiriesTable /> component.

File: src/app/(frontend)/(cms)/dashboard/restorative-practices/inquiries/page.tsx

Server Component.

Fetches inquiries from serviceAreas/restorativePractices/inquiries.

Renders the shared <InquiriesTable /> component.

4. Create New Inquiry Detail Pages
File: src/app/(frontend)/(cms)/dashboard/mediation/inquiries/[id]/page.tsx

Displays details from serviceAreas/mediation/inquiries/{id}.

Renders shared <InquiryDetailCard />.

File: src/app/(frontend)/(cms)/dashboard/facilitation/inquiries/[id]/page.tsx

Displays details from serviceAreas/facilitation/inquiries/{id}.

File: src/app/(frontend)/(cms)/dashboard/restorative-practices/inquiries/[id]/page.tsx

Displays details from serviceAreas/restorativePractices/inquiries/{id}.

5. Update Form Submission Hook
File: src/hooks/useFirestoreFormSubmit.ts (modify)

Change signature to useFirestoreFormSubmit(formType: ServiceAreaId)

Inside the hook, use the FORM_TO_SERVICE_AREA mapping to get the serviceArea.

Construct the collectionPath dynamically: const collectionPath = \serviceAreas/${serviceArea}/inquiries`;`

Add formType and initial status: 'submitted' to the data being saved.

6. Update Form Components
File: src/Forms/formDisplay/selfReferralForm.tsx (modify)

Update hook call: const { submitData } = useFirestoreFormSubmit('mediation-self-referral')

Update onSubmit: await submitData(data)

File: src/Forms/formDisplay/restorativeProgramReferralForm.tsx (modify)

Update hook call: const { submitData } = useFirestoreFormSubmit('restorative-program-referral')

Update onSubmit: await submitData(data)

7. Create Shared Inquiry Components
Directory: src/components/Dashboard/Inquiries/ (new)

InquiriesTable.tsx: Reusable table (Client Component) that takes submissions as a prop.

InquiryDetailCard.tsx: Reusable detail view.

InquiryStatusBadge.tsx: Component to show status with color-coding.

8. Create Centralized Server Actions
File: src/lib/actions/inquiry-actions.ts (new)

fetchInquiries(serviceArea: ServiceArea, ...): Fetches inquiries for a specific service.

getInquiryById(serviceArea: ServiceArea, id: string): Gets a single inquiry.

markAsReviewed(serviceArea: ServiceArea, id: string): Marks reviewed: true.

updateInquiryStatus(serviceArea: ServiceArea, id: string, status: string): Updates the status field.

9. Data Migration (Mandatory)
Action: Create a one-time migration script.

File: scripts/migrate-forms.ts (new)

Logic:

Initialize Firebase Admin SDK.

Query all docs from forms/mediationSelfReferral/submissions.

Loop through, transform data, and batch.set() to serviceAreas/mediation/inquiries/{id}.

Repeat for the other form types, mapping to their new destinations.

Run script once with npx tsx scripts/migrate-forms.ts.

10. Deprecate Old Inquiry Page
File: src/app/(frontend)/(cms)/dashboard/inquiry/page.tsx (modify)

Remove all data-fetching logic.

Add a Card with a message: "This page is deprecated. Please use the new service-specific dashboards in the sidebar."

(Optional) Add an auto-redirect.

Benefits for Calendly Integration
This restructuring is the correct foundation. The flow will now be:

User submits selfReferralForm.tsx.

Hook writes to serviceAreas/mediation/inquiries/{id} and returns the id.

Success UI calls getCalendlyLink('mediation', id).

Webhook receives submissionId and updates the correct doc: serviceAreas/mediation/inquiries/{id}.

PLEASE focus on Naming consistency now

Decide once and be consistent everywhere (Firestore, routes, types, UI):

Use either restorative-practices or restorativePractices. I’d pick kebab-case in URLs and camelCase in code/types. Please create a file you can reference in the future to refer back to mantain name consistency

