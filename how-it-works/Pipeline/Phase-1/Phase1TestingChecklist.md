# Phase 1 Production Testing Checklist

This document lists all URLs and features to test in production after Phase 1 deployment.

**Base URL:** Replace `https://mcrchoward.org` with your production domain.

---

## 1. Authentication & Access Control

### ✅ Test Authentication Flow
- [ ] `/login` - Login page loads correctly
- [ ] Unauthenticated user accessing `/dashboard` redirects to `/login`
- [ ] Authenticated user can access `/dashboard`
- [ ] Staff/admin users see appropriate navigation items
- [ ] Non-staff users don't see "My Tasks" or service pipeline sections

---

## 2. Dashboard Landing Page

### ✅ Main Dashboard (`/dashboard`)
- [ ] Page loads without errors
- [ ] Sidebar header shows user's role (e.g., "Intake Coordinator") when on `/dashboard`
- [ ] Sidebar header shows "Back to dashboard" on other routes
- [ ] **Stats Cards Display:**
  - [ ] "My Pending Tasks" card shows correct count (staff users only)
  - [ ] "New Inquiries (7d)" card shows inquiries from last 7 days
  - [ ] "Intakes Scheduled (7d)" card shows scheduled intakes from last 7 days
- [ ] Stats cards link to appropriate pages
- [ ] Header badge shows pending task count (staff users only)
- [ ] Header badge links to `/dashboard/tasks`

---

## 3. Task Board (`/dashboard/tasks`)

### ✅ Basic Functionality
- [ ] Page loads and displays user's tasks
- [ ] Pending tasks are shown by default
- [ ] Tasks display correct information (title, service area, type, priority, due date)

### ✅ Search Functionality
- [ ] Search input field is visible
- [ ] Typing in search filters tasks in real-time (debounced)
- [ ] Search query appears in URL as `?q=searchterm`
- [ ] Sharing URL with `?q=` parameter shows filtered results

### ✅ Filter Functionality
- [ ] Service Area filter dropdown works (All, Mediation, Facilitation, Restorative Practices)
- [ ] Type filter dropdown works (All, New Inquiry, Intake Call, etc.)
- [ ] Priority filter dropdown works (All, High, Medium, Low)
- [ ] Filters appear in URL (`?service=mediation&type=new-inquiry&priority=high`)
- [ ] Sharing filtered URL shows same filtered view
- [ ] Multiple filters can be combined

### ✅ Sorting Functionality
- [ ] Sort dropdown has options: "Due date (soonest)", "Priority (High → Low)", "Recently assigned"
- [ ] Sorting works correctly for each option
- [ ] Sort preference appears in URL as `?sort=dueSoon` (or `priorityHigh`, `recent`)
- [ ] Sharing sorted URL shows same sorted view

### ✅ Task Actions
- [ ] "Mark Complete" button works and updates task status
- [ ] Completed tasks disappear from pending list
- [ ] Priority can be changed via dropdown
- [ ] Task count updates immediately after marking complete
- [ ] Dashboard stats refresh after task actions

### ✅ URL Sharing Test Cases
- [ ] `/dashboard/tasks?service=mediation&priority=high` - Shows only high-priority mediation tasks
- [ ] `/dashboard/tasks?q=john&type=new-inquiry` - Shows tasks matching "john" and type filter
- [ ] `/dashboard/tasks?sort=priorityHigh` - Shows tasks sorted by priority
- [ ] `/dashboard/tasks?service=facilitation&priority=high&sort=dueSoon` - Combined filters and sort

---

## 4. Service Pipeline Pages

### ✅ Mediation Service
- [ ] `/dashboard/mediation` - Overview page loads (placeholder)
- [ ] `/dashboard/mediation/inquiries` - Inquiries table loads and displays data
- [ ] `/dashboard/mediation/inquiries/[id]` - Individual inquiry detail page loads
- [ ] `/dashboard/mediation/intake` - Intake Queue placeholder page loads
- [ ] `/dashboard/mediation/scheduling` - Scheduling placeholder page loads
- [ ] `/dashboard/mediation/activity` - Activity Log placeholder page loads

### ✅ Facilitation Service
- [ ] `/dashboard/facilitation` - Overview page loads (placeholder)
- [ ] `/dashboard/facilitation/inquiries` - Inquiries table loads and displays data
- [ ] `/dashboard/facilitation/inquiries/[id]` - Individual inquiry detail page loads
- [ ] `/dashboard/facilitation/intake` - Intake Queue placeholder page loads
- [ ] `/dashboard/facilitation/scheduling` - Scheduling placeholder page loads
- [ ] `/dashboard/facilitation/activity` - Activity Log placeholder page loads

### ✅ Restorative Practices Service
- [ ] `/dashboard/restorative-practices` - Overview page loads (placeholder)
- [ ] `/dashboard/restorative-practices/inquiries` - Inquiries table loads and displays data
- [ ] `/dashboard/restorative-practices/inquiries/[id]` - Individual inquiry detail page loads
- [ ] `/dashboard/restorative-practices/intake` - Intake Queue placeholder page loads
- [ ] `/dashboard/restorative-practices/scheduling` - Scheduling placeholder page loads
- [ ] `/dashboard/restorative-practices/activity` - Activity Log placeholder page loads

### ✅ Placeholder Pages
- [ ] All placeholder pages show "Coming soon" message
- [ ] Placeholder pages display correct service name and stage name
- [ ] Placeholder pages have consistent styling

---

## 5. Navigation & Sidebar

