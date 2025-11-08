# TODO - Incomplete Features

This document tracks all incomplete features, placeholders, and missing implementations found across the codebase.

## High Priority

### Blog Fetching Diagnostics and Optimization
- **Status**: ✅ **COMPLETED**
- **Description**: Comprehensive diagnosis and optimization of blog post fetching from Firestore.
- **Implementation Details**:
  - ✅ **Enhanced Error Logging**: Added detailed error logging to `fetchPosts` with query details, result counts, and validation. Logs distinguish between missing indexes, missing data, permission errors, and network/timeout errors.
  - ✅ **Data Structure Validation**: Added `validatePostStructure` function to check required fields (id, slug, _status, title). Invalid posts are filtered out with warning logs.
  - ✅ **Firestore Indexes Documentation**: Created `firestore.indexes.json` documenting all required composite indexes for blog queries:
    - `_status + publishedAt` (descending)
    - `_status + createdAt` (descending)
    - `_status + featured + publishedAt` (descending)
    - `_status + categories + publishedAt` (descending)
    - `slug + _status`
    - `_status + categories` (array-contains-any)
  - ✅ **Removed Duplicate Code**: Removed duplicate `fetchPosts`, `fetchFeaturedPost`, `fetchPostBySlug`, `fetchRelatedPosts`, and `fetchCategories` functions from `firebase-api.ts`. All blog functions now use `firebase-api-blog.ts` with re-exports for backward compatibility.
  - ✅ **Admin SDK Verification**: Added `verifyAdminSDKInitialization()` and `healthCheckAdminSDK()` functions to verify Admin SDK initialization and environment variables. Logs diagnostic information in development mode.
  - ✅ **Blog Page Error Handling**: Enhanced `blog/page.tsx` with detailed error logging, Admin SDK verification, and warnings for empty results. Added validation for posts missing required fields.
  - ✅ **Diagnostic Utilities**: Created `src/lib/blog-diagnostics.ts` with comprehensive diagnostic functions:
    - `validatePostStructure()` - Validates post data structure
    - `testAdminSDKConnection()` - Tests Admin SDK connection
    - `diagnoseBlogFetching()` - Comprehensive diagnostic for blog fetching
    - `checkFirestoreIndexes()` - Tests if required indexes work
- **Files Modified**:
  - `src/lib/firebase-api-blog.ts` - Enhanced error logging, validation, and query optimization
  - `src/lib/firebase-api.ts` - Removed duplicates, added re-exports
  - `src/lib/firebase-admin.ts` - Added initialization verification
  - `src/app/(frontend)/(default)/blog/page.tsx` - Enhanced error handling and logging
  - `src/lib/blog-diagnostics.ts` - New diagnostic utility (created)
  - `firestore.indexes.json` - New index documentation (created)
- **Troubleshooting Guide**:
  - If no posts appear on `/blog`:
    1. Check Firestore console for posts with `_status="published"`
    2. Verify required indexes exist (see `firestore.indexes.json`)
    3. Check Admin SDK environment variables are set correctly
    4. Review server logs for detailed error messages
    5. Use `diagnoseBlogFetching()` function in development mode
  - Common issues:
    - Missing Firestore indexes: Deploy indexes using `firebase deploy --only firestore:indexes`
    - Posts missing required fields: Check posts have `id`, `slug`, `_status`, and `title`
    - Admin SDK initialization failure: Verify `FIREBASE_ADMIN_*` environment variables
- **Action Required**:
  - Deploy Firestore indexes: `firebase deploy --only firestore:indexes` (if not already deployed)
  - Monitor production logs for query performance and errors
  - Review and fix any posts missing required fields

# Blog Fetching Diagnosis and Optimization Plan

## Problem Analysis

The `/blog` page returns empty posts array on live site. Multiple potential issues identified:

1. **Duplicate fetchPosts implementations** - Two different versions exist
2. **Silent query failures** - Errors caught but not logged with details
3. **Missing Firestore indexes** - Composite indexes may not exist for queries
4. **Data filtering issues** - Posts without slugs are filtered out
5. **Status field validation** - Posts must have `_status === 'published'`
6. **Environment variable verification** - Admin SDK initialization in production

