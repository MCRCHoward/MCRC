Nice, let’s wire MCRC into Insightly. I’ll treat this as its own “phase” and follow the same format we’ve been using for the other phases.

---

# Insightly Integration for Self Referral & Restorative Program Forms

(Insightly v3.1 API + Next.js/React CMS)

---

## 1. Core Objectives

1. **Single Source of Truth for New Contacts**
   Whenever someone submits:

   * `selfReferralForm` (mediation self-referral), or
   * `restorativeProgramReferralForm` (partner / restorative referral),

   we automatically create an **Insightly Lead** via the v3.1 REST API.([api.na1.insightly.com][1])

2. **Use the narrative as the Lead’s “Description”**

   * For **selfReferralForm**: use Section 2 “Conflict overview” →
     *“What brings you to seek mediation right now?”*
   * For **restorativeProgramReferralForm**: use Section 3 “Restorative Need / Incident Information” →
     *“Brief description of the situation / harm”*
     That text becomes `LEAD_DESCRIPTION` on the Insightly Lead.([Microsoft Learn][2])

3. **Stable field mapping & tags**
   Define a predictable mapping from CMS form fields → Insightly lead attributes:
   `FIRST_NAME`, `LAST_NAME`, `EMAIL_ADDRESS`, `PHONE_NUMBER`, `LEAD_STATUS_ID`, `LEAD_SOURCE_ID`, `LEAD_DESCRIPTION`, `TAGS`, etc.([Microsoft Learn][2])

4. **Server-only integration (no API key leakage)**

   * Use `INSIGHTLY_API_URL` and `INSIGHTLY_API_KEY` from env.
   * All calls happen in **server actions** or **server-side utilities**, never in browser code.

5. **Back-link from CMS → Insightly**
   Store `insightlyLeadId` (+ derived URL) on your Firestore/Neon case/inquiry so staff can click “Open in Insightly” from the CMS dashboard.

6. **Resilient, observable integration**

   * If Insightly is down, **don’t block** the user; log the error and mark the case as `insightlySyncStatus = 'failed'` for later retry.
   * Centralized logging and optional retry strategy.

---

## 2. Insightly Lead Model & Field Mapping

### 2.1 Minimal Lead Payload

From the Insightly API and connector docs, a Lead object supports fields like:

* `FIRST_NAME`, `LAST_NAME`
* `EMAIL_ADDRESS`
* `PHONE_NUMBER`, `MOBILE_PHONE_NUMBER`
* `LEAD_DESCRIPTION`
* `LEAD_STATUS_ID` (e.g. “OPEN – Not Contacted”)
* `LEAD_SOURCE_ID` (e.g. Web, Partner Referral)
* `OWNER_USER_ID`, `RESPONSIBLE_USER_ID`
* Address fields: `ADDRESS_STREET`, `ADDRESS_CITY`, `ADDRESS_STATE`, `ADDRESS_POSTCODE`, `ADDRESS_COUNTRY`
* Optional tags via `TAGS` with `TAG_NAME` entries.([Microsoft Learn][2])

We’ll build a **minimal required payload** and then layer in extra attributes as we go.

```ts
// src/lib/insightly/types.ts
export interface InsightlyLeadPayload {
  FIRST_NAME?: string;
  LAST_NAME: string; // Required by Insightly
  EMAIL_ADDRESS?: string;
  PHONE_NUMBER?: string;
  MOBILE_PHONE_NUMBER?: string;

  LEAD_DESCRIPTION?: string;

  LEAD_STATUS_ID?: number;   // e.g. 3380784 = OPEN - Not Contacted
  LEAD_SOURCE_ID?: number;   // e.g. 3442168 = Web, 3442170 = Partner Referral

  OWNER_USER_ID?: number;
  RESPONSIBLE_USER_ID?: number;

  ADDRESS_STREET?: string;
  ADDRESS_CITY?: string;
  ADDRESS_STATE?: string;
  ADDRESS_POSTCODE?: string;
  ADDRESS_COUNTRY?: string;

  TAGS?: Array<{ TAG_NAME: string }>;

  // Optional extras if/when needed:
  INDUSTRY?: string;
  LEAD_RATING?: number;
}
```

> **Assumption:** You’ll confirm exact field names/IDs in your Insightly instance by hitting `GET /Leads?top=1` and inspecting the JSON. (Field names above are taken from Insightly’s API schema / connector docs.) ([api.na1.insightly.com][1])

---

