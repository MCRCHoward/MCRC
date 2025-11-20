# Monday “Master Checklist” Integration – Updated Implementation Plan

(Mediation Referral & Restorative Program → Monday Board)

---

## 1. Core Objectives

1. **Single Monday board as a “Master Checklist”**

   * Every submission from:

     * `selfReferralForm` → **Mediation Referral**, and
     * `restorativeProgramReferralForm` → **Restorative Program**
       becomes a **Monday item** on one shared board.
   * Monday acts as a **secondary log** and reporting layer, not the primary database.

2. **Full data copy for reporting**

   * Monday must store:

     * Key, human-friendly fields in dedicated columns.
     * A **full JSON** snapshot of the validated form as a long-text column for future backfills.

3. **Team assignment / ownership**

   * Each Monday item can have one or more **team members assigned** via a People column:

     * At minimum, a default assignee (e.g., Intake Coordinator).
     * Later, this can be extended to routing based on service area or form type.

4. **Safe, server-side integration**

   * Use `MONDAY_API` token and `MONDAY_API_URL`.
   * All calls happen in a **server-only client** (server actions / backend functions), never from React client.

5. **Linked back to internal cases**

   * Inquiry/case records in your DB should store:

     * `mondayItemId`
     * `mondayItemUrl`
     * `mondaySyncStatus`
       so staff can jump from the CMS to Monday and see sync health.

---

## 2. Monday Board Architecture

### 2.1 Board & Groups

**Board name (recommended):** `MCRC – Master Referrals`

Use **two groups**:

* Group 1: `Mediation Referrals`

  * Holds items created from `selfReferralForm` (internally named “Mediation Referral”).
* Group 2: `Restorative Program Referrals`

  * Holds items created from `restorativeProgramReferralForm`.

Once created in the Monday UI, each group will have a `group_id` (e.g. `topics`, `group_mediation_referrals`, etc.) that we’ll store in config.

### 2.2 Core Columns

We’ll configure the board with columns like:

| Column Type       | Column ID (example)  | Values / Purpose                                                                       |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------- |
| Item name         | *(built-in)*         | Title like `Mediation – First Last – short summary` or `Restorative – Org – …`.        |
| Status            | `status`             | `New`, `In progress`, `Closed`, etc.                                                   |
| Status / Dropdown | `form_type`          | **`Mediation Referral`** or **`Restorative Program`** (this is the key naming change). |
| Date              | `submission_date`    | Form submission date.                                                                  |
| Text              | `primary_contact`    | “First Last (email / phone)” of main contact.                                          |
| Text              | `service_area`       | e.g. `Mediation`, `Restorative Program`.                                               |
| People            | `owner` / `assignee` | Monday user(s) assigned to the item.                                                   |
| Long text         | `description`        | Conflict/incident narrative snippet for quick reading.                                 |
| Long text         | `raw_payload`        | Full JSON of validated form submission.                                                |

> The **`form_type`** column is important: in Monday it will always show
> `Mediation Referral` for `selfReferralForm` submissions and
> `Restorative Program` for `restorativeProgramReferralForm`.

### 2.3 Assignment Strategy

Minimal implementation:

* **Default assignee**:

  * Choose a Monday user (e.g., Intake Coordinator) as the default person.
  * Store their Monday user ID in `MONDAY_DEFAULT_ASSIGNEE_ID`.

Later extension:

* Map by `serviceArea` or `form_type`:

  * `Mediation Referral` → certain staff IDs.
  * `Restorative Program` → different staff IDs.
  * This can live in a small config function.

---

## 3. Monday API Client & Config

### 3.1 Environment Variables

Add (or update) env vars:

```bash
MONDAY_API=<your_token_here>       
MONDAY_API_URL=https://api.monday.com/v2
MONDAY_API_VERSION=2023-10         

MONDAY_MASTER_BOARD_ID=18385492465  

MONDAY_GROUP_MEDIATION_REFERRALS=group_mediation   
MONDAY_GROUP_RESTORATIVE_REFERRALS=group_restorative

MONDAY_DEFAULT_ASSIGNEE_ID=75961268                

MONDAY_WEB_BASE_URL=https://mcrchoward.monday.com/
```

### 3.2 Config Module

