# Monday Column Auto-Creation & Individual Field Mapping

## Overview
Transform the Monday integration to automatically create separate columns for all Firestore fields (instead of a single comprehensive description), with separate column sets per form type (mediation vs restorative), and support updating existing items during backfill.

## Key Changes

### 1. Column Creation Infrastructure (`src/lib/monday/columns.ts`)
- **`checkColumnExists(boardId, columnId)`**: Query board to verify if a column exists
- **`createColumn(boardId, columnDef)`**: Create a new column using Monday's `create_column` mutation
- **`ensureColumnsExist(boardId, columnDefs)`**: Batch ensure all required columns exist before item creation
- Support column types: `text`, `long_text`, `date`, `status`, `dropdown`

### 2. Column Schema Definitions (`src/lib/monday/column-schemas.ts`)
- **`MEDIATION_COLUMN_SCHEMAS`**: Complete column definitions for mediation form fields
  - Primary contact: `firstName`, `lastName`, `email`, `phone`, `prefix`, `preferredContactMethod`, `allowText`, `allowVoicemail`
  - Address: `streetAddress`, `city`, `state`, `zipCode`
  - Conflict: `conflictOverview` (long_text), `isCourtOrdered` (status), `deadline` (date)
  - Contact One: `contactOneFirstName`, `contactOneLastName`, `contactOneEmail`, `contactOnePhone`
  - Additional Contacts: `contact1FirstName`, `contact1LastName`, `contact1Email`, `contact1Phone`, ... (up to 5)
  - Other: `referralSource`, `accessibilityNeeds` (long_text), `additionalInfo` (long_text)
  - Metadata: `submissionDate` (date), `submittedBy`, `reviewed` (status), `reviewedAt` (date)

- **`RESTORATIVE_COLUMN_SCHEMAS`**: Complete column definitions for restorative form fields
  - Referrer: `referrerName`, `referrerEmail`, `referrerPhone`, `referrerOrg`, `referrerRole`, `referrerPreferredContact`
  - Participant: `participantName`, `participantDob` (date), `participantPronouns`, `participantSchool`, `participantPhone`, `participantEmail`
  - Parent/Guardian: `parentGuardianName`, `parentGuardianPhone`, `parentGuardianEmail`
  - Incident: `incidentDate` (date), `incidentLocation`, `incidentDescription` (long_text), `otherParties` (long_text)
  - Other: `reasonReferral` (long_text), `serviceRequested`, `safetyConcerns` (long_text), `currentDiscipline` (long_text), `urgency`, `participantBestTime`, `additionalNotes` (long_text)
  - Metadata: `submissionDate` (date), `submittedBy`, `reviewed` (status), `reviewedAt` (date)

### 3. Updated Mappers (`src/lib/monday/mappers.ts`)
- Remove `buildComprehensiveDescription` function
- **`buildMediationReferralMondayItem`**: Map all fields to individual columns using `MEDIATION_COLUMN_SCHEMAS`
- **`buildRestorativeProgramMondayItem`**: Map all fields to individual columns using `RESTORATIVE_COLUMN_SCHEMAS`
- Handle array fields (`additionalContacts`) by creating separate columns for each contact (Contact 1-5)
- Format date fields as ISO date strings for Monday date columns
- Format boolean/enum fields as status column values (`Yes`/`No` labels)

### 4. Updated Item Creation (`src/lib/monday/items.ts`)
- **`updateMondayItem(itemId, columnValues)`**: New function to update existing items
- Modify `createMondayItem` to call `ensureColumnsExist` before creating item
- Use `updateMondayItem` in backfill script for existing items

### 5. Updated Backfill Script (`scripts/backfill-monday.ts`)
- Remove skip logic for items with `mondayItemId`
- For existing items: call `updateMondayItem` instead of `createMondayItem`
- For new items: call `createMondayItem` (which ensures columns exist)
- Ensure columns are created before processing any items

### 6. Updated Form Submission Actions (`src/lib/actions/public-form-actions.ts`)
- Ensure columns exist before creating Monday items
- Pass all form fields to mappers for individual column population

### 7. Updated Config (`src/lib/monday/config.ts`)
- Remove hardcoded `MONDAY_COLUMNS` (columns will be created dynamically)
- Keep board ID, group IDs, and API configuration
- Add helper functions to get column IDs from schemas

## Implementation Steps

1. **Create column creation infrastructure** (`columns.ts`)
2. **Define column schemas** (`column-schemas.ts`) for both form types
3. **Update mappers** to use individual columns instead of comprehensive description
4. **Add item update function** to `items.ts`
5. **Update backfill script** to update existing items and ensure columns exist
6. **Update form submission actions** to ensure columns before item creation
7. **Test column creation** with a dry-run script
8. **Test form submission** with new column mapping
9. **Test backfill** with existing items

## Technical Notes

- Monday column IDs are auto-generated and must be stored after creation
- Column creation should be idempotent (check before creating)
- Array fields (additionalContacts) expand to Contact 1-5 columns
- Date fields use Monday's date column format: `{ date: "YYYY-MM-DD" }`
- Status columns use: `{ label: "Yes" }` or `{ label: "No" }`
- Long text columns accept plain strings
- Text columns accept plain strings