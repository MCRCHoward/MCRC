# MCRC Case Management Pipeline - Master List

This document is the single source of truth for the MCRC case management pipeline. It details the logic, data flow, and file architecture for the system, starting with Phase 1.

## Delivery Status

- **Phase 1 – Initial Intake & Automated Scheduling:** ✅ Completed (Nov 17, 2025)
- **Next Phases:** 🚧 Not started (Intake outcomes, participant onboarding, case progression, evaluations, reporting)

## Core Problem to Solve

Participants are lost due to a lack of follow-up. The system must create a clear, actionable, and persistent workflow for the Intake Coordinator (IC) to manage every case from first contact to final resolution.

## Core Architecture

This system is built on an event-driven, task-based model.

- **Task System (IC To-Do List):** An IC's actionable workload (e.g., "Follow-up with P1").
- **Activity System (Activity Feed):** A real-time log of informational updates (e.g., "P1 scheduled their call.").

## Core Data Structures

### 1. Service Areas (Case Files)
- **Path:** `serviceAreas/{serviceId}/inquiries/{inquiryId}`
- **Purpose:** Stores the "case file" for each inquiry. `serviceId` values include `mediation`, `facilitation`, etc.
- **Key Fields:**
  - `formData`: Full submitted form payload
  - `status`: `submitted`, `intake-scheduled`, `in-progress`, `closed`, etc.
  - `submittedAt`: Timestamp of submission
  - `calendlyScheduling`: `{ eventUri, inviteeUri, scheduledTime }`

### 2. User Tasks (IC To-Do List)
- **Path:** `users/{staffUserId}/tasks/{taskId}`
- **Purpose:** Personal to-do list for each staff member (admins + coordinators).
- **Fields:**
  - `title`
  - `type`: `new-inquiry`, `intake-call`, `follow-up`, `review-evals`
  - `status`: `pending` | `done`
  - `priority`: `low` | `medium` | `high`
  - `serviceArea`
  - `inquiryId`
  - `link`: e.g., `/dashboard/mediation/inquiries/{inquiryId}`
  - `assignedTo`
  - `createdAt`
  - `due`
  - `completedAt`

### 3. User Activity (SideDrawer Feed)
- **Path:** `users/{staffUserId}/activity/{activityId}`
- **Purpose:** Real-time informational updates powering the CMS SideDrawer.
- **Fields:**
  - `message`
  - `link`
  - `inquiryId`
  - `read`
  - `createdAt`

## Phase 1: Initial Intake & Automated Scheduling

This phase covers the flow from the moment a participant (P1) submits a form to the moment their intake call is scheduled and the IC is notified.

**Status:** ✅ Delivered and deployed to Firestore + Next.js codebase (Nov 17, 2025)

### Step 1: Form Submission (Client)
- **File:** `src/Forms/formDisplay/selfReferralForm.tsx`
- Multi-step form with `zodResolver` validation. Final submit triggers `onSubmit` inside the component.

### Step 2: Form Saved to Firestore
- **File:** `src/hooks/useFirestoreFormSubmit.ts`
- `submitData`:
  1. Ensures auth via `signInAnonymously`
  2. Writes to `serviceAreas/{serviceArea}/inquiries`
  3. Stores metadata (`status: 'submitted'`, `formType`, etc.)
  4. Returns `{ success: true, submissionId }`

### Step 3: Automated Task/Activity Creation (Backend)
- **File:** `firebase-functions/src/index.ts`
- `onInquiryCreated` trigger:
  1. Runs on `serviceAreas/{serviceId}/inquiries/{inquiryId}` `onCreate`
  2. Uses helper `getStaffUserIds()` to find all admins/coordinators
  3. Calls `createAdminTask()` to fan out tasks to `users/{staff}/tasks`
  4. Calls `createAdminActivity()` to fan out activity to `users/{staff}/activity`

### Step 4: Redirect to Thank You Page (Client)
- **File:** `src/Forms/formDisplay/selfReferralForm.tsx`
- After `submitData` resolves, use `useRouter().push(/getting-started/thank-you?serviceArea=...&inquiryId=...)`

### Step 5: Thank You Page & Calendly Embed
- **Files:**
  - `src/app/(frontend)/(default)/getting-started/thank-you/page.tsx`
  - `src/lib/actions/calendly-actions.ts`
  - `src/components/CalendlyWidget.tsx`
- Flow:
  1. Server Component reads query params
  2. Calls `getCalendlyLink()` server action (fetches settings + inquiry data)
  3. Passes generated URL to `<CalendlyWidget />` for embed

### Step 6: Calendly Webhook & Task Management
- **Files:**
  - `src/app/api/calendly/webhook/route.ts`
  - `firebase-functions/src/index.ts` (`onInquiryUpdated` trigger)
- Flow:
  1. Webhook verifies signature and extracts `inquiryId`
  2. Updates inquiry (`status`, `calendlyScheduling` info)
  3. Firestore update triggers `onInquiryUpdated`
  4. Function closes initial task (`type: 'new-inquiry'`) and creates next task (`type: 'intake-call'`)
  5. Activity created: "[Name] has scheduled their intake."

## Future Phases
- Intake call outcomes, participant onboarding, case progression, evaluation reviews, and reporting dashboards will extend this foundation.