### 2.2 Mapping: `selfReferralForm` → Insightly Lead

We’ll assume a shape along these lines (adapt to your actual schema):

```ts
// selfReferralForm schema (approx)
interface SelfReferralFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;

  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;

  // Section 2 – Conflict overview
  conflictOverview: string; // “What brings you to seek mediation right now?”
  
  // Possibly:
  referralType?: 'self' | 'court' | 'school' | 'other';
  caseCategory?: 'neighbor' | 'family' | 'school' | 'business' | 'other';
}
```

**Field mapping for Self Referral:**

* Name & contact:

  * `FIRST_NAME` ⟵ `values.firstName`
  * `LAST_NAME` ⟵ `values.lastName`
  * `EMAIL_ADDRESS` ⟵ `values.email`
  * `PHONE_NUMBER` ⟵ `values.phone || values.mobilePhone`
  * `MOBILE_PHONE_NUMBER` ⟵ `values.mobilePhone || undefined`

* Address:

  * `ADDRESS_STREET` ⟵ `values.addressStreet`
  * `ADDRESS_CITY` ⟵ `values.addressCity`
  * `ADDRESS_STATE` ⟵ `values.addressState`
  * `ADDRESS_POSTCODE` ⟵ `values.addressPostalCode`
  * `ADDRESS_COUNTRY` ⟵ `values.addressCountry || 'United States'`

* Status, owner, source (recommended defaults, based on your UI snippet):

  * `LEAD_STATUS_ID` = **3380784** (“OPEN – Not Contacted”)
  * `LEAD_SOURCE_ID` = **3442168** (“Web”)
  * `OWNER_USER_ID` = ID of “Director MCRC” (2221466 in your HTML snapshot)
    → better: read from env `INSIGHTLY_DEFAULT_OWNER_USER_ID`.
  * `RESPONSIBLE_USER_ID` = default staff (“Info MCRC” or “Director MCRC”)
    → environment-driven `INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID`.

* Description:

  * `LEAD_DESCRIPTION` = formatted block using conflict overview:

    ```text
    Source: Self Referral – Mediation (Website)

    What brings you to seek mediation right now?
    ------------------------------------------------------------------
    {conflictOverview}

    (Submitted via mcrchoward.org self-referral form)
    ```

* Tags:

  * `TAGS` =

    * `{ TAG_NAME: 'MCRC' }`
    * `{ TAG_NAME: 'Mediation' }`
    * `{ TAG_NAME: 'Self Referral' }`
    * plus an optional tag from `caseCategory`, e.g. `{ TAG_NAME: 'Category: Neighbor' }`.

---

### 2.3 Mapping: `restorativeProgramReferralForm` → Insightly Lead

Assumed schema (adapt field names as needed):

```ts
interface RestorativeProgramReferralFormValues {
  // Person filling out the form
  referrerFirstName: string;
  referrerLastName: string;
  referrerEmail: string;
  referrerPhone?: string;

  referrerOrganizationName?: string;
  referrerRoleTitle?: string;

  // Youth / participant info (optional for mapping)
  participantFirstName?: string;
  participantLastName?: string;

  // Section 3 – Restorative Need / Incident
  situationDescription: string; 
  // "Brief description of the situation / harm"
  
  programType?: 'school' | 'community' | 'court-diversion' | 'other';
}
```

**Design assumption:** The **Lead** will represent the **referrer** (the person we’ll coordinate with first), not necessarily the youth/participant. If you’d rather use the youth as the Lead, you can swap name/email mapping.

**Field mapping for Restorative Referral:**

* Name & contact:

  * `FIRST_NAME` ⟵ `referrerFirstName`
  * `LAST_NAME` ⟵ `referrerLastName`
  * `EMAIL_ADDRESS` ⟵ `referrerEmail`
  * `PHONE_NUMBER` ⟵ `referrerPhone`

* “Organization” context:

  * You have an `ORGANISATION_NAME` field in the UI; the API uses `ORGANIZATION_NAME`.([Microsoft Learn][2])
  * Map: `ORGANIZATION_NAME` ⟵ `referrerOrganizationName` (e.g., school, agency).
  * For “Title”: map `TITLE` ⟵ `referrerRoleTitle` (e.g., School Counselor).

* Status, owner, source:

  * `LEAD_STATUS_ID` = **3380784** (“OPEN – Not Contacted”)
  * `LEAD_SOURCE_ID` = **3442170** (“Partner Referral”) – from your Lead Source dropdown.
  * `OWNER_USER_ID` / `RESPONSIBLE_USER_ID` as above (env-configured).

