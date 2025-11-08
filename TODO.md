# TODO - Incomplete Features

This document tracks all incomplete features, placeholders, and missing implementations found across the codebase.

## High Priority

### Blog Fetching Diagnostics and Optimization
- **Status**: ✅ **COMPLETED** (20/20 steps)
- **Description**: Comprehensive diagnosis and optimization of blog post fetching from Firestore.

#### Implementation Steps (20 Total)

**Phase 1: Enhanced Error Logging and Diagnostics**
1. ✅ Add comprehensive error logging to `fetchPosts` with query details, result counts, and validation
2. ✅ Add data structure validation for posts (required fields: id, slug, _status, title)
3. ✅ Add error boundary logging and validation in `blog/page.tsx`
4. ✅ Add try-catch around specific query operations with detailed error messages

**Phase 2: Query Optimization and Index Verification**
5. ✅ Create `firestore.indexes.json` documenting all required composite indexes for blog queries
6. ✅ Add index error detection and fallback strategies in query functions
7. ✅ Improve error handling to distinguish between missing indexes, missing data, permission errors, and network/timeout errors

**Phase 3: Data Structure Validation**
8. ✅ Add validation function (`validatePostStructure`) to check post structure
9. ✅ Filter out invalid posts with warning logs
10. ✅ Add type guards for Post data

**Phase 4: Remove Duplicate Code**
11. ✅ Remove duplicate `fetchPosts`/`fetchFeaturedPost` functions from `firebase-api.ts` and update all imports

**Phase 5: Environment and Admin SDK Verification**
12. ✅ Add Admin SDK initialization verification and environment variable checks
13. ✅ Add initialization logging (dev only) in `firebase-admin.ts`
14. ✅ Add error handling for missing environment variables
15. ✅ Add Admin SDK initialization check in `blog/page.tsx`
16. ✅ Add fallback error messages for production

**Phase 6: Query Strategy Improvements**
17. ✅ Optimize author data fetching (batch operations with `fetchUsersByIds`)
18. ✅ Add query performance logging

**Phase 7: Testing and Validation**
19. ✅ Create `blog-diagnostics.ts` utility for comprehensive diagnostic functions

**Phase 8: Documentation and TODO Update**
20. ✅ Update TODO.md with findings, solutions, and troubleshooting guide

#### Recent Improvements (Post-Completion)

**Firestore Structure Alignment**
- ✅ Updated `fetchPosts` and `fetchFeaturedPost` to use `createdAt` instead of `publishedAt` (matching actual Firestore structure)
- ✅ Updated `sortByDateDesc` helper to use `createdAt` with `updatedAt` fallback
- ✅ Removed all references to non-existent `publishedAt` field

**Error Handling Refinements**
- ✅ Improved missing index error handling with automatic URL extraction from error messages
- ✅ Enhanced fallback query strategy with better error categorization
- ✅ Removed all `console.log` statements while keeping `console.warn` and `console.error` for important issues
- ✅ Cleaned up unused variables and simplified logging logic

**Code Cleanup**
- ✅ Removed verbose console.log statements from production code
- ✅ Streamlined error handling code
- ✅ Improved code readability and maintainability

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

### Dashboard Features (CMS)

#### Event Editing Form
- **File**: `src/app/(frontend)/(cms)/dashboard/events/[slug]/page.tsx`
- **Status**: ✅ **COMPLETED**
- **Description**: Complete Event Editing Form implementation allowing users to edit existing events from the dashboard.
- **Implementation Details**:
  - ✅ Created reusable `EventForm` component (`src/app/(frontend)/(cms)/dashboard/events/EventForm.tsx`) that supports both 'new' and 'edit' modes
  - ✅ Implemented `updateEvent(id: string, data: CreateEventInput)` server action in `firebase-actions.ts` with proper error handling, field updates, and path revalidation
  - ✅ Enhanced `fetchEventBySlug` to return all fields needed for editing (descriptionHtml, venue fields, pricing, category, format, subcategory, timezone, capacity, listed)
  - ✅ Replaced placeholder in edit page with `EventForm` component, handling data transformation from Firestore format to form format
  - ✅ Added comprehensive form validation using Zod schema with user-friendly error messages
  - ✅ Implemented proper data transformation (ISO dates ↔ date/time inputs, venue object ↔ individual fields)
  - ✅ Added image upload/replacement support with display of existing images
  - ✅ Added loading states, error handling, and toast notifications
  - ✅ Preserves `createdAt` timestamp and updates `updatedAt` on edit
  - ✅ Handles slug updates when title changes
