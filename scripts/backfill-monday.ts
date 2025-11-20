/**
 * One-off script to backfill Monday items for historical inquiries.
 * Run with: npx tsx scripts/backfill-monday.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'
import type { ZodTypeAny } from 'zod'

import { buildMediationReferralMondayItem, buildRestorativeProgramMondayItem } from '../src/lib/monday/mappers'
import { createMondayItem } from '../src/lib/monday/items'
import type { CreateMondayItemInput } from '../src/lib/monday/items'
import { buildMondayItemUrl } from '../src/lib/monday/config'
import {
  mediationFormSchema,
  type MediationFormValues,
} from '../src/Forms/schema/request-mediation-self-referral-form'
import {
  restorativeProgramReferralFormSchema,
  type RestorativeProgramReferralFormValues,
} from '../src/Forms/schema/restorative-program-referral-form'
import { hydrateFormDataFromFirestore } from '../src/lib/inquiries/form-data'

type FormType = 'mediation-self-referral' | 'restorative-program-referral'
type ServiceArea = 'mediation' | 'restorativePractices'

const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
]

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`)
    break
  }
}

function getServiceAccount(): ServiceAccount {
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

  if (!rawPrivateKey || !projectId || !clientEmail) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_PROJECT_ID, and FIREBASE_ADMIN_CLIENT_EMAIL are required')
  }

  return {
    projectId,
    clientEmail,
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  }
}

initializeApp({
  credential: cert(getServiceAccount()),
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
})

const db = getFirestore()

interface BackfillTarget<T extends Record<string, unknown>> {
  serviceArea: ServiceArea
  formType: FormType
  schema: ZodTypeAny
  mapper: (values: T) => CreateMondayItemInput
}

const mediationTarget: BackfillTarget<MediationFormValues> = {
  serviceArea: 'mediation',
  formType: 'mediation-self-referral',
  schema: mediationFormSchema,
  mapper: buildMediationReferralMondayItem,
}

const restorativeTarget: BackfillTarget<RestorativeProgramReferralFormValues> = {
  serviceArea: 'restorativePractices',
  formType: 'restorative-program-referral',
  schema: restorativeProgramReferralFormSchema,
  mapper: buildRestorativeProgramMondayItem,
}

const targets: BackfillTarget<any>[] = [mediationTarget, restorativeTarget]

async function backfillTarget<T extends Record<string, unknown>>(target: BackfillTarget<T>) {
  console.log(`\n📋 Processing ${target.formType} inquiries (${target.serviceArea})`)
  const collectionPath = `serviceAreas/${target.serviceArea}/inquiries`
  const snapshot = await db
    .collection(collectionPath)
    .where('formType', '==', target.formType)
    .get()

  if (snapshot.empty) {
    console.log('   No documents found')
    return { synced: 0, skipped: 0, failed: 0 }
  }

  let synced = 0
  let skipped = 0
  let failed = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.mondayItemId) {
      skipped += 1
      continue
    }

    try {
      const hydrated = hydrateFormDataFromFirestore((data.formData ?? {}) as Record<string, unknown>)
      const parsed = target.schema.parse(hydrated) as T
      const mondayInput = target.mapper(parsed)
      const { itemId } = await createMondayItem(mondayInput)

      await doc.ref.set(
        {
          mondayItemId: itemId,
          mondayItemUrl: buildMondayItemUrl(itemId),
          mondaySyncStatus: 'success',
          mondaySyncError: null,
          mondayLastSyncedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
      synced += 1
      console.log(`   ✓ Synced ${doc.id} → #${itemId}`)
    } catch (error) {
      failed += 1
      console.error(`   ✗ Failed to sync ${doc.id}:`, error instanceof Error ? error.message : error)
      await doc.ref.set(
        {
          mondaySyncStatus: 'failed',
          mondaySyncError:
            error instanceof Error ? error.message : 'Unknown Monday sync error',
        },
        { merge: true },
      )
    }
  }

  console.log(
    `   Summary → synced: ${synced}, skipped (already synced): ${skipped}, failed: ${failed}`,
  )
  return { synced, skipped, failed }
}

async function run() {
  let total = { synced: 0, skipped: 0, failed: 0 }

  for (const target of targets) {
    const result = await backfillTarget(target)
    total = {
      synced: total.synced + result.synced,
      skipped: total.skipped + result.skipped,
      failed: total.failed + result.failed,
    }
  }

  console.log('\n✅ Backfill complete.')
  console.log(`   Total synced: ${total.synced}`)
  console.log(`   Total skipped: ${total.skipped}`)
  console.log(`   Total failed: ${total.failed}`)
  process.exit(0)
}

run().catch((error) => {
  console.error('\n✗ Unexpected error while running backfill')
  console.error(error)
  process.exit(1)
})