* Description:

  * `LEAD_DESCRIPTION` = embed the situation/harm narrative:

    ```text
    Source: Restorative Program Referral (Website)

    Brief description of the situation / harm:
    ------------------------------------------------------------------
    {situationDescription}

    Referrer: {referrerFirstName} {referrerLastName}
    Organization: {referrerOrganizationName || 'N/A'}
    Role: {referrerRoleTitle || 'N/A'}

    (Submitted via mcrchoward.org restorative program referral form)
    ```

* Tags:

  * `TAGS` =

    * `{ TAG_NAME: 'MCRC' }`
    * `{ TAG_NAME: 'Restorative Program' }`
    * `{ TAG_NAME: 'Partner Referral' }`
    * Program type tag, e.g. `'Program: School'`, `'Program: Community'`.

---

### 2.4 CMS-side Linking Between Inquiry & Lead

When you create the lead, have Insightly return the created Lead object (with `LEAD_ID`).([Microsoft Learn][2])

Store on your inquiry (or Firestore doc representing the form):

```ts
interface Inquiry {
  // existing fields...
  insightlyLeadId?: number;
  insightlyLeadUrl?: string; // derived like `${INSIGHTLY_WEB_BASE}/Leads/Details/${LEAD_ID}`;
  insightlySyncStatus?: 'pending' | 'success' | 'failed';
  insightlyLastSyncError?: string | null;
}
```

On your CMS “Inquiry Detail” page, show:

* A chip or badge:

  * ✅ “Linked to Insightly #123456” (with “Open in Insightly” link)
  * ❌ “Insightly sync failed – click to retry” if `failed`.

---

## 3. Backend Integration Layer (Insightly Client)

We’ll centralize all Insightly HTTP logic in a small client module.

### 3.1 Environment Configuration

Add env variables:

```bash
INSIGHTLY_API_URL=https://api.na1.insightly.com/v3.1
INSIGHTLY_API_KEY=...           # Your v3.1 API key
INSIGHTLY_DEFAULT_OWNER_USER_ID=2221466
INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID=2221466
INSIGHTLY_DEFAULT_STATUS_ID=3380784
INSIGHTLY_SELF_REFERRAL_SOURCE_ID=3442168
INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID=3442170
INSIGHTLY_DEFAULT_COUNTRY=United States
INSIGHTLY_WEB_BASE_URL=https://crm.na1.insightly.com
```

> API uses HTTP Basic auth with the API key; the key is the “username”, password empty. You send it as `Authorization: Basic {base64(API_KEY + ':')}`.([api.na1.insightly.com][1])

### 3.2 `insightlyClient.ts`

```ts
// src/lib/insightly/client.ts
'use server';

import { InsightlyLeadPayload } from './types';

function getBaseUrl() {
  const url = process.env.INSIGHTLY_API_URL;
  if (!url) throw new Error('INSIGHTLY_API_URL is not set');
  return url.replace(/\/+$/, ''); // strip trailing slash
}

function getAuthHeader() {
  const apiKey = process.env.INSIGHTLY_API_KEY;
  if (!apiKey) throw new Error('INSIGHTLY_API_KEY is not set');
  const token = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${token}`;
}

export interface InsightlyLeadResponse {
  LEAD_ID: number;
  // ... you can add more fields if you care
}

export async function createInsightlyLead(
  payload: InsightlyLeadPayload,
): Promise<InsightlyLeadResponse> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/Leads`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    // optional: use AbortController for timeouts
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Insightly create lead failed: ${res.status} ${res.statusText} – ${text}`,
    );
  }

  const data = (await res.json()) as InsightlyLeadResponse;
  return data;
}
```

---

### 3.3 Mapping Helpers

Create helper functions to convert each form’s typed values into a payload.

```ts
// src/lib/insightly/mappers.ts
import { InsightlyLeadPayload } from './types';

const DEFAULT_COUNTRY =
  process.env.INSIGHTLY_DEFAULT_COUNTRY || 'United States';

const DEFAULT_OWNER_ID = Number(process.env.INSIGHTLY_DEFAULT_OWNER_USER_ID);
const DEFAULT_RESPONSIBLE_ID = Number(
  process.env.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID,
);

// IDs based on your UI snippet (adjust if your instance differs)
const LEAD_STATUS_OPEN_NOT_CONTACTED = 3380784;
const LEAD_SOURCE_WEB = 3442168;
const LEAD_SOURCE_PARTNER_REFERRAL = 3442170;

