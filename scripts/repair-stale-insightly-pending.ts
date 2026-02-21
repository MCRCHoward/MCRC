/**
 * One-off repair script for inquiries stuck at insightlySyncStatus: 'pending'.
 *
 * Two modes:
 *   --target <inquiryId>  Fix a single inquiry (default: LIcUhotLKkar600G8GPO)
 *   --all                 Scan all service areas for stale pending records (> 5 min)
 *
 * Behaviour per record:
 *   - If insightlyLeadId exists → normalise status to 'success'
 *   - Otherwise → set status to 'failed' with a descriptive error so the user
 *     can manually retry from the CMS
 *
 * Run with:  npx tsx scripts/repair-stale-insightly-pending.ts [--all]
 *            npx tsx scripts/repair-stale-insightly-pending.ts --target <id>
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ?? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!serviceAccountPath) {
  console.error('Missing GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH')
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(path.resolve(serviceAccountPath)) as ServiceAccount

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const SERVICE_AREAS = ['mediation', 'restorativePractices']
const STALE_THRESHOLD_MS = 5 * 60 * 1000
const DRY_RUN = process.argv.includes('--dry-run')

interface RepairResult {
  inquiryId: string
  serviceArea: string
  action: 'normalised-to-success' | 'set-failed-for-retry'
}

async function repairDocument(
  serviceArea: string,
  inquiryId: string,
): Promise<RepairResult | null> {
  const docRef = db.doc(`serviceAreas/${serviceArea}/inquiries/${inquiryId}`)
  const snap = await docRef.get()

  if (!snap.exists) {
    console.warn(`  ⚠ Document not found: ${serviceArea}/${inquiryId}`)
    return null
  }

  const data = snap.data()!
  const status = data.insightlySyncStatus as string | undefined
  const leadId = data.insightlyLeadId as number | undefined

  if (status !== 'pending') {
    console.log(`  ✓ Already resolved (status=${status}), skipping`)
    return null
  }

  if (typeof leadId === 'number' && leadId > 0) {
    console.log(`  → Lead ${leadId} exists but status is pending – normalising to success`)
    if (!DRY_RUN) {
      await docRef.set(
        {
          insightlySyncStatus: 'success',
          insightlyLastSyncError: null,
          insightlyLastSyncedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }
    return { inquiryId, serviceArea, action: 'normalised-to-success' }
  }

  console.log(`  → No lead ID, marking failed so user can retry from CMS`)
  if (!DRY_RUN) {
    await docRef.set(
      {
        insightlySyncStatus: 'failed',
        insightlyLastSyncError: 'Repaired: sync was stuck at pending with no lead created',
        insightlyLastSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }
  return { inquiryId, serviceArea, action: 'set-failed-for-retry' }
}

async function repairSingle(targetId: string): Promise<void> {
  console.log(`\nRepairing single inquiry: ${targetId}`)
  for (const sa of SERVICE_AREAS) {
    const result = await repairDocument(sa, targetId)
    if (result) {
      console.log(`\nDone: ${result.action} for ${sa}/${targetId}`)
      return
    }
  }
  console.log(`\nInquiry ${targetId} not found in any service area or already resolved.`)
}

async function repairAll(): Promise<void> {
  console.log(`\nScanning all service areas for stale pending Insightly records...`)
  const results: RepairResult[] = []

  for (const sa of SERVICE_AREAS) {
    console.log(`\n--- ${sa} ---`)
    const snap = await db
      .collection(`serviceAreas/${sa}/inquiries`)
      .where('insightlySyncStatus', '==', 'pending')
      .get()

    console.log(`  Found ${snap.size} pending record(s)`)

    for (const doc of snap.docs) {
      const data = doc.data()
      const syncedAt = data.insightlyLastSyncedAt?.toDate?.()
        ?? (data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt))
      const age = Date.now() - new Date(syncedAt).getTime()

      if (age < STALE_THRESHOLD_MS) {
        console.log(`  ✓ ${doc.id} is recent (${Math.round(age / 1000)}s old), skipping`)
        continue
      }

      console.log(`  Processing ${doc.id} (pending for ${Math.round(age / 60000)} min)`)
      const result = await repairDocument(sa, doc.id)
      if (result) results.push(result)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Repaired: ${results.length} record(s)`)
  for (const r of results) {
    console.log(`  ${r.serviceArea}/${r.inquiryId} → ${r.action}`)
  }
}

async function main(): Promise<void> {
  if (DRY_RUN) console.log('*** DRY RUN — no writes will be made ***\n')

  const targetIdx = process.argv.indexOf('--target')
  if (targetIdx !== -1 && process.argv[targetIdx + 1]) {
    await repairSingle(process.argv[targetIdx + 1]!)
  } else if (process.argv.includes('--all')) {
    await repairAll()
  } else {
    await repairSingle('LIcUhotLKkar600G8GPO')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
