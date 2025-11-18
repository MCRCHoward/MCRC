# Phase 1 – Detailed Implementation Notes

This document is the engineering log for the Phase 1 release (“Initial Intake & Automated Scheduling”). It captures the exact runtime components we shipped, why they exist, and how they connect to guarantee that every new participant is captured, scheduled, and assigned to the Intake Coordinator (IC).

---

## 1. Phase 1 Scope Recap

1. Capture inquiries from all public-facing forms (mediation, facilitation, restorative practices, community education/training).
2. Persist each submission under the unified `serviceAreas/{serviceId}/inquiries/{inquiryId}` hierarchy with consistent metadata.
3. Automatically fan out staff tasks and timeline updates for each new case.
4. Redirect submitters to a thank-you experience that doubles as the self-service Calendly scheduler.
5. Listen for Calendly webhooks, update the inquiry status/timestamps, and roll the task queue forward so the IC always knows the next action.

---

## 2. Newly Created Files (What They Do)

### 2.1 `firebase-functions/package.json`
Defines the standalone Firebase Functions workspace. It locks dependencies (`firebase-admin`, `firebase-functions`) and scripts (`build`, `serve`, `deploy`) so we can compile TypeScript to the `lib/` folder and deploy server-side automation safely.

### 2.2 `firebase-functions/tsconfig.json`
Compiles the functions project with strict settings (`ES2021`, `CommonJS`, `rootDir: src`, `outDir: lib`). Ensures Admin SDK types are available and emitted JS matches Firebase’s runtime.

### 2.3 `firebase-functions/src/index.ts`
> The automation brain for Phase 1

- **Gen 2 Migration:** Functions were migrated from Gen 1 (`firebase-functions/v1`) to Gen 2 (`firebase-functions/v2/firestore`) for improved scalability, better regional control, and alignment with Firebase's modern runtime. Global options are set via `setGlobalOptions({ region: 'us-central1', maxInstances: 20 })`.
- Initializes Admin SDK (shared across all functions).
- `getStaffUserIds()` scans `/users` for roles `admin` + `coordinator`.
- `createAdminTask()` and `createAdminActivity()` fan out tasks/activity feed entries.
- `onInquiryCreated` trigger (fires on `serviceAreas/{serviceId}/inquiries/{inquiryId}` `onCreate`):
  - Formats the participant name and service label.
  - Creates a "New inquiry" task and corresponding activity notice for every staff member.
- `onInquiryUpdated` trigger (fires `onUpdate`):
  - Detects status change to `intake-scheduled`.
  - Marks pending "new-inquiry" tasks as done.
  - Creates a future-dated "Intake call with …" task.
  - Posts an activity update quoting the participant name.

### 2.4 `src/lib/actions/calendly-actions.ts`
Server action used only by the thank-you page:

- Reads the inquiry document via Admin SDK (guaranteed latest data).
- Fetches `settings/calendly` configuration (event type mapping).
- Resolves service area slug (`mediation`, `facilitation`, etc.) to the correct Calendly event URL.
- Builds a tracking link that embeds `tracking[salesforce_uuid]=inquiryId`, plus participant name/email.
- Returns `{ calendlyUrl, participantName, participantEmail, serviceArea }` to the UI.

### 2.5 `src/components/CalendlyWidget.tsx`
Client component that wraps Calendly’s inline widget script. It:

- Injects the Calendly script once per page load.
- Renders the `<div class="calendly-inline-widget" data-url="...">`.
- Accepts a `height` prop (defaults to 760px) so the scheduler displays correctly in modals/cards.

### 2.6 `src/app/(frontend)/(default)/getting-started/thank-you/page.tsx`
> Participant-facing thank-you and scheduling page.

- Reads `serviceArea` and `inquiryId` from query params (sent by the forms).
- Calls `getCalendlyLink()` to fetch the pre-filled scheduling URL.
- Displays participant-friendly copy (“Thank you, [FirstName]”) and contact instructions.
- Renders `<CalendlyWidget calendlyUrl={...} />` beside status info.
- Handles all error states (missing params, missing settings, etc.) with friendly cards.

### 2.7 `src/lib/actions/task-actions.ts`
Admin-only server actions for the dashboard UI (future phases) to read/update tasks:

- `fetchTasks(userId, { status, limit })` – ensures requester is either the owner or an admin, returns serialized task models.
- `markTaskComplete(userId, taskId)` – sets `status: 'done'` and `completedAt`, then revalidates `/dashboard/tasks` and `/dashboard` paths to refresh UI.
- `updateTaskPriority(userId, taskId, priority)` – lets staff re-triage tasks from the UI, then revalidates `/dashboard/tasks` to refresh UI.
- `getPendingTaskCount(userId)` – returns the count of pending tasks for a user, used by the dashboard stats card and header badge.

### 2.8 `src/lib/actions/activity-actions.ts`
Mirrors the structure of `task-actions`, but for the activity feed:

- `fetchActivity(userId, { unreadOnly, limit })`.
- `markActivityRead(userId, activityId)` and `markAllActivityRead(userId)`.
- Uses the same authorization checks (`requireAuth` + same-user-or-admin guard).

### 2.9 `src/components/notifications/SideDrawer.tsx`
Full client-side experience for the Notifications drawer:

- Accepts `userId` and a `renderTrigger` prop, so `NavUser` can embed it in the dropdown.
- Loads activity entries via `fetchActivity`.
- Displays unread counts, auto-refresh, and “Mark all read”.
- Responds to click by marking the item read and routing to the inquiry link.

### 2.10 `src/app/(frontend)/(cms)/dashboard/layout.tsx` + supporting files
Updated to pass `user.id` and `user.role` to `NavUser`, so the SideDrawer has context. The Phase 1 UI refresh also:

- Adds a **My Tasks** nav entry and page header badge (with live count) so ICs can jump straight to their queue.
- **Service Pipeline Structure:** Each service (Mediation, Facilitation, Restorative Practices) is now its own top-level sidebar item with five pipeline stages as sub-items:
  - Overview (landing page for the service)
  - Inquiries (existing inquiry management)
  - Intake Queue (placeholder for Phase 2+)
  - Scheduling (placeholder for Phase 2+)
  - Activity Log (placeholder for Phase 2+)
- Hides CMS-centric entries (Blog, Events, Newsletter, Donations, Roadmap) unless you're an admin, keeping the coordinator view focused on case work.
- **Sidebar Header:** Replaced the TeamSwitcher dropdown with a direct link to `/dashboard`. The header subtitle dynamically displays the user's formatted role (e.g., "Intake Coordinator") when on `/dashboard`, and "Back to dashboard" on all other routes.

### 2.11 `src/components/Dashboard/ServicePipelinePlaceholder.tsx`
Reusable placeholder component for pipeline stages that aren't yet implemented:

- Accepts `serviceName`, `stageName`, and optional `description`/`children` props.
- Renders a consistent "Coming soon" card with service-specific messaging.
- Used across all three services for Intake Queue, Scheduling, and Activity Log pages until those workflows are built in future phases.

### 2.12 `src/app/(frontend)/(cms)/layout.tsx` (CMS Root Layout)
Parent layout that wraps all CMS routes:

- Enforces authentication (redirects to `/login` if unauthenticated).
- Wraps children with `NuqsAdapter` from `nuqs/adapters/next/app` to enable URL-aware query state hooks (`useQueryState`, `useQueryStates`) throughout the CMS section. This powers the task board's shareable filter URLs and other query-parameter-driven features.

### 2.13 Documentation Companion Files
- `how-it-works/masterList.md` – canonical overview + status table for the whole pipeline.
- `how-it-works/Pipeline/Phase-1/Phase1Summary.md` – plain-language summary (5th-grade reading level).
- `how-it-works/Pipeline/Phase-1/Phase1Detailed.md` (this file) – deep technical log.

---

## 3. How the Files Relate