- **Files Modified**:
  - `src/app/(frontend)/(cms)/dashboard/events/EventForm.tsx` - New reusable form component
  - `src/app/(frontend)/(cms)/dashboard/events/firebase-actions.ts` - Added `updateEvent` server action
  - `src/app/(frontend)/(cms)/dashboard/events/[slug]/page.tsx` - Replaced placeholder with EventForm, enhanced data fetching
- **Action Required**:
  - ✅ ~~Create `EventForm` component (similar to `PostForm.tsx`)~~ (Completed)
  - ✅ ~~Implement `updateEvent` server action in `firebase-actions.ts`~~ (Completed)
  - ✅ ~~Add form validation and error handling~~ (Completed)

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

### Frontend/User Experience Improvements

#### Events Page UI/UX Improvements
- **Files**: 
  - `src/app/(frontend)/(default)/events/page.tsx`
  - `src/components/clients/EventsPageClient.tsx`
  - `src/types/event.ts`
  - `src/lib/firebase-api-events.ts`
  - `src/app/(frontend)/(default)/events/loading.tsx`
- **Status**: ✅ **COMPLETED**
- **Description**: Modernized the events listing page to align with industry UI/UX best practices, focusing on improved image presentation, accessibility, visual hierarchy, and user experience.

**Issues Resolved:**
1. ✅ Replaced image reveal animation with dual image system (primary always visible, secondary on hover)
2. ✅ Enhanced card layout with comprehensive information (date, time, location, price, summary, CTA)
3. ✅ Improved accessibility with proper ARIA labels, keyboard navigation, and focus indicators
4. ✅ Added secondary image support for engaging hover effects
5. ✅ Optimized image loading with priority for above-fold and lazy loading for below-fold
6. ✅ Made cards responsive with `min-h-[400px]` instead of fixed height
7. ✅ Created engaging empty state with actionable suggestions and clear filters button
8. ✅ Enhanced filter UX with better visual feedback, transitions, and improved mobile experience

**Implementation Details:**

**Phase 1: Image Handling Improvements** ✅
- ✅ Added `secondaryImage` field to Event type interface (`src/types/event.ts`)
- ✅ Updated Firestore data mapping to handle `secondaryImageUrl` (`src/lib/firebase-api-events.ts`)
- ✅ Implemented dual image system: primary image always visible, secondary image on hover with smooth opacity transitions
- ✅ **UX Improvement**: Changed from "image hidden → revealed on hover" to "primary image visible → secondary image on hover" for better initial visual context

**Phase 2: Visual Design Improvements** ✅
- ✅ Enhanced card layout with:
  - Event summary/excerpt display
  - Location/venue info for in-person events (with MapPin icon)
  - Price information (Free vs. Paid with DollarSign icon)
  - "Learn More" CTA indicator with ArrowRight icon
  - Better date and time formatting (e.g., "November 15, 2024" with time)
- ✅ Improved visual hierarchy with better typography, spacing, and hover effects
- ✅ Better empty state design with actionable suggestions and clear filters button

**Phase 3: Accessibility Enhancements** ✅
- ✅ Added proper `aria-label` attributes to event cards and filter buttons
- ✅ Added `aria-live="polite"` region for filter changes
- ✅ Improved keyboard navigation with visible focus indicators (`focus:ring-2 focus:ring-primary`)
- ✅ Added proper semantic HTML (`<article>`, `<time>`, proper heading hierarchy)
- ✅ Enhanced screen reader support with descriptive alt text and ARIA attributes

**Phase 4: Performance Optimizations** ✅
- ✅ Implemented priority loading for above-the-fold images (first 4 events)
- ✅ Used lazy loading for below-the-fold images
- ✅ Added proper `sizes` attributes for responsive images: `(min-width: 768px) 50vw, 100vw`
- ✅ Optimized image rendering with proper Next.js Image component usage

**Phase 5: Enhanced Filtering UX** ✅
- ✅ Better active state styling with shadows and transitions
- ✅ Added "Clear filters" button in empty state when filter is active
- ✅ Improved mobile filter experience with better button sizing and spacing
- ✅ Enhanced visual feedback with smooth transitions

**Phase 6: Mobile Experience** ✅
- ✅ Made cards responsive (replaced fixed `h-80` with `min-h-[400px]`)
- ✅ Ensured proper mobile stacking and touch-friendly targets
- ✅ Optimized image sizes for mobile with proper `sizes` attribute
- ✅ Hover states work appropriately on touch devices