## Implementation Steps

### Phase 1: Enhanced Error Logging and Diagnostics

**File: `src/lib/firebase-api-blog.ts`**

- Add detailed error logging with query details
- Log query results (count, sample data)
- Add validation for required fields (`_status`, `slug`)
- Log Admin SDK initialization status
- Add try-catch around specific query operations with detailed error messages

**File: `src/app/(frontend)/(default)/blog/page.tsx`**

- Add error boundary logging
- Log fetched data counts before transformation
- Add validation for post data structure
- Log transformation failures

### Phase 2: Query Optimization and Index Verification

**File: `src/lib/firebase-api-blog.ts`**

- Verify Firestore composite indexes exist for:
- `_status == 'published'` + `orderBy('publishedAt')`
- `_status == 'published'` + `orderBy('createdAt')`
- `_status == 'published'` + `featured == true` + `orderBy('publishedAt')`
- `slug == X` + `_status == 'published'`
- Add index error detection and fallback strategies
- Create `firestore.indexes.json` file documenting required indexes
- Add comments about index requirements

**File: `src/lib/firebase-api-blog.ts` - fetchPosts function**

- Improve error handling to distinguish between:
- Missing indexes (failed-precondition errors)
- Missing data (empty results)
- Permission errors
- Network/timeout errors
- Add query result validation before returning

### Phase 3: Data Structure Validation

**File: `src/lib/firebase-api-blog.ts`**

- Add validation function to check post structure
- Ensure all posts have required fields: `id`, `slug`, `_status`, `title`
- Filter out invalid posts with warning logs
- Add type guards for Post data

**File: `src/app/(frontend)/(default)/blog/page.tsx`**

- Improve `toCardPostWithCategories` to handle missing data gracefully
- Log posts filtered out due to missing slugs
- Add fallback values for missing fields

### Phase 4: Remove Duplicate Code

**File: `src/lib/firebase-api.ts`**

- Remove duplicate `fetchPosts`, `fetchFeaturedPost`, `fetchPostBySlug` functions
- Update all imports to use `firebase-api-blog.ts` versions
- Verify no other files depend on `firebase-api.ts` blog functions

**Files to check for imports:**

- `src/app/(frontend)/(default)/search/page.tsx`
- `src/app/(frontend)/(default)/posts/page.tsx`
- `src/app/(frontend)/(default)/posts/page/[pageNumber]/page.tsx`
- `src/app/(frontend)/(default)/posts/[slug]/page.tsx`
- `src/app/(frontend)/(sitemaps)/posts-sitemap.xml/route.ts`

### Phase 5: Environment and Admin SDK Verification

**File: `src/lib/firebase-admin.ts`**

- Add initialization logging (dev only)
- Add error handling for missing environment variables
- Verify Admin SDK is properly initialized before queries
- Add health check function

**File: `src/app/(frontend)/(default)/blog/page.tsx`**

- Add Admin SDK initialization check
- Log environment variable presence (without values)
- Add fallback error messages for production

### Phase 6: Query Strategy Improvements

**File: `src/lib/firebase-api-blog.ts`**

- Add query result caching strategy (optional, for performance)
- Optimize author data fetching (batch operations)
- Add query performance logging
- Consider adding pagination support for large result sets

**File: `src/lib/firebase-api-blog.ts` - fetchPosts**

- Add query timeout handling
- Add retry logic for transient failures
- Improve fallback query strategy
- Add query result size limits

### Phase 7: Testing and Validation

**Create diagnostic utility:**

- Add `src/lib/blog-diagnostics.ts` with helper functions:
- `diagnoseBlogFetching()` - comprehensive diagnostic
- `validatePostStructure()` - validate post data
- `checkFirestoreIndexes()` - verify index existence
- `testAdminSDKConnection()` - verify Admin SDK works

**File: `src/app/(frontend)/(default)/blog/page.tsx`**

- Add diagnostic mode (dev only) that logs:
- Total posts in Firestore
- Posts by status
- Posts missing required fields
- Query execution times