```ts
// src/lib/monday/config.ts
export const MONDAY_API_URL = process.env.MONDAY_API_URL ?? 'https://api.monday.com/v2';
export const MONDAY_API_TOKEN = process.env.MONDAY_API ?? '';
export const MONDAY_API_VERSION = process.env.MONDAY_API_VERSION ?? '2023-10';

export const MONDAY_MASTER_BOARD_ID = Number(process.env.MONDAY_MASTER_BOARD_ID);

export const MONDAY_GROUP_MEDIATION_REFERRALS =
  process.env.MONDAY_GROUP_MEDIATION_REFERRALS ?? 'group_mediation_referrals';
export const MONDAY_GROUP_RESTORATIVE_REFERRALS =
  process.env.MONDAY_GROUP_RESTORATIVE_REFERRALS ?? 'group_restorative_referrals';

export const MONDAY_DEFAULT_ASSIGNEE_ID = process.env.MONDAY_DEFAULT_ASSIGNEE_ID
  ? Number(process.env.MONDAY_DEFAULT_ASSIGNEE_ID)
  : undefined;

export const MONDAY_WEB_BASE_URL =
  process.env.MONDAY_WEB_BASE_URL ?? 'https://youraccount.monday.com';

// Column IDs – fill these with the real IDs from the board
export const MONDAY_COLUMNS = {
  status: 'status',
  formType: 'form_type',
  submissionDate: 'submission_date',
  primaryContact: 'primary_contact',
  serviceArea: 'service_area',
  assignee: 'owner',
  description: 'description',
  rawPayload: 'raw_payload',
};
```

### 3.3 GraphQL Client

```ts
// src/lib/monday/client.ts
'use server';

import {
  MONDAY_API_URL,
  MONDAY_API_TOKEN,
  MONDAY_API_VERSION,
} from './config';

interface MondayGraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export async function mondayGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  if (!MONDAY_API_TOKEN) {
    throw new Error('MONDAY_API env var is not set');
  }

  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_TOKEN,
      'API-Version': MONDAY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as MondayGraphQLResponse<T>;

  if (!res.ok || json.errors?.length) {
    const msg =
      json.errors?.map((e) => e.message).join('; ') ||
      `HTTP ${res.status} ${res.statusText}`;
    throw new Error(`Monday GraphQL error: ${msg}`);
  }

  if (!json.data) {
    throw new Error('Monday GraphQL response had no data');
  }

  return json.data;
}
```

---

## 4. Mapping Form Submissions → Monday Items

We create mapper functions that:

* Choose the **board**, **group**, and **item name**.
* Build `column_values` JSON, including:

  * `form_type: 'Mediation Referral'` or `form_type: 'Restorative Program'`.
  * Full `raw_payload` JSON.

### 4.1 `create_item` Mutation Shape

We’ll use the standard `create_item` mutation:

```graphql
mutation CreateItem(
  $boardId: ID!,
  $groupId: String!,
  $itemName: String!,
  $columnValues: JSON
) {
  create_item(
    board_id: $boardId,
    group_id: $groupId,
    item_name: $itemName,
    column_values: $columnValues
  ) {
    id
  }
}
```

`column_values` must be a **JSON-encoded string** with keys as column IDs.

### 4.2 Mapper for `selfReferralForm` → “Mediation Referral”

We keep the code name `SelfReferralFormValues`, but all Monday-facing strings say “Mediation Referral”.