| Area | Files | Relationship |
|------|-------|--------------|
| **Inquiry Intake** | `src/hooks/useFirestoreFormSubmit.ts`, the four form components under `src/Forms/formDisplay/` | Forms call the hook → Firestore writes under `serviceAreas/{serviceArea}/inquiries/{inquiryId}` → returns `submissionId` → router pushes participants to `/getting-started/thank-you`. |
| **Thank You + Scheduling** | `src/app/(frontend)/(default)/getting-started/thank-you/page.tsx`, `src/lib/actions/calendly-actions.ts`, `src/components/CalendlyWidget.tsx` | The page calls the action, receives the Calendly URL, and hands it to the widget. If the action fails (settings missing, inquiry missing), the page shows a fallback message. |
| **Automation (Tasks & Activity)** | `firebase-functions/src/index.ts`, `firebase-functions/package.json`, `firebase-functions/tsconfig.json` | When a document is created/updated, the functions run. They depend on the consistent Firestore schema set up by the hook/forms. The output is written to `users/{userId}/tasks` and `users/{userId}/activity`. |
| **Dashboard Consumption** | `src/lib/actions/task-actions.ts`, `src/lib/actions/activity-actions.ts`, `src/components/notifications/SideDrawer.tsx`, `src/components/Dashboard/nav-user.tsx` | Server actions read/write the collections populated by the Cloud Functions. `NavUser` provides the authenticated `user.id`, and `SideDrawer` renders the data, letting staff acknowledge notifications. |
| **Service Pipeline UI** | `src/app/(frontend)/(cms)/dashboard/layout.tsx`, `src/components/Dashboard/ServicePipelinePlaceholder.tsx`, service-specific pages under `/dashboard/{service}/{stage}/` | The layout defines the navigation structure (each service as a top-level item with pipeline stages as sub-items). Placeholder pages use the shared component to provide consistent "coming soon" experiences until future phases implement the workflows. |
| **URL State Management** | `src/app/(frontend)/(cms)/layout.tsx` (NuqsAdapter), `nuqs` package, `use-debounce` package | `NuqsAdapter` enables URL-aware query state hooks throughout the CMS. The task board uses `useQueryState` for filters/search/sort, syncing to URL params so views are shareable. Debounced search input prevents excessive URL updates. |
| **Docs** | `how-it-works/masterList.md`, `Phase1Summary.md`, `Phase1Detailed.md` | Provide stakeholder-friendly (summary) and engineer-friendly (detailed) descriptions of everything above, ensuring onboarding for future phases is trivial. |

---

## 4. Development & Deployment Checklist

1. **Local install:** `pnpm install` (Node 20.11+ recommended).
2. **Firestore indexes:** `firebase deploy --only firestore:indexes` (required before dashboard queries will work).
3. **Firebase Functions:** `cd firebase-functions && npm install && npm run build && firebase deploy --only functions`.
4. **App build:** `pnpm build` (Next.js 15). Warnings for dynamic routes are expected due to authenticated dashboards.
5. **Testing to run after deploy:**
   - Submit each public form → verify a new document appears under the proper service area.
   - Confirm tasks/activity documents are created for admin + coordinator accounts.
   - Ensure `/getting-started/thank-you?serviceArea=...&inquiryId=...` loads and renders Calendly.
   - Simulate a Calendly webhook (`invitee.created`) → verify inquiry status changes and tasks update.

---

## 5. Future Work Hooks

- `task-actions.ts` and `activity-actions.ts` are intentionally generic so we can plug them into dashboards (“Task board”, “Activity timeline”) without reworking permissions.
- `onInquiryUpdated` can be extended for additional statuses (e.g., `intake-completed`, `session-scheduled`) by branching on `afterStatus`.
- Documentation files under `how-it-works/` follow a predictable naming pattern so each future phase can replicate this template.

Phase 1 gives us the always-on foundation. Everything else (intake outcomes, participant onboarding, evaluations) will build on the same service area → task/activity scaffolding described above.

---

## 6. Firestore Indexes

Phase 1 queries require specific indexes to avoid `FAILED_PRECONDITION` errors. All indexes are defined in `firestore.indexes.json` and deployed via `firebase deploy --only firestore:indexes`:

- **Tasks collection group index:** `status` (ASC) + `createdAt` (DESC) + `__name__` (DESC) — enables efficient filtering and sorting of user tasks by status and creation date.
- **Inquiries collection group field override:** `submittedAt` with both ASC and DESC single-field indexes at `COLLECTION_GROUP` scope — required for the dashboard stats query that aggregates inquiries from the last 7 days across all service areas.

The `fieldOverrides` section explicitly defines the `inquiries.submittedAt` indexes because Firestore requires explicit collection group indexes for queries that span multiple collections (e.g., `collectionGroup('inquiries').where('submittedAt', '>=', threshold)`).

---

## 7. Cloud IAM Reference (Gen 2 Functions)

Keeping the Firebase Functions deploys healthy now requires a few extra service-account roles (due to Cloud Build, Artifact Registry, Eventarc, and Cloud Run). If someone rotates permissions, reapply this table.

