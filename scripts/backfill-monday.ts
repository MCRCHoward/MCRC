/**
 * One-off script to backfill Monday items for historical inquiries.
 * Run with: npx tsx scripts/backfill-monday.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'
import type { ZodTypeAny } from 'zod'
import { z } from 'zod'

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

// Load environment variables BEFORE importing Monday modules
// Load .env.local first (higher priority), then .env (fallback)
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
]

let envLoaded = false
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    console.log(`✓ Loaded environment variables from ${path.basename(envPath)}`)
    envLoaded = true
    // Don't break - load both files, with .env.local taking precedence
  }
}

if (!envLoaded) {
  console.warn('⚠ No .env files found. Make sure environment variables are set.')
}

// Verify required Monday env vars are loaded before proceeding
const requiredMondayVars = ['MONDAY_MASTER_BOARD_ID', 'MONDAY_API']
const missingVars = requiredMondayVars.filter((name) => !process.env[name])
if (missingVars.length > 0) {
  console.error(`\n✗ Missing required Monday environment variables: ${missingVars.join(', ')}`)
  console.error('   Make sure these are set in your .env.local or .env file')
  console.error('\n   Current process.env values:')
  requiredMondayVars.forEach((name) => {
    const value = process.env[name]
    console.error(`     ${name}: ${value ? `"${value}"` : '(not set)'}`)
  })
  process.exit(1)
}

console.log(`✓ Verified Monday config: BOARD_ID=${process.env.MONDAY_MASTER_BOARD_ID}`)

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
  mapper: (
    values: T,
    metadata?: {
      submittedAt?: unknown
      reviewed?: boolean
      reviewedAt?: unknown
      submittedBy?: string
      submissionType?: string
    },
  ) => Promise<{ boardId: number; groupId: string; itemName: string; columnValues: string }>
}

async function backfillTarget<T extends Record<string, unknown>>(
  target: BackfillTarget<T>,
  createMondayItem: (input: {
    boardId: number
    groupId: string
    itemName: string
    columnValues: string
  }) => Promise<{ itemId: string }>,
  updateMondayItem: (input: { boardId: number; itemId: string; columnValues: string }) => Promise<void>,
  buildMondayItemUrl: (itemId: string) => string,
  groupId: string,
  boardId: number,
) {
  console.log(`\n📋 Processing ${target.formType} inquiries (${target.serviceArea})`)
  const collectionPath = `serviceAreas/${target.serviceArea}/inquiries`
  const snapshot = await db
    .collection(collectionPath)
    .where('formType', '==', target.formType)
    .get()

  if (snapshot.empty) {
    console.log('   No documents found')
    return { created: 0, updated: 0, failed: 0 }
  }

  let created = 0
  let updated = 0
  let failed = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()

    try {
      const hydrated = hydrateFormDataFromFirestore((data.formData ?? {}) as Record<string, unknown>)
      
      // Try to parse with lenient schema, but if validation fails, try to fix common issues
      let parsed: T
      try {
        parsed = target.schema.parse(hydrated) as T
      } catch (validationError) {
        // If validation fails, try to clean up phone numbers and retry
        const cleaned = { ...hydrated }
        const phoneFields = ['phone', 'contactOnePhone', 'referrerPhone', 'participantPhone', 'parentGuardianPhone']
        for (const field of phoneFields) {
          if (cleaned[field] && typeof cleaned[field] === 'string') {
            // Remove invalid phone numbers (set to empty string if not valid format)
            const phone = cleaned[field] as string
            const digits = phone.replace(/\D/g, '')
            if (digits.length > 0 && digits.length !== 10) {
              // Invalid phone - set to empty string to pass optional validation
              cleaned[field] = ''
            }
          }
        }
        // Also clean phone numbers in additionalContacts array
        if (Array.isArray(cleaned.additionalContacts)) {
          cleaned.additionalContacts = cleaned.additionalContacts.map((contact: any) => {
            if (contact?.phone && typeof contact.phone === 'string') {
              const digits = contact.phone.replace(/\D/g, '')
              if (digits.length > 0 && digits.length !== 10) {
                return { ...contact, phone: '' }
              }
            }
            return contact
          })
        }
        
        // Retry with cleaned data
        parsed = target.schema.parse(cleaned) as T
      }
      
      // Extract inquiry metadata
      const metadata = {
        submittedAt: data.submittedAt,
        reviewed: data.reviewed,
        reviewedAt: data.reviewedAt,
        submittedBy: data.submittedBy,
        submissionType: data.submissionType,
      }
      
      const mondayInput = await target.mapper(parsed, metadata)
      const existingItemId: string | undefined = data.mondayItemId

      if (existingItemId) {
        await updateMondayItem({
          boardId: mondayInput.boardId,
          itemId: existingItemId,
          columnValues: mondayInput.columnValues,
        })

        await doc.ref.set(
          {
            mondayItemId: existingItemId,
            mondayItemUrl: data.mondayItemUrl ?? buildMondayItemUrl(existingItemId),
            mondaySyncStatus: 'success',
            mondaySyncError: null,
            mondayLastSyncedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        )
        updated += 1
        console.log(`   ↺ Updated ${doc.id} → #${existingItemId}`)
      } else {
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
        created += 1
        console.log(`   ✓ Created ${doc.id} → #${itemId}`)
      }
    } catch (error) {
      failed += 1
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (Array.isArray(error)) {
        // Zod validation errors
        errorMessage = JSON.stringify(error, null, 2)
      } else {
        errorMessage = String(error)
      }

      // Provide helpful context for common errors
      if (errorMessage.includes('Group not found')) {
        console.error(`   ✗ Failed to sync ${doc.id}: Group not found`)
        console.error(`      Using group ID: "${groupId}"`)
        console.error(`      Make sure this group exists in Monday board ${boardId}`)
      } else {
        console.error(`   ✗ Failed to sync ${doc.id}:`, errorMessage)
      }

      await doc.ref.set(
        {
          mondaySyncStatus: 'failed',
          mondaySyncError: errorMessage.length > 500 ? errorMessage.slice(0, 500) + '...' : errorMessage,
        },
        { merge: true },
      )
    }
  }

  console.log(
    `   Summary → created: ${created}, updated: ${updated}, failed: ${failed}`,
  )
  return { created, updated, failed }
}

async function run() {
  // Dynamically import Monday modules after env vars are loaded
  const { buildMediationReferralMondayItem, buildRestorativeProgramMondayItem } = await import('../src/lib/monday/mappers')
  const { createMondayItem, updateMondayItem } = await import('../src/lib/monday/items')
  const { buildMondayItemUrl, MONDAY_GROUP_MEDIATION_REFERRALS, MONDAY_GROUP_RESTORATIVE_REFERRALS, MONDAY_MASTER_BOARD_ID } = await import('../src/lib/monday/config')

  console.log('\n📋 Monday Configuration:')
  console.log(`   Board ID: ${MONDAY_MASTER_BOARD_ID}`)
  console.log(`   Mediation Group: "${MONDAY_GROUP_MEDIATION_REFERRALS}"`)
  console.log(`   Restorative Group: "${MONDAY_GROUP_RESTORATIVE_REFERRALS}"`)
  console.log('\n   ⚠ If you see "Group not found" errors, verify these group IDs exist in your Monday board.')
  console.log('   You can find group IDs in the Monday board URL or by inspecting the board structure.\n')

  // Create lenient versions of schemas for backfill (allow invalid phone numbers from historical data)
  // Use merge() to override phone validations, then passthrough() to allow extra fields
  const lenientPhone = z.string().optional().or(z.literal(''))
  const lenientMediationSchema = mediationFormSchema.merge(z.object({
    phone: lenientPhone,
    contactOnePhone: lenientPhone,
    additionalContacts: z.array(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: lenientPhone,
      email: z.string().optional(),
    })).optional(),
  })).passthrough()

  const lenientRestorativeSchema = restorativeProgramReferralFormSchema.merge(z.object({
    referrerPhone: lenientPhone,
    participantPhone: lenientPhone,
    parentGuardianPhone: lenientPhone,
  })).passthrough()

  const mediationTarget: BackfillTarget<MediationFormValues> = {
    serviceArea: 'mediation',
    formType: 'mediation-self-referral',
    schema: lenientMediationSchema as any,
    mapper: buildMediationReferralMondayItem,
  }

  const restorativeTarget: BackfillTarget<RestorativeProgramReferralFormValues> = {
    serviceArea: 'restorativePractices',
    formType: 'restorative-program-referral',
    schema: lenientRestorativeSchema as any,
    mapper: buildRestorativeProgramMondayItem,
  }

  const targets: BackfillTarget<any>[] = [mediationTarget, restorativeTarget]

  let total = { created: 0, updated: 0, failed: 0 }

  for (const target of targets) {
    const groupId = target.serviceArea === 'mediation' 
      ? MONDAY_GROUP_MEDIATION_REFERRALS 
      : MONDAY_GROUP_RESTORATIVE_REFERRALS
    const result = await backfillTarget(
      target,
      createMondayItem,
      updateMondayItem,
      buildMondayItemUrl,
      groupId,
      MONDAY_MASTER_BOARD_ID,
    )
    total = {
      created: total.created + result.created,
      updated: total.updated + result.updated,
      failed: total.failed + result.failed,
    }
  }

  console.log('\n✅ Backfill complete.')
  console.log(`   Total created: ${total.created}`)
  console.log(`   Total updated: ${total.updated}`)
  console.log(`   Total failed: ${total.failed}`)
  process.exit(0)
}

run().catch((error) => {
  console.error('\n✗ Unexpected error while running backfill')
  console.error(error)
  process.exit(1)
})