```ts
// src/lib/monday/mappers.ts
import {
  MONDAY_MASTER_BOARD_ID,
  MONDAY_GROUP_MEDIATION_REFERRALS,
  MONDAY_COLUMNS,
  MONDAY_DEFAULT_ASSIGNEE_ID,
} from './config';

export function buildMediationReferralMondayItem(
  values: SelfReferralFormValues,
): {
  boardId: number;
  groupId: string;
  itemName: string;
  columnValues: string;
} {
  const first = values.firstName?.trim() || '';
  const last = values.lastName?.trim() || '';
  const shortSummary =
    values.conflictOverview?.slice(0, 80).replace(/\s+/g, ' ') || '';
  const itemName = `Mediation – ${first} ${last} – ${shortSummary}`;

  const contactLine = `${first} ${last} (${values.email || 'no email'}${
    values.phone ? `, ${values.phone}` : ''
  })`;

  const submissionDateIso = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const descriptionText = [
    'What brings you to seek mediation right now?',
    '------------------------------------------------------------------',
    values.conflictOverview?.trim() || '(no description provided)',
  ].join('\n');

  const columnValuesObject: Record<string, any> = {
    [MONDAY_COLUMNS.status]: { label: 'New' },
    [MONDAY_COLUMNS.formType]: { label: 'Mediation Referral' }, // key change
    [MONDAY_COLUMNS.submissionDate]: { date: submissionDateIso },
    [MONDAY_COLUMNS.primaryContact]: contactLine,
    [MONDAY_COLUMNS.serviceArea]: 'Mediation',
    [MONDAY_COLUMNS.description]: descriptionText,
    [MONDAY_COLUMNS.rawPayload]: JSON.stringify(values),
  };

  if (MONDAY_DEFAULT_ASSIGNEE_ID) {
    columnValuesObject[MONDAY_COLUMNS.assignee] = {
      personsAndTeams: [{ id: MONDAY_DEFAULT_ASSIGNEE_ID, kind: 'person' }],
    };
  }

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_MEDIATION_REFERRALS,
    itemName,
    columnValues: JSON.stringify(columnValuesObject),
  };
}
```

> Everywhere we previously used `"Self Referral"` for `form_type`, we now use `"Mediation Referral"`.

### 4.3 Mapper for `restorativeProgramReferralForm` → “Restorative Program”

```ts
import {
  MONDAY_MASTER_BOARD_ID,
  MONDAY_GROUP_RESTORATIVE_REFERRALS,
  MONDAY_COLUMNS,
  MONDAY_DEFAULT_ASSIGNEE_ID,
} from './config';

export function buildRestorativeProgramMondayItem(
  values: RestorativeProgramReferralFormValues,
): {
  boardId: number;
  groupId: string;
  itemName: string;
  columnValues: string;
} {
  const refFirst = values.referrerFirstName?.trim() || '';
  const refLast = values.referrerLastName?.trim() || '';
  const org = values.referrerOrganizationName?.trim() || 'Unknown org';
  const shortSummary =
    values.situationDescription?.slice(0, 80).replace(/\s+/g, ' ') || '';
  const itemName = `Restorative – ${org} – ${shortSummary}`;

  const contactLine = `${refFirst} ${refLast} (${
    values.referrerEmail || 'no email'
  }${values.referrerPhone ? `, ${values.referrerPhone}` : ''})`;

  const submissionDateIso = new Date().toISOString().slice(0, 10);

  const descriptionText = [
    'Brief description of the situation / harm:',
    '------------------------------------------------------------------',
    values.situationDescription?.trim() || '(no description provided)',
    '',
    `Referrer: ${refFirst} ${refLast}`.trim(),
    `Organization: ${org}`,
    `Role: ${values.referrerRoleTitle || 'N/A'}`,
  ].join('\n');

  const columnValuesObject: Record<string, any> = {
    [MONDAY_COLUMNS.status]: { label: 'New' },
    [MONDAY_COLUMNS.formType]: { label: 'Restorative Program' }, // key value
    [MONDAY_COLUMNS.submissionDate]: { date: submissionDateIso },
    [MONDAY_COLUMNS.primaryContact]: contactLine,
    [MONDAY_COLUMNS.serviceArea]: 'Restorative Program',
    [MONDAY_COLUMNS.description]: descriptionText,
    [MONDAY_COLUMNS.rawPayload]: JSON.stringify(values),
  };

  if (MONDAY_DEFAULT_ASSIGNEE_ID) {
    columnValuesObject[MONDAY_COLUMNS.assignee] = {
      personsAndTeams: [{ id: MONDAY_DEFAULT_ASSIGNEE_ID, kind: 'person' }],
    };
  }

  return {
    boardId: MONDAY_MASTER_BOARD_ID,
    groupId: MONDAY_GROUP_RESTORATIVE_REFERRALS,
    itemName,
    columnValues: JSON.stringify(columnValuesObject),
  };
}
```

---

## 5. Creating Monday Items (Server-Side)

### 5.1 `createMondayItem` Helper