// ---- Self Referral ----

export function buildSelfReferralLeadPayload(
  values: SelfReferralFormValues,
): InsightlyLeadPayload {
  const description = [
    'Source: Self Referral – Mediation (Website)',
    '',
    'What brings you to seek mediation right now?',
    '------------------------------------------------------------------',
    values.conflictOverview?.trim() || '(no description provided)',
    '',
    '(Submitted via mcrchoward.org self-referral form)',
  ].join('\n');

  const tags: { TAG_NAME: string }[] = [
    { TAG_NAME: 'MCRC' },
    { TAG_NAME: 'Mediation' },
    { TAG_NAME: 'Self Referral' },
  ];

  if (values.caseCategory) {
    tags.push({ TAG_NAME: `Category: ${values.caseCategory}` });
  }

  return {
    FIRST_NAME: values.firstName?.trim() || undefined,
    LAST_NAME: values.lastName?.trim() || 'Unknown',

    EMAIL_ADDRESS: values.email?.trim() || undefined,
    PHONE_NUMBER: values.phone?.trim() || values.mobilePhone?.trim() || undefined,
    MOBILE_PHONE_NUMBER: values.mobilePhone?.trim() || undefined,

    ADDRESS_STREET: values.addressStreet?.trim() || undefined,
    ADDRESS_CITY: values.addressCity?.trim() || undefined,
    ADDRESS_STATE: values.addressState?.trim() || undefined,
    ADDRESS_POSTCODE: values.addressPostalCode?.trim() || undefined,
    ADDRESS_COUNTRY: values.addressCountry?.trim() || DEFAULT_COUNTRY,

    LEAD_STATUS_ID: LEAD_STATUS_OPEN_NOT_CONTACTED,
    LEAD_SOURCE_ID: LEAD_SOURCE_WEB,
    OWNER_USER_ID: DEFAULT_OWNER_ID || undefined,
    RESPONSIBLE_USER_ID: DEFAULT_RESPONSIBLE_ID || undefined,

    LEAD_DESCRIPTION: description,
    TAGS: tags,
  };
}

// ---- Restorative Program Referral ----

export function buildRestorativeReferralLeadPayload(
  values: RestorativeProgramReferralFormValues,
): InsightlyLeadPayload {
  const description = [
    'Source: Restorative Program Referral (Website)',
    '',
    'Brief description of the situation / harm:',
    '------------------------------------------------------------------',
    values.situationDescription?.trim() || '(no description provided)',
    '',
    `Referrer: ${values.referrerFirstName || ''} ${
      values.referrerLastName || ''
    }`.trim(),
    `Organization: ${values.referrerOrganizationName || 'N/A'}`,
    `Role: ${values.referrerRoleTitle || 'N/A'}`,
    '',
    '(Submitted via mcrchoward.org restorative program referral form)',
  ].join('\n');

  const tags: { TAG_NAME: string }[] = [
    { TAG_NAME: 'MCRC' },
    { TAG_NAME: 'Restorative Program' },
    { TAG_NAME: 'Partner Referral' },
  ];

  if (values.programType) {
    tags.push({ TAG_NAME: `Program: ${values.programType}` });
  }

  return {
    FIRST_NAME: values.referrerFirstName?.trim() || undefined,
    LAST_NAME: values.referrerLastName?.trim() || 'Unknown',

    EMAIL_ADDRESS: values.referrerEmail?.trim() || undefined,
    PHONE_NUMBER: values.referrerPhone?.trim() || undefined,

    ORGANIZATION_NAME: values.referrerOrganizationName?.trim() || undefined,
    TITLE: values.referrerRoleTitle?.trim() || undefined,

    LEAD_STATUS_ID: LEAD_STATUS_OPEN_NOT_CONTACTED,
    LEAD_SOURCE_ID: LEAD_SOURCE_PARTNER_REFERRAL,
    OWNER_USER_ID: DEFAULT_OWNER_ID || undefined,
    RESPONSIBLE_USER_ID: DEFAULT_RESPONSIBLE_ID || undefined,

    LEAD_DESCRIPTION: description,
    TAGS: tags,
  };
}
```

---

## 4. Wiring the Forms: Submission Flow

We kept `useFirestoreFormSubmit` for the initial persistence (so participants still see instant
feedback), then trigger the shared server action in `src/lib/actions/insightly-actions.ts` (exported
as `syncInquiryWithInsightlyAction`) which reads the saved document and talks to Insightly.

1. User submits the form. The client-side hook writes
   `serviceAreas/{serviceArea}/inquiries/{inquiryId}` (unchanged).
2. After Firestore returns the `inquiryId`, the client calls
   `syncInquiryWithInsightlyAction({ inquiryId, serviceArea })`.
3. The action loads the document via Admin SDK, validates it with the appropriate Zod schema,
   builds the Insightly payload, and calls `createInsightlyLead`.
4. Success/failure is recorded back on the inquiry doc
   (`insightlyLeadId`, `insightlyLeadUrl`, `insightlySyncStatus`, `insightlyLastSyncError`), and the
   relevant dashboard routes are revalidated.

---

## 5. Firestore / DB Extensions

Wherever you store the inquiry/case:

```ts
interface Inquiry {
  id: string;
  // existing fields...

