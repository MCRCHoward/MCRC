## Plan

### Goals
1. Create `/dashboard/tasks` route showing current user’s task queue (server component + client interactions).
2. Surface a live task count badge in the dashboard header (“matching visual cues”).
3. Keep architecture consistent with Phase 1 (reuse `task-actions.ts`, shared components).

### Key Workstreams

1. **Data plumbing**
   - Server component loader for `/dashboard/tasks` that calls `fetchTasks(user.id)` (filter `pending` first, optional `completed` tab later).
   - Add a lightweight client component for task interactions (mark complete, priority changes) reusing `markTaskComplete` & `updateTaskPriority`.
   - Consider pagination/limit (start with last 50).

2. **UI/UX**
   - Tasks board iteration (#2): add keyword search + filters (service area, type, priority) atop the existing table. Consider client-side filtering to avoid extra queries.
   - Dashboard stats: show “My pending tasks”, “New inquiries (7d)”, “Intakes scheduled (7d)” cards on `/dashboard` with links to the relevant views.
   - Header badge (already added) will consume the same pending count; keep UX consistent.

3. **Infrastructure**
   - Route location: `src/app/(frontend)/(cms)/dashboard/tasks/page.tsx`.
   - Server component with `dynamic = 'force-dynamic'` (tasks change often).
   - Optional client hook for optimistic updates (phase 2?).

### Risks / Mitigation
- **Task counts stale**: use `revalidatePath('/dashboard/tasks')` inside actions; header badge can use same server action (export `getPendingTaskCount`).
- **Permissions**: ensure only staff/admin can access route (parent layout already enforces). Add guard inside page to bail if not staff.
- **UI clutter**: keep initial version simple (Pending list). Completed tab can be deferred.

### Definition of Done
- `/dashboard/tasks` renders pending tasks for the signed-in staff/admin.
- “Pending tasks” badge appears in dashboard header and updates after marking a task done.
- Actions (mark complete + priority change) work end-to-end with revalidation.