```ts
// src/lib/monday/items.ts
'use server';

import { mondayGraphQL } from './client';

interface CreateItemInput {
  boardId: number;
  groupId: string;
  itemName: string;
  columnValues: string;
}

export async function createMondayItem(
  input: CreateItemInput,
): Promise<{ itemId: string }> {
  const query = `
    mutation CreateItem(
      $boardId: ID!,
      $groupId: String!,
      $itemName: String!,
      $columnValues: JSON
    ) {
      create_item(
        board_id: $boardId,
        group_id: $groupId,
        item_name: $itemName,
        column_values: $columnValues
      ) {
        id
      }
    }
  `;

  const data = await mondayGraphQL<{ create_item: { id: string } }>(query, {
    boardId: input.boardId,
    groupId: input.groupId,
    itemName: input.itemName,
    columnValues: input.columnValues,
  });

  return { itemId: data.create_item.id };
}
```

---

## 6. Wiring into Existing Submission Actions

We hook Monday into the same server actions used for Insightly + internal DB.

### 6.1 `submitSelfReferralAction` → Mediation Referral

```ts
// src/lib/actions/submit-self-referral.ts
'use server';

import { selfReferralFormSchema } from '@/app/.../schema';
import { buildMediationReferralMondayItem } from '@/lib/monday/mappers';
import { createMondayItem } from '@/lib/monday/items';

export async function submitSelfReferralAction(rawData: unknown) {
  // 1) Validate
  const values = selfReferralFormSchema.parse(rawData);

  // 2) Create internal inquiry / case record
  const inquiry = await createInquiryFromSelfReferral(values);

  // 3) Insightly sync (from your previous plan)
  await trySyncToInsightly(inquiry, values);

  // 4) Monday sync: create item in "Mediation Referrals" group
  try {
    const mondayInput = buildMediationReferralMondayItem(values);
    const { itemId } = await createMondayItem(mondayInput);

    await linkInquiryToMonday(inquiry.id, {
      mondayItemId: itemId,
      mondayItemUrl: buildMondayItemUrl(itemId),
      mondaySyncStatus: 'success',
      mondaySyncError: null,
    });
  } catch (err: any) {
    console.error('[submitSelfReferralAction] Monday sync failed', err);
    await linkInquiryToMonday(inquiry.id, {
      mondaySyncStatus: 'failed',
      mondaySyncError: err?.message ?? String(err),
    });
  }

  return { inquiryId: inquiry.id };
}
```

### 6.2 `submitRestorativeReferralAction` → Restorative Program

Same pattern but with `buildRestorativeProgramMondayItem`.

---

## 7. CMS Surfacing & Retry

### 7.1 Inquiry Model Extensions

Extend your inquiry/case schema:

```ts
interface Inquiry {
  // existing fields...
  mondayItemId?: string;
  mondayItemUrl?: string;
  mondaySyncStatus?: 'pending' | 'success' | 'failed';
  mondaySyncError?: string | null;
}
```

`buildMondayItemUrl`:

```ts
import { MONDAY_WEB_BASE_URL, MONDAY_MASTER_BOARD_ID } from '@/lib/monday/config';

export function buildMondayItemUrl(itemId: string) {
  return `${MONDAY_WEB_BASE_URL}/boards/${MONDAY_MASTER_BOARD_ID}/pulses/${itemId}`;
}
```

### 7.2 Dashboard UI

On the internal **Inquiry Detail** view:

* Show a **“Monday” card**:

  * If `mondayItemId` exists:

    * Label: `Monday Item #<id>`.
    * Button: “Open in Monday” → `mondayItemUrl` (`target="_blank"`).
    * Status chip: `Synced` (green) vs `Sync failed` (red/orange).

  * If `mondaySyncStatus === 'failed'`:

    * Show the error message (shortened).
    * Button: “Retry Monday Sync” → `retryMondaySync(inquiry.id)`.

### 7.3 `retryMondaySync` Action

You’ll either:

* Use stored raw form payload (if you saved it in your DB), or
* Rebuild `SelfReferralFormValues` / `RestorativeProgramReferralFormValues` from inquiry fields.

Then:

```ts
// src/lib/actions/retry-monday-sync.ts
'use server';

import {
  buildMediationReferralMondayItem,
  buildRestorativeProgramMondayItem,
} from '@/lib/monday/mappers';
import { createMondayItem } from '@/lib/monday/items';

export async function retryMondaySync(inquiryId: string) {
  const inquiry = await getInquiryById(inquiryId);

  // Determine which form type this case came from
  const source = inquiry.source; // e.g. 'mediation-referral' | 'restorative-program'

  // Either reconstruct or load stored form values
  const values = await rebuildFormValuesFromInquiry(inquiry);

  const mondayInput =
    source === 'mediation-referral'
      ? buildMediationReferralMondayItem(values as SelfReferralFormValues)
      : buildRestorativeProgramMondayItem(
          values as RestorativeProgramReferralFormValues,
        );

  const { itemId } = await createMondayItem(mondayInput);

  await linkInquiryToMonday(inquiryId, {
    mondayItemId: itemId,
    mondayItemUrl: buildMondayItemUrl(itemId),
    mondaySyncStatus: 'success',
    mondaySyncError: null,
  });
}
```