  insightlyLeadId?: number;
  insightlyLeadUrl?: string;
  insightlySyncStatus?: 'pending' | 'success' | 'failed';
  insightlyLastSyncError?: string | null;
}
```

**Helper:**

```ts
function buildInsightlyLeadUrl(leadId: number): string {
  // pod-specific; e.g. https://crm.na1.insightly.com
  const base = process.env.INSIGHTLY_WEB_BASE_URL!;
  return `${base}/Leads/Details/${leadId}`;
}
```

Then `linkInquiryToInsightlyLead` can:

* Set `insightlyLeadId` and `insightlyLeadUrl`.
* Update `insightlySyncStatus` & `insightlyLastSyncError`.

---

## 6. Error Handling, Observability & Retries

### 6.1 Don’t break user submission

* All Insightly failures should be caught **after** the CMS write succeeds.
* Show the user a generic “Thanks, your request was submitted” page regardless.
* Staff can see & resolve any sync failures in the CMS.

### 6.2 Logging

* Log to Cloud Functions / hosting logs:

  * Endpoint URL, status code, error body (truncate to avoid leaking PII).
  * Inquiry ID, form type (self vs restorative).
* Consider a small `insightly_errors` collection with:

  * inquiryId, leadPayload snapshot, status, message, createdAt.

### 6.3 Manual Retry Button

In your internal Inquiry Detail UI:

* If `insightlySyncStatus === 'failed'`, show:

  * Button `"Retry Insightly Sync"`.
  * Calls a server action:

    ```ts
    export async function retryInsightlyForInquiry(inquiryId: string) {
      const inquiry = await getInquiry(inquiryId);
      const values = await reconstructFormValues(inquiry); // or store original payload
      const payload =
        inquiry.source === 'self-referral'
          ? buildSelfReferralLeadPayload(values)
          : buildRestorativeReferralLeadPayload(values);

      const lead = await createInsightlyLead(payload);

      await linkInquiryToInsightlyLead(inquiryId, {
        insightlyLeadId: lead.LEAD_ID,
        insightlyLeadUrl: buildInsightlyLeadUrl(lead.LEAD_ID),
        insightlySyncStatus: 'success',
        insightlyLastSyncError: null,
      });
    }
    ```

---

## 7. CMS UX Recommendations

On the **Inquiry Detail** screen in your CMS dashboard:

1. **Lead Card**

   * If `insightlyLeadId` exists:

     * Show: “Insightly Lead #123456”
     * Link: “Open in Insightly” → `insightlyLeadUrl`.
     * Status chip: `Synced` / `Sync Failed`.
   * If no `insightlyLeadId`:

     * Show: “No Insightly lead yet.”
     * Button: “Create Lead in Insightly” (calls a manual sync action with the same mapping logic).

2. **Audit / Activity**
   Add timeline entries when:

   * Lead is created (`"Insightly lead #123456 created from selfReferralForm"`).
   * Sync fails (`"Insightly sync failed: {error}"`).
   * Sync is retried.

3. **Separation by Form Type**
   For reporting/filtering:

   * Add a `leadSourceInternal` field to your inquiry:

     * `'self-referral'` vs `'restorative-program'`.
   * This is separate from `LEAD_SOURCE_ID` but can be used in your dashboards.

---

## 8. Implementation Checklist

**Backend**

* [ ] Add `InsightlyLeadPayload` types.
* [ ] Implement `insightly/client.ts` with `createInsightlyLead`.
* [ ] Implement `mappers.ts`:

  * [ ] `buildSelfReferralLeadPayload`
  * [ ] `buildRestorativeReferralLeadPayload`
* [ ] Add `insightlyLeadId`, `insightlyLeadUrl`, `insightlySyncStatus`, `insightlyLastSyncError` to your inquiry/case model.
* [ ] Implement:

  * [ ] `submitSelfReferralAction`
  * [ ] `submitRestorativeReferralAction`
  * [ ] `linkInquiryToInsightlyLead` helper.
  * [ ] Optional: `retryInsightlyForInquiry` action.

**Frontend**

* [ ] Update `selfReferralForm.tsx` to submit via `submitSelfReferralAction`.
* [ ] Update `restorativeProgramReferralForm.tsx` to submit via `submitRestorativeReferralAction`.
* [ ] On Inquiry Detail:

  * [ ] Add “Insightly Lead” card.
  * [ ] Show link and sync status.
  * [ ] Add “Retry Sync” button when needed.

**Config & Testing**

* [ ] Set `INSIGHTLY_API_URL`, `INSIGHTLY_API_KEY`, default owner/responsible IDs in env.
* [ ] In a dev/sandbox Insightly instance:

  * [ ] Submit a self-referral form; confirm a Lead is created with correct description, tags, and mapping.
  * [ ] Submit a restorative referral; confirm description & tags.
  * [ ] Simulate network/401 errors and confirm `insightlySyncStatus='failed'` and UI shows “Retry”.

---

If you’d like, the next step can be: I can draft concrete `submitSelfReferralAction` and `submitRestorativeReferralAction` wired to your **actual** `selfReferralForm.tsx` and `restorativeProgramReferralForm.tsx` schemas (using your real field names and Zod schemas), so you can basically paste them into your repo.

## 9. Current Implementation Snapshot (Nov 2025)

**Key modules**
- `src/lib/insightly/client.ts`, `mappers.ts`, `types.ts`, and `linking.ts` are live. Defaults are read from the following env vars (all required in prod): `INSIGHTLY_API_URL`, `INSIGHTLY_API_KEY`, `INSIGHTLY_DEFAULT_STATUS_ID`, `INSIGHTLY_SELF_REFERRAL_SOURCE_ID`, `INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID`, `INSIGHTLY_DEFAULT_OWNER_USER_ID`, `INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID`, `INSIGHTLY_DEFAULT_COUNTRY`, and `INSIGHTLY_WEB_BASE_URL`.
- `src/lib/inquiries/form-data.ts` serializes/deserializes form payloads so Dates survive the round-trip through Firestore and Zod.
- `src/lib/actions/public-form-actions.ts` exposes `submitSelfReferralFormAction` and `submitRestorativeReferralFormAction`. Each action validates with the shared Zod schema, writes to `serviceAreas/{serviceArea}/inquiries`, then invokes `syncInquiryWithInsightlyAction` so the Insightly metadata is updated immediately. Insightly failures are logged + written onto the inquiry but never block the public form UX.
- `src/lib/actions/insightly-actions.ts` continues to power the dashboard “Resync Insightly Lead” button (`InquiryDetailCard`) and is now reused by the public form submissions.

**Forms**
- `src/Forms/formDisplay/selfReferralForm.tsx` and `src/Forms/formDisplay/restorativeProgramReferralForm.tsx` call the server actions directly (no more `useFirestoreFormSubmit`). They still send Resend confirmation emails and redirect to `/getting-started/thank-you`.

**CMS surface area**
- `src/components/Dashboard/Inquiries/InquiryDetailCard.tsx` shows Insightly link/status and allows retries. The same server action is used for initial sync + resync, so the behavior is consistent.

**Testing**
- Mapper/client unit coverage lives in `src/lib/insightly/__tests__`. Run `pnpm vitest run src/lib/insightly`.
- Manual test loop: fill each public form, confirm a Firestore inquiry with `insightlyLeadId`, and open the CMS detail view to verify the Insightly badge/link.

**Rollout checklist**
1. Verify all Insightly env vars are present locally and on Vercel/Firebase.
2. Submit a mediation + restorative form in dev; check Firestore + Insightly for the new lead.
3. Force an Insightly failure (bad API key) to confirm `insightlySyncStatus='failed'` and the dashboard retry button recovers once the key is restored.

[1]: https://api.na1.insightly.com/v3.1/?utm_source=chatgpt.com "Insightly API v3.1 Help"
[2]: https://learn.microsoft.com/en-us/connectors/insightly/?utm_source=chatgpt.com "Insightly - Connectors"