### Phase 8: Documentation and TODO Update

**File: `TODO.md`**

- Add section for blog fetching diagnostics
- Document required Firestore indexes
- Add troubleshooting guide
- Update with findings and fixes

**Create: `firestore.indexes.json`**

- Document all required composite indexes
- Include index creation commands
- Add notes about query requirements

## Key Files to Modify

1. `src/lib/firebase-api-blog.ts` - Main fetching logic, error handling, validation
2. `src/app/(frontend)/(default)/blog/page.tsx` - Page-level error handling, diagnostics
3. `src/lib/firebase-api.ts` - Remove duplicate functions, update imports
4. `src/lib/firebase-admin.ts` - Add initialization verification
5. `TODO.md` - Document findings and solutions
6. `firestore.indexes.json` - Document required indexes (new file)

## Expected Outcomes

1. Detailed error logs to identify root cause
2. Validated data structure requirements
3. Optimized query strategy with proper fallbacks
4. Removed duplicate code
5. Documentation for troubleshooting
6. Required Firestore indexes documented
7. Improved error messages for production debugging


### Dashboard Features (CMS)

#### Event Editing Form
- **File**: `src/app/(frontend)/(cms)/dashboard/events/[slug]/page.tsx`
- **Line**: 64-86
- **Status**: Placeholder implementation
- **Description**: Event edit page shows "Event editing form coming soon" message. Needs full EventForm component implementation similar to PostForm.
- **Action Required**: 
  - Create `EventForm` component (similar to `PostForm.tsx`)
  - Implement `updateEvent` server action in `firebase-actions.ts`
  - Add form validation and error handling

#### Blog Trash Management
- **File**: `src/app/(frontend)/(cms)/dashboard/blog/trash/page.tsx`
- **Status**: ✅ **COMPLETED**
- **Description**: 
  - ✅ Updated `deletePost()` to perform soft delete (sets `_status` to 'deleted' and stores `_previousStatus`)
  - ✅ Implemented `restorePost(id: string)` server action to restore posts to their previous status
  - ✅ Implemented `permanentlyDeletePost(id: string)` server action for permanent deletion
  - ✅ Created `TrashPageClient` component with proper error handling, loading states, and confirmation dialogs
  - ✅ Updated blog list page to exclude soft-deleted posts

### Page Block Rendering

#### Dynamic Page Block Rendering
- **Files**: 
  - `src/app/(frontend)/(default)/[slug]/page.tsx` (line 58-66)
  - `src/app/(frontend)/(default)/[slug]/page-simple.tsx` (line 58-66)
- **Status**: Placeholder implementation
- **Description**: Currently renders placeholder `<pre>` tags instead of actual block components. TODO comment indicates block rendering needs to be implemented.
- **Action Required**:
  - Create or update `RenderBlocks` component to handle all block types:
    - `callToAction`
    - `content`
    - `mediaBlock`
    - `archive`
    - `form`
  - Map `PageBlock.blockType` to appropriate component
  - Handle block-specific props and styling

## Medium Priority

### Form Optimizations

#### Phone Number Input Validation

- **Files**:
  - `src/Forms/formDisplay/selfReferralForm.tsx` (lines 257-272, 574-586, 630-641)
  - `src/Forms/formDisplay/restorativeProgramReferralForm.tsx` (phone fields)
  - `src/Forms/formDisplay/groupFacilitationInquiryForm.tsx` (phone field)
  - `src/Forms/formDisplay/communityEducationTrainingRequestForm.tsx` (phone field)
- **Status**: ~~Basic input fields without number-only restriction~~ ✅ **COMPLETED**
- **Description**: Phone number validation and formatting has been implemented across all forms.
- **Implementation Details**:
  - Created `src/utilities/phoneUtils.ts` with phone formatting and validation utilities
  - Added `inputMode="tel"` and `type="tel"` to all phone input fields
  - Implemented number-only validation using `onKeyPress` handler
  - Added auto-formatting as user types: (123) 456-7890
  - Updated Zod schemas to validate phone number format (10 digits required)
  - Added `pattern` attribute for HTML5 validation
  - All phone fields now restrict input to numbers only and format automatically