---

## 8. Error Handling & Observability

* **Never block the user** on Monday failures:

  * As long as the internal inquiry write succeeds, the form is “submitted” from their POV.
* Log integration errors with:

  * Inquiry ID, form type, error message.
* Optional: create a small `monday_sync_logs` collection for deeper debugging if needed.

---

## 9. Implementation Checklist (Updated Names)

**In Monday UI**

* [ ] Create board: `MCRC – Master Referrals`.
* [ ] Create groups:

  * [ ] `Mediation Referrals` (for `selfReferralForm` / “Mediation Referral”).
  * [ ] `Restorative Program Referrals`.
* [ ] Create columns:

  * [ ] `status` (Status).
  * [ ] `form_type` (Status/Dropdown) with values:

    * [ ] `Mediation Referral`
    * [ ] `Restorative Program`
  * [ ] `submission_date` (Date).
  * [ ] `primary_contact` (Text).
  * [ ] `service_area` (Text).
  * [ ] `owner` / `assignee` (People).
  * [ ] `description` (Long text).
  * [ ] `raw_payload` (Long text).
* [ ] Copy board ID, group IDs, and column IDs into `monday/config.ts`.

**Backend**

* [ ] Add/update `src/lib/monday/config.ts` with:

  * [ ] `MONDAY_MASTER_BOARD_ID`.
  * [ ] `MONDAY_GROUP_MEDIATION_REFERRALS`.
  * [ ] `MONDAY_GROUP_RESTORATIVE_REFERRALS`.
  * [ ] `MONDAY_COLUMNS` including `form_type`.
* [ ] Add `src/lib/monday/client.ts` (`mondayGraphQL`).
* [ ] Add `src/lib/monday/items.ts` (`createMondayItem`).
* [ ] Add `src/lib/monday/mappers.ts`:

  * [ ] `buildMediationReferralMondayItem` (uses `Mediation Referral` value).
  * [ ] `buildRestorativeProgramMondayItem` (uses `Restorative Program` value).
* [ ] Extend Inquiry model with Monday fields.
* [ ] Implement `linkInquiryToMonday`, `buildMondayItemUrl`, `retryMondaySync`.

**Form Actions**

* [ ] Update `submitSelfReferralAction`:

  * [ ] Save inquiry.
  * [ ] Sync to Insightly.
  * [ ] Sync to Monday in **Mediation Referrals** group with `form_type = "Mediation Referral"`.
* [ ] Update `submitRestorativeReferralAction` similarly with **Restorative Program Referrals** group and `form_type = "Restorative Program"`.

**Dashboard**

* [ ] Add Monday card to Inquiry Detail showing:

  * [ ] Item ID, link, sync status.
  * [ ] Retry button on failure.

**Testing**

* [ ] Submit a **Mediation Referral** (selfReferralForm):

  * [ ] Confirm item is in `Mediation Referrals` group.
  * [ ] `form_type` shows `Mediation Referral`.
* [ ] Submit a **Restorative Program** referral:

  * [ ] Confirm item is in `Restorative Program Referrals` group.
  * [ ] `form_type` shows `Restorative Program`.

---

## 10. Optional Backfill / Bulk Import

If you need to migrate historical inquiries into Monday, run the provided script instead of recreating items by hand:

```
npx tsx scripts/backfill-monday.ts
```

The script:

1. Loads environment variables (`.env.local` / `.env`) so it can talk to Monday and Firebase Admin.
2. Scans the mediation + restorative inquiry collections for documents where `mondayItemId` is missing.
3. Rebuilds the form payload with the same Zod schema + mapper logic used by new submissions.
4. Calls `createMondayItem` and updates each inquiry with `mondayItemId`, URL, sync status, and timestamp.

You can re-run the script safely; it skips records that already have a Monday item.