| Service Account | Why we need it | Roles required |
| - | - | - |
| `676833247583-compute@developer.gserviceaccount.com` (Cloud Build execution SA) | Builds and deploys both Gen 1 + Gen 2 functions | `roles/artifactregistry.reader`, `roles/artifactregistry.writer`, `roles/storage.objectViewer`, `roles/logging.logWriter`, `roles/eventarc.eventReceiver`, `roles/run.invoker` |
| `service-676833247583@gcp-sa-eventarc.iam.gserviceaccount.com` | Eventarc plumbing for Gen 2 triggers | `roles/eventarc.serviceAgent` |
| `service-676833247583@serverless-robot-prod.iam.gserviceaccount.com` | Cloud Run service agent for Gen 2 | `roles/run.serviceAgent` *(auto-granted when enabling Cloud Run, but document here)* |
| Existing Firebase/GCF agents (`gcf-admin-robot`, `firestore`, `firebasestorage`, etc.) | Managed automatically but listed for completeness | Already granted by Firebase CLI; avoid removing |

If additional regions are introduced later, duplicate the Artifact Registry + Eventarc entries for those regions.

---

## 8. Observability & Alerts

- **Log-based metric:** `logging.googleapis.com/user/cloud_build_failures` tracks build errors (`resource.type="build"` + `severity>=ERROR`).
- **Notification channel:** email to `derrick@digitaldog.io` (Notification Channel ID `3518902315284297647`).
- **Alert policy:** `Cloud Build Failure Alert` (policy ID `14975516304770197532`) fires immediately when the metric increments, so IAM regressions or deploy issues are surfaced without watching the CLI.

---

## 9. CI Guard Rails for Functions

`firebase-functions/package.json` now includes:

- `npm run lint` → `tsc --noEmit`
- `npm run test` → runs the lint step (placeholder for future unit tests)
- `npm run deploy` → chains `lint → test → build → firebase deploy --only functions`

Every Gen 2 deploy now fails fast if the TypeScript layer regresses, keeping Cloud Functions aligned with the monorepo’s stricter standards.

---

## 10. Task Board & Dashboard Iteration

- **New `/dashboard/tasks` route** fetches pending + recently completed tasks server-side, then renders a client-side board with search, service area/type/priority filters, inline priority editing, and "mark done" actions.
- **Filters are URL-aware** via `nuqs`, so ICs can share deep links such as `/dashboard/tasks?service=mediation&priority=high`. Search text syncs (debounced via `use-debounce`) to `?q=`, dropdowns to `?service`, `?type`, `?priority`, and the sort control to `?sort`. The `NuqsAdapter` in the CMS root layout enables these hooks throughout the section.
- **Sorting presets** keep the list actionable: we default to "Due date (soonest)" and let ICs toggle "Priority (High → Low)" or "Recently assigned". Additional toggles (e.g., due-date ranges) can piggyback off the same query-state plumbing if staff requests it.
- **Dashboard stats cards** now highlight intake health: "My Pending Tasks" (staff-only, powered by `getPendingTaskCount()`), "New Inquiries (7d)", and "Intakes Scheduled (7d)" — all backed by Firestore snapshots so Phase 1 data surfaces immediately when staff lands on `/dashboard`.
- **Task action revalidation:** `markTaskComplete` and `updateTaskPriority` call `revalidatePath('/dashboard/tasks')` and `revalidatePath('/dashboard')` to ensure the UI reflects changes immediately without manual refresh.

---

## 11. Service Pipeline Structure & Placeholder Pages

Each service (Mediation, Facilitation, Restorative Practices) now has a dedicated navigation structure with five pipeline stages:

1. **Overview** (`/dashboard/{service}`) – Landing page for the service, currently using `ServicePipelinePlaceholder` with service-specific messaging.
2. **Inquiries** (`/dashboard/{service}/inquiries`) – Existing inquiry management tables (functional).
3. **Intake Queue** (`/dashboard/{service}/intake`) – Placeholder page for Phase 2+ intake workflow.
4. **Scheduling** (`/dashboard/{service}/scheduling`) – Placeholder page for Phase 2+ scheduling management.
5. **Activity Log** (`/dashboard/{service}/activity`) – Placeholder page for Phase 2+ activity timeline.

All placeholder pages use the shared `ServicePipelinePlaceholder` component for consistency. The navigation structure is defined in `src/app/(frontend)/(cms)/dashboard/layout.tsx` as `serviceNavItems`, which are spread into the main navigation array. This structure makes it clear where future pipeline features will live and provides a consistent UX pattern across all three services.
