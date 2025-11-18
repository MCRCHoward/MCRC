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

- Initializes Admin SDK (shared across all functions).
- `getStaffUserIds()` scans `/users` for roles `admin` + `coordinator`.
- `createAdminTask()` and `createAdminActivity()` fan out tasks/activity feed entries.
- `onInquiryCreated` trigger (fires on `serviceAreas/{serviceId}/inquiries/{inquiryId}` `onCreate`):
  - Formats the participant name and service label.
  - Creates a “New inquiry” task and corresponding activity notice for every staff member.
- `onInquiryUpdated` trigger (fires `onUpdate`):
  - Detects status change to `intake-scheduled`.
  - Marks pending “new-inquiry” tasks as done.
  - Creates a future-dated “Intake call with …” task.
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
- `markTaskComplete(userId, taskId)` – sets `status: 'done'` and `completedAt`.
- `updateTaskPriority(userId, taskId, priority)` – lets staff re-triage tasks from the UI.

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

- Adds a **My Tasks** nav entry (points to `/dashboard/tasks`) so ICs have a home for their queue.
- Groups all service area inquiry links under a single “Service Areas” section (frees room in the sidebar as phases grow).
- Hides CMS-centric entries (Blog, Events, Newsletter, Donations, Roadmap) unless you’re an admin, keeping the coordinator view focused on case work.

### 2.11 Documentation Companion Files
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
| **Docs** | `how-it-works/masterList.md`, `Phase1Summary.md`, `Phase1Detailed.md` | Provide stakeholder-friendly (summary) and engineer-friendly (detailed) descriptions of everything above, ensuring onboarding for future phases is trivial. |

---

## 4. Development & Deployment Checklist

1. **Local install:** `pnpm install` (Node 20.11+ recommended).
2. **Firebase Functions:** `cd firebase-functions && npm install && npm run build && firebase deploy --only functions`.
3. **App build:** `pnpm build` (Next.js 15). Warnings for dynamic routes are expected due to authenticated dashboards.
4. **Testing to run after deploy:**
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

## 6. Cloud IAM Reference (Gen 2 Functions)

Keeping the Firebase Functions deploys healthy now requires a few extra service-account roles (due to Cloud Build, Artifact Registry, Eventarc, and Cloud Run). If someone rotates permissions, reapply this table.

| Service Account | Why we need it | Roles required |
| - | - | - |
| `676833247583-compute@developer.gserviceaccount.com` (Cloud Build execution SA) | Builds and deploys both Gen 1 + Gen 2 functions | `roles/artifactregistry.reader`, `roles/artifactregistry.writer`, `roles/storage.objectViewer`, `roles/logging.logWriter`, `roles/eventarc.eventReceiver`, `roles/run.invoker` |
| `service-676833247583@gcp-sa-eventarc.iam.gserviceaccount.com` | Eventarc plumbing for Gen 2 triggers | `roles/eventarc.serviceAgent` |
| `service-676833247583@serverless-robot-prod.iam.gserviceaccount.com` | Cloud Run service agent for Gen 2 | `roles/run.serviceAgent` *(auto-granted when enabling Cloud Run, but document here)* |
| Existing Firebase/GCF agents (`gcf-admin-robot`, `firestore`, `firebasestorage`, etc.) | Managed automatically but listed for completeness | Already granted by Firebase CLI; avoid removing |

If additional regions are introduced later, duplicate the Artifact Registry + Eventarc entries for those regions.

---

## 7. Observability & Alerts

- **Log-based metric:** `logging.googleapis.com/user/cloud_build_failures` tracks build errors (`resource.type="build"` + `severity>=ERROR`).
- **Notification channel:** email to `derrick@digitaldog.io` (Notification Channel ID `3518902315284297647`).
- **Alert policy:** `Cloud Build Failure Alert` (policy ID `14975516304770197532`) fires immediately when the metric increments, so IAM regressions or deploy issues are surfaced without watching the CLI.

---

## 8. CI Guard Rails for Functions

`firebase-functions/package.json` now includes:

- `npm run lint` → `tsc --noEmit`
- `npm run test` → runs the lint step (placeholder for future unit tests)
- `npm run deploy` → chains `lint → test → build → firebase deploy --only functions`

Every Gen 2 deploy now fails fast if the TypeScript layer regresses, keeping Cloud Functions aligned with the monorepo’s stricter standards.