**Phase 7: Additional Enhancements** ✅
- ✅ Created comprehensive loading skeleton component (`src/app/(frontend)/(default)/events/loading.tsx`)
- ✅ Improved Suspense fallback with skeleton loaders matching the card layout
- ✅ Better loading states during filter transitions using `useTransition`
- ✅ Enhanced error handling structure

**Files Modified:**
- `src/types/event.ts` - Added `secondaryImage` field to Event interface
- `src/lib/firebase-api-events.ts` - Updated `mapFirebaseEventToEvent` to map `secondaryImageUrl` from Firestore
- `src/components/clients/EventsPageClient.tsx` - Complete refactor:
  - Dual image system with smooth transitions
  - Enhanced card layout with comprehensive information
  - Improved accessibility (ARIA labels, keyboard navigation, focus indicators)
  - Better empty state with clear filters button
  - Optimized image loading (priority/lazy)
  - Enhanced filter UX with better visual feedback
- `src/app/(frontend)/(default)/events/page.tsx` - Removed Suspense wrapper (using loading.tsx instead)
- `src/app/(frontend)/(default)/events/loading.tsx` - New skeleton loading component

**Expected Outcomes Achieved:**
- ✅ Better initial visual context (images visible immediately)
- ✅ Engaging interactions (smooth image transitions on hover)
- ✅ Improved information architecture (more event details visible)
- ✅ Enhanced accessibility (WCAG 2.1 AA compliance)
- ✅ Better performance (optimized image loading)
- ✅ Mobile-first experience (responsive and touch-friendly)
- ✅ Professional appearance aligned with modern web design standards

**Action Required**:
- ✅ ~~Add secondaryImage field to Event type interface~~ (Completed)
- ✅ ~~Update mapFirebaseEventToEvent to map secondaryImageUrl from Firestore~~ (Completed)
- ✅ ~~Implement dual image system in EventsPageClient~~ (Completed)
- ✅ ~~Enhance event card layout with more information~~ (Completed)
- ✅ ~~Improve accessibility (ARIA labels, keyboard navigation, focus indicators)~~ (Completed)
- ✅ ~~Optimize image loading (priority/lazy loading, proper sizes)~~ (Completed)
- ✅ ~~Enhance filter UX (visual feedback, transitions, mobile experience)~~ (Completed)
- ✅ ~~Improve empty state and loading states~~ (Completed)
- ✅ ~~Make cards responsive (replace fixed height, ensure mobile optimization)~~ (Completed)
- ✅ ~~Test and validate (cross-browser, accessibility, performance, mobile)~~ (Build passes, ready for production)

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
  - `src/Forms/formDisplay/selfReferralForm.tsx` (streetAddress, city, state, zipCode)
  - `src/components/Forms/MediationForm.tsx` (streetAddress, city, state, zipCode)
  - `src/app/(frontend)/(cms)/dashboard/events/EventForm.tsx` (addressLine1, city, state, postalCode, country)
  - `src/app/(frontend)/(cms)/dashboard/events/new/page.tsx` (addressLine1, city, state, postalCode, country)
  - `src/components/Forms/AddressAutocomplete.tsx` (new reusable component)
  - `src/app/(frontend)/layout.tsx` (Google Maps script loading)
- **Status**: ✅ **COMPLETED**
- **Description**: Google Places Autocomplete has been implemented across all forms with address fields to improve UX and data accuracy. Users can now start typing their address and get autocomplete suggestions that automatically populate all address fields.

**Implementation Details:**
- ✅ **Google Maps Script**: Added Google Maps JavaScript API script to root layout with lazy loading strategy
- ✅ **Reusable Component**: Created `AddressAutocomplete` component (`src/components/Forms/AddressAutocomplete.tsx`) that:
  - Integrates with react-hook-form using FormField
  - Handles Google Places API initialization and loading states
  - Parses address components (street number, street name, city, state, postal code)
  - Auto-populates city, state, and zipCode fields when an address is selected
  - Shows loading indicators while Google Maps API loads
  - Handles errors gracefully with fallback to manual input
- ✅ **Form Integration**: 
  - ✅ **Mediation Self Referral Form**: Replaced individual address fields with AddressAutocomplete component
  - ✅ **Mediation Form**: Replaced individual address fields with AddressAutocomplete component
  - ✅ **Event Form (Edit)**: Added Google Places autocomplete to `addressLine1` field with auto-population of city, state, postalCode, and country
  - ✅ **New Event Page**: Added Google Places autocomplete to `addressLine1` field with auto-population of city, state, postalCode, and country