### ✅ Sidebar Navigation
- [ ] "My Tasks" appears in sidebar for staff users
- [ ] "My Tasks" does NOT appear for non-staff users
- [ ] Each service (Mediation, Facilitation, Restorative Practices) appears as top-level item
- [ ] Each service expands to show 5 sub-items (Overview, Inquiries, Intake Queue, Scheduling, Activity Log)
- [ ] CMS items (Blog, Events, etc.) only appear for admin users
- [ ] "Users" section appears for staff users
- [ ] "Settings" section appears for admin users only
- [ ] Sidebar collapses/expands correctly

### ✅ Breadcrumbs
- [ ] Breadcrumbs display correctly on all pages
- [ ] Breadcrumbs are clickable and navigate correctly

---

## 6. Form Submission & Thank You Flow

### ✅ Form Submission
- [ ] Submit mediation inquiry form → redirects to thank you page
- [ ] Submit facilitation inquiry form → redirects to thank you page
- [ ] Submit restorative practices inquiry form → redirects to thank you page
- [ ] Form data is saved to Firestore under correct service area

### ✅ Thank You Page (`/getting-started/thank-you`)
- [ ] Page loads with correct `serviceArea` and `inquiryId` query params
- [ ] Participant name displays correctly
- [ ] Calendly widget loads and displays
- [ ] Calendly URL is pre-filled with correct tracking parameters
- [ ] Error handling works if inquiry is missing
- [ ] Error handling works if Calendly settings are missing

### ✅ Test URLs
- [ ] `/getting-started/thank-you?serviceArea=mediation&inquiryId=TEST123`
- [ ] `/getting-started/thank-you?serviceArea=facilitation&inquiryId=TEST123`
- [ ] `/getting-started/thank-you?serviceArea=restorative-practices&inquiryId=TEST123`

---

## 7. Automated Task Creation

### ✅ After Form Submission
- [ ] New inquiry creates tasks for all staff users (admin + coordinator roles)
- [ ] Tasks appear in `/dashboard/tasks` for each staff member
- [ ] Activity feed entries are created for staff users
- [ ] Task title includes participant name and service area

### ✅ After Calendly Scheduling
- [ ] When intake is scheduled via Calendly webhook:
  - [ ] Inquiry status updates to `intake-scheduled`
  - [ ] Old "New inquiry" tasks are marked complete
  - [ ] New "Intake call with [Name]" task is created
  - [ ] Activity feed entry is created
  - [ ] Task due date is set to intake call date

---

## 8. Activity Feed & Notifications

### ✅ Activity Feed
- [ ] Activity feed loads in notifications drawer
- [ ] Unread count displays correctly
- [ ] Clicking activity item marks it as read
- [ ] "Mark all read" button works
- [ ] Activity items link to correct inquiry pages
- [ ] Activity feed auto-refreshes

---

## 9. Error Handling & Edge Cases

### ✅ Missing Data
- [ ] Dashboard loads gracefully if no inquiries exist
- [ ] Dashboard loads gracefully if no tasks exist
- [ ] Stats cards show "0" when no data
- [ ] Task board shows empty state message when no tasks match filters

### ✅ Permission Errors
- [ ] Non-staff users cannot access `/dashboard/tasks`
- [ ] Non-admin users cannot access CMS sections
- [ ] Users can only see their own tasks

### ✅ Invalid URLs
- [ ] Invalid inquiry ID shows appropriate error
- [ ] Missing query params on thank you page show error message
- [ ] Invalid filter values don't break the page

---

## 10. Performance & UX

### ✅ Loading States
- [ ] Pages show loading states appropriately
- [ ] Task actions show loading feedback
- [ ] No flash of unstyled content

### ✅ Responsive Design
- [ ] Dashboard works on mobile devices
- [ ] Sidebar collapses appropriately on small screens
- [ ] Task board is usable on tablets
- [ ] Tables are scrollable on mobile

### ✅ Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

---

## 11. Integration Points

### ✅ Calendly Integration
- [ ] Calendly webhook endpoint receives events (`/api/calendly/webhook`)
- [ ] Webhook updates inquiry status correctly
- [ ] Webhook creates new tasks correctly
- [ ] Calendly settings page loads (`/dashboard/settings/calendly`)

### ✅ Firestore Queries
- [ ] Dashboard stats query works (7-day inquiry aggregation)
- [ ] Task queries work with filters
- [ ] Inquiry queries work across service areas
- [ ] No `FAILED_PRECONDITION` errors (indexes deployed)

---

## 12. Quick Smoke Test (5-minute check)

If you only have 5 minutes, test these critical paths:

1. [ ] Login → `/dashboard` → Stats cards display
2. [ ] `/dashboard/tasks` → Search works → Filter works → Mark task complete
3. [ ] `/dashboard/mediation/inquiries` → Click inquiry → Detail page loads
4. [ ] Submit test form → Thank you page → Calendly loads
5. [ ] Check sidebar navigation → All service sections expand correctly

---

## Notes

- **Base URL:** Update all URLs above with your production domain
- **Test Users:** Ensure you have test accounts with different roles (admin, coordinator, participant)
- **Test Data:** Create test inquiries and tasks before testing
- **Calendly:** Ensure Calendly webhook is configured in production
- **Firestore Indexes:** Verify indexes are deployed (`firebase deploy --only firestore:indexes`)

---

## Issues Found

Document any issues found during testing:

1. **Issue:** [Description]
   - **URL:** [URL where issue occurred]
   - **Steps to reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]

---

**Last Updated:** [Date]
**Tested By:** [Name]
**Environment:** Production