- **Action Required**:
  - ~~Add `inputMode="tel"` to phone input fields~~
  - ~~Implement number-only validation using `onKeyPress` or `onChange` handlers~~
  - ~~Update Zod schemas to validate phone number format~~
  - ~~Add `pattern` attribute for HTML5 validation~~
  - ~~Consider auto-formatting as user types (e.g., (123) 456-7890)~~

#### Google Places Autocomplete for Address Fields
- **Files**:
  - `src/Forms/formDisplay/selfReferralForm.tsx` (lines 365-419: streetAddress, city, state, zipCode)
  - Other forms with address fields
- **Status**: Manual text input for address fields
- **Description**: Address fields require manual entry of street address, city, state, and zip code. Google Places Autocomplete would improve UX and data accuracy.
- **Action Required**:
  - API key created and added to environment variables titled `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - Integrate Google Places Autocomplete API
  - Add Google Maps JavaScript API script to layout or component
  - Create reusable `AddressAutocomplete` component
  - Implement autocomplete for `streetAddress` field
  - Auto-populate `city`, `state`, and `zipCode` from selected address
  - Handle address component parsing (street number, street name, city, state, postal code)
  - Add address validation
  - Update form schema to handle structured address data if needed

#### Additional Form Enhancements
- **Files**: All form files in `src/Forms/formDisplay/`
- **Status**: ✅ **COMPLETED**
- **Description**: General form UX and validation improvements have been implemented.
- **Implementation Details**:
  - ✅ **Form Auto-Save**: Created `useFormAutoSave` hook that automatically saves form data to localStorage as users type. Data is restored on page reload and cleared on successful submission.
  - ✅ **Real-Time Validation**: Changed form validation mode from `'onTouched'` to `'onChange'` for immediate feedback as users type.
  - ✅ **Enhanced Error Messages**: Replaced plain text errors with styled Alert components using icons and better messaging.
  - ✅ **Enhanced Loading States**: Added loading spinners (Loader2) to submit buttons and disabled all form fields during submission.
  - ✅ **Accessibility Improvements**: Added `aria-label` attributes to form inputs, `disabled={isSubmitting}` to prevent interaction during submission, and improved ARIA descriptions.
  - ✅ **Auto-Save Indicator**: Added visual indicator when form data has been auto-saved.
  - ✅ **Success Messages**: Enhanced success messages with styled Alert components and icons.
- **Forms Updated**:
  - `src/Forms/formDisplay/selfReferralForm.tsx`
  - `src/Forms/formDisplay/groupFacilitationInquiryForm.tsx`
  - `src/Forms/formDisplay/restorativeProgramReferralForm.tsx`
  - `src/Forms/formDisplay/communityEducationTrainingRequestForm.tsx`
  - `src/app/(frontend)/(default)/contact/page.tsx`
- **New Files Created**:
  - `src/hooks/useFormAutoSave.ts` - Auto-save hook for form data persistence
- **Action Required**:
  - ~~Add real-time validation feedback~~
  - ~~Improve error message clarity~~
  - ~~Add loading states for form submission~~
  - ~~Consider adding form field auto-save (localStorage)~~
  - ~~Add accessibility improvements (ARIA labels, keyboard navigation)~~
  - Consider adding form analytics/tracking (optional, low priority)

### Authentication Features

#### GitHub Sign-in
- **File**: `src/components/auth/LoginForm.tsx`
- **Line**: 280-281
- **Status**: ~~Placeholder button~~ ✅ **COMPLETED**
- **Description**: GitHub sign-in button has been removed from the login form.
- **Action Required**:
  - ~~Remove the button if not needed~~
  - ~~Update UI accordingly~~

### API Routes

#### Submit Service Request API
- **File**: `src/app/(frontend)/api/submit-service-request/`
- **Status**: Empty directory
- **Description**: Directory exists but no route handler implementation found. May be needed for service request forms.
- **Action Required**:
  - Create `route.ts` file if service request submission is needed
  - Implement POST handler for form submissions
  - Add validation and error handling
  - Connect to Firestore for data persistence

## Low Priority

### Development Tools

#### Seed Route
- **File**: `src/app/(frontend)/(default)/next/seed/route.ts`
- **Status**: Disabled (returns 404)
- **Description**: Currently disabled for static builds. May be useful for local development.
- **Action Required**:
  - Consider creating dev-only seed route
  - Or remove if not needed
  - Document seed data structure if implementing

### Content Management

#### Placeholder Images
- **Files**:
  - `src/app/(frontend)/(default)/donate/page.tsx` (line 51)
  - `src/app/(frontend)/(default)/resources/page.tsx` (lines 237, 279, 306)
- **Status**: Using placeholder images
- **Description**: Several pages use placeholder images with `alt="placeholder"` attributes.
- **Action Required**:
  - Replace placeholder images with actual content images
  - Update alt text for accessibility

## From Existing README

### Authentication & User Management

#### Authors for Blog Posts
- **Status**: ✅ COMPLETED
- **Description**: Authors field exists but needs proper Firestore schema and dashboard UI improvements.
- **Action Required**:
  - ✅ Enhanced Firestore schema for author relationships (authorData populated on fetch)
  - ✅ Improved dashboard UI for author selection/management (AuthorSelect component with multi-select)
  - ✅ Updated all blog post fetch functions to populate author data
  - ✅ Updated BlogPostCard and BlogPostPageClient to display actual author names
  - ⏳ Add author profile pages if needed (optional future enhancement)

#### Firebase Email/Password Login Improvements
- **Status**: Basic implementation exists
- **Description**: Login works but needs better error handling and loading states.
- **Action Required**:
  - Add friendly error messages
  - Improve loading states
  - Add sign-out button that calls `/api/session` (DELETE) and `firebase.auth().signOut()`
  - Add password reset via `sendPasswordResetEmail`

### Infrastructure

#### Firestore Rules Deployment
- **Status**: Not deployed
- **Description**: Firestore security rules need to be deployed to production.
- **Action Required**:
  - Deploy rules: `firebase deploy --only firestore:rules`
  - Verify rules work correctly in production
  - Document rule structure

#### Dashboard Access Policy
- **Status**: Needs clarification
- **Description**: Determine if all authenticated users should access dashboard or only admins.
- **Action Required**:
  - Update guards to match access policy
  - Implement role-based access if needed
  - Set custom claims for staff: `admin: true` or `coordinator: true`

### Content & Forms

#### Forms & Data Collection
- **Status**: Partially configured
- **Description**: Forms need to point to correct Firestore collections.
- **Action Required**:
  - Point forms to `forms/<formId>/submissions`
  - Verify rules allow `create` for signed-in users
  - Remove font choice from blog/new 

#### Legacy RichText Rendering
- **Status**: May need migration
- **Description**: Consider replacing legacy RichText rendering with portable content renderer.
- **Action Required**:
  - Evaluate current RichText implementation
  - Plan migration if needed
  - Implement new renderer if replacing

## Forms Inventory

This section lists all forms in the project for reference when applying updates or optimizations across forms.

### Service Request Forms
These forms collect service requests and submissions, stored in Firestore via `useFirestoreFormSubmit`:

1. **Mediation Self Referral Form**
   - **File**: `src/Forms/formDisplay/selfReferralForm.tsx`
   - **Component**: `MediationSelfReferralForm`
   - **Collection**: `forms/mediationSelfReferral/submissions`
   - **Fields**: Contact info, conflict overview, other participants, scheduling details
   - **Phone Fields**: `phone`, `contactOnePhone`, `contactTwoPhone`
   - **Address Fields**: `streetAddress`, `city`, `state`, `zipCode`

2. **Group Facilitation Inquiry Form**
   - **File**: `src/Forms/formDisplay/groupFacilitationInquiryForm.tsx`
   - **Component**: `GroupFacilitationInquiryForm`
   - **Collection**: `forms/groupFacilitationInquiry/submissions`
   - **Fields**: Contact info, organization details, support needs
   - **Phone Fields**: `phone`

3. **Restorative Program Referral Form**
   - **File**: `src/Forms/formDisplay/restorativeProgramReferralForm.tsx`
   - **Component**: `RestorativeProgramReferralForm`
   - **Collection**: `forms/restorativeProgramReferral/submissions`
   - **Fields**: Referrer info, participant details, incident information, urgency
   - **Phone Fields**: `referrerPhone`, `participantPhone`, `parentGuardianPhone`

4. **Community Education Training Request Form**
   - **File**: `src/Forms/formDisplay/communityEducationTrainingRequestForm.tsx`
   - **Component**: `CommunityEducationTrainingRequestForm`
   - **Collection**: `forms/communityEducationTrainingRequest/submissions`
   - **Fields**: Contact info, training interests, audience, timeframe
   - **Phone Fields**: `phone` (optional)

### Authentication Forms

5. **Login Form**
   - **File**: `src/components/auth/LoginForm.tsx`
   - **Component**: `LoginForm`
   - **Purpose**: User authentication (email/password, Google OAuth)
   - **Phone Fields**: None

6. **Registration Form**
   - **File**: `src/components/auth/RegisterForm.tsx`
   - **Component**: `RegisterForm`
   - **Purpose**: New user registration with multi-step process
   - **Phone Fields**: `phone` (in registration data)

### CMS/Dashboard Forms

7. **Blog Post Edit Form**
   - **File**: `src/app/(frontend)/(cms)/dashboard/blog/[id]/edit/PostForm.tsx`
   - **Component**: `PostForm`
   - **Purpose**: Edit existing blog posts
   - **Phone Fields**: None

8. **Blog Post Creation Form**
   - **File**: `src/components/Dashboard/blog/BlogForm.tsx`
   - **Component**: `BlogForm`
   - **Purpose**: Create new blog posts
   - **Phone Fields**: None

9. **Event Creation Form**
   - **File**: `src/app/(frontend)/(cms)/dashboard/events/new/page.tsx`
   - **Component**: Event creation form (inline)
   - **Purpose**: Create new events
   - **Phone Fields**: None

### Contact/General Forms

10. **Contact Form**
    - **File**: `src/app/(frontend)/(default)/contact/page.tsx`
    - **Component**: `Contact` (contains form)
    - **API Route**: `src/app/api/contact/route.ts`
    - **Collection**: `contacts`
    - **Fields**: Name, email, phone, service, subject, message
    - **Phone Fields**: `phone` (optional)
    - **Note**: Submits to API route, stores in Firestore, sends email via Resend

11. **Mediation Form**
    - **File**: `src/components/Forms/MediationForm.tsx`
    - **Component**: `MediationForm`
    - **Purpose**: General mediation inquiry form
    - **Phone Fields**: `phone`
    - **Note**: May be different from self-referral form

12. **Volunteer Form**
    - **File**: `src/components/Forms/VolunteerForm.tsx`
    - **Component**: `VolunteerForm`
    - **Purpose**: Volunteer application/inquiry
    - **Phone Fields**: None
    - **Note**: Currently basic form, may need backend integration

### Other Forms

13. **Email Form (Blog Page)**
    - **File**: `src/components/clients/BlogPageClient.tsx`
    - **Component**: `EmailForm` (internal)
    - **Purpose**: Email subscription (currently commented out)
    - **Status**: TODO - Implement email submission
    - **Phone Fields**: None

## Forms Update Checklist

When applying updates to forms (e.g., phone validation, address autocomplete), check:

- [ ] Service Request Forms (1-4)
- [ ] Authentication Forms (5-6)
- [ ] CMS/Dashboard Forms (7-9)
- [ ] Contact/General Forms (10-12)
- [ ] Other Forms (13)

## Notes

- All TODOs include file paths for easy navigation
- Priority levels are suggestions and can be adjusted based on project needs
- Some items from existing README may already be partially implemented
- Check current implementation status before starting work on any item
- Forms inventory helps ensure comprehensive updates across all forms

## Contributing

When completing a TODO item:
1. Update this file to mark the item as complete
2. Remove or update TODO comments in source code
3. Update related documentation if needed
4. Test the implementation thoroughly
5. Update the Forms Inventory if new forms are added