- ✅ **Address Parsing**: Implemented robust address component parsing that extracts:
  - Street number and street name (combined into streetAddress or addressLine1)
  - City (from locality component)
  - State (from administrative_area_level_1, using short name like "MD")
  - Zip Code/Postal Code (from postal_code component)
  - Country (for event forms)
- ✅ **User Experience**: 
  - Shows loading spinner while Google Maps API loads
  - Disables autocomplete input until API is ready
  - Provides helpful placeholder text: "Start typing your address..."
  - Maintains existing form validation and error handling
  - Works seamlessly with existing form structures
- ✅ **Accessibility**: 
  - Proper ARIA labels on all inputs
  - Keyboard navigation support
  - Screen reader friendly

**Files Modified:**
- `src/components/Forms/AddressAutocomplete.tsx` - New reusable address autocomplete component
- `src/app/(frontend)/layout.tsx` - Added Google Maps JavaScript API script with Places library
- `src/Forms/formDisplay/selfReferralForm.tsx` - Replaced individual address fields with AddressAutocomplete component
- `src/components/Forms/MediationForm.tsx` - Replaced individual address fields with AddressAutocomplete component
- `src/app/(frontend)/(cms)/dashboard/events/EventForm.tsx` - Added Google Places autocomplete to addressLine1 field
- `src/app/(frontend)/(cms)/dashboard/events/new/page.tsx` - Added Google Places autocomplete to addressLine1 field

**Forms Updated:**
1. ✅ **Mediation Self Referral Form** - Uses AddressAutocomplete component
2. ✅ **Mediation Form** - Uses AddressAutocomplete component
3. ✅ **Event Creation Form** - Google Places autocomplete on addressLine1
4. ✅ **Event Edit Form** - Google Places autocomplete on addressLine1

**Forms Checked (No Address Fields):**
- Group Facilitation Inquiry Form - No address fields
- Restorative Program Referral Form - Only has `incidentLocation` (text field, not full address)
- Community Education Training Request Form - No address fields
- Login Form - No address fields
- Registration Form - No address fields
- Blog Post Forms - No address fields
- Contact Form - No address fields
- Volunteer Form - No address fields

**Action Required**:
- ✅ ~~API key created and added to environment variables titled `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`~~ (User completed)
- ✅ ~~Integrate Google Places Autocomplete API~~ (Completed)
- ✅ ~~Add Google Maps JavaScript API script to layout or component~~ (Completed)
- ✅ ~~Create reusable `AddressAutocomplete` component~~ (Completed)
- ✅ ~~Implement autocomplete for `streetAddress` field~~ (Completed)
- ✅ ~~Auto-populate `city`, `state`, and `zipCode` from selected address~~ (Completed)
- ✅ ~~Handle address component parsing (street number, street name, city, state, postal code)~~ (Completed)
- ✅ ~~Add address validation~~ (Uses existing form schema validation)
- ✅ ~~Update form schema to handle structured address data if needed~~ (No schema changes needed - works with existing structure)
- ✅ ~~Update all forms with address fields~~ (Completed - all forms with address fields have been updated)

**Note**: The `AddressAutocomplete` component is reusable and can be easily integrated into other forms with address fields. For event forms with a different structure (addressLine1, addressLine2, postalCode, country), Google Places autocomplete was integrated directly into the form components.

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
- **Status**: ✅ **COMPLETED**
- **Description**: Firestore security rules have been deployed to production.
- **Implementation Details**:
  - ✅ Rules compiled successfully without errors
  - ✅ Rules deployed to project `mcrc-54adb`
  - ✅ Rules are up to date and active in production
  - ✅ `firestore.indexes.json` is recognized and being read by Firebase CLI
- **Deployment Command**: `firebase deploy --only firestore:rules`
- **Deployment Status**: Successfully deployed (rules were already up to date)
- **Action Required**:
  - ✅ ~~Deploy rules: `firebase deploy --only firestore:rules`~~ (Completed)
  - Monitor production to verify rules work correctly
  - Document rule structure if needed for team reference

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
    - **Component**: Removed (was unused)
    - **Purpose**: Email subscription (removed - not implemented)
    - **Status**: Removed from codebase
    - **Phone Fields**: None
    - **Note**: Component was removed as it was unused. Can be re-implemented when email subscription feature is needed.

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

