/**
 * Migration Script: Move form submissions to new serviceAreas structure
 *
 * This script migrates existing form submissions from the old structure:
 *   forms/{formType}/submissions/{id}
 *
 * To the new structure:
 *   serviceAreas/{serviceArea}/inquiries/{id}
 *
 * Run with: npx tsx scripts/migrate-forms.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables (try .env.local first, then .env)
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

/**
 * Builds Firebase Admin service account from environment variables.
 * Handles private key newline escaping.
 */
function getServiceAccount(): ServiceAccount {
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!rawPrivateKey) {
    throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is required')
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

  if (!projectId || !clientEmail) {
    throw new Error(
      'FIREBASE_ADMIN_PROJECT_ID and FIREBASE_ADMIN_CLIENT_EMAIL are required',
    )
  }

  return {
    projectId,
    clientEmail,
    // Use the processed key with newlines fixed
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  }
}

// Initialize Firebase Admin
try {
  initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  })
} catch (error) {
  console.error('Error initializing Firebase Admin:')
  console.error(error)
  console.error('\nRequired environment variables:')
  console.error('  - FIREBASE_ADMIN_PROJECT_ID')
  console.error('  - FIREBASE_ADMIN_CLIENT_EMAIL')
  console.error('  - FIREBASE_ADMIN_PRIVATE_KEY')
  console.error('\nMake sure these are set in your .env.local file.')
  process.exit(1)
}

const db = getFirestore()

// Form type mappings
const formMappings = [
  {
    oldPath: 'forms/mediationSelfReferral/submissions',
    serviceArea: 'mediation',
    formType: 'mediation-self-referral',
  },
  {
    oldPath: 'forms/restorativeProgramReferral/submissions',
    serviceArea: 'restorativePractices',
    formType: 'restorative-program-referral',
  },
  {
    oldPath: 'forms/groupFacilitationInquiry/submissions',
    serviceArea: 'facilitation',
    formType: 'group-facilitation-inquiry',
  },
  {
    oldPath: 'forms/communityEducationTrainingRequest/submissions',
    serviceArea: 'facilitation',
    formType: 'community-education-training-request',
  },
]

/**
 * Convert Firestore Timestamp to ISO string
 */
function toISOString(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate
    if (typeof toDate === 'function') {
      try {
        return toDate().toISOString()
      } catch {
        return undefined
      }
    }
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'string') {
    return value
  }
  return undefined
}

/**
 * Migrate submissions for a single form type
 */
async function migrateFormType(mapping: (typeof formMappings)[0]) {
  console.log(`\n📦 Migrating ${mapping.oldPath}...`)

  try {
    const snapshot = await db.collection(mapping.oldPath).get()

    if (snapshot.empty) {
      console.log(`   ✓ No documents found in ${mapping.oldPath}`)
      return { migrated: 0, errors: 0 }
    }

    console.log(`   Found ${snapshot.size} documents`)

    let migrated = 0
    let errors = 0
    const batch = db.batch()
    const batchSize = 500 // Firestore batch limit
    let batchCount = 0

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data()
        const newPath = `serviceAreas/${mapping.serviceArea}/inquiries/${doc.id}`
        const newRef = db.doc(newPath)

        // Check if document already exists in new location
        const existingDoc = await newRef.get()
        if (existingDoc.exists) {
          console.log(`   ⚠ Skipping ${doc.id} - already exists in new location`)
          continue
        }

        // Prepare migrated data
        const migratedData: Record<string, unknown> = {
          // Preserve all original form data
          ...data,
          // Add new metadata fields
          formType: mapping.formType,
          serviceArea: mapping.serviceArea,
          status: 'submitted',
          reviewed: data.reviewed || false,
          // Ensure formData field exists (for consistency)
          formData: data.formData || data,
          // Preserve timestamps (keep existing timestamps, don't overwrite)
          submittedAt: data.submittedAt || FieldValue.serverTimestamp(),
        }

        // Only add reviewedAt if it exists (don't include undefined)
        if (data.reviewedAt) {
          migratedData.reviewedAt = data.reviewedAt
        }

        // Convert any Date objects to timestamps if needed
        if (migratedData.deadline && typeof migratedData.deadline === 'string') {
          // Already a string, keep as is
        } else if (migratedData.deadline instanceof Date) {
          migratedData.deadline = Timestamp.fromDate(migratedData.deadline)
        }

        // Filter out undefined values (Firestore doesn't allow undefined)
        const cleanedData = Object.fromEntries(
          Object.entries(migratedData).filter(([_, value]) => value !== undefined),
        )

        batch.set(newRef, cleanedData)
        batchCount++
        migrated++

        // Commit batch if we've reached the limit
        if (batchCount >= batchSize) {
          await batch.commit()
          console.log(`   ✓ Committed batch of ${batchCount} documents`)
          batchCount = 0
        }
      } catch (error) {
        errors++
        console.error(`   ✗ Error migrating document ${doc.id}:`, error)
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit()
      console.log(`   ✓ Committed final batch of ${batchCount} documents`)
    }

    console.log(`   ✅ Migration complete: ${migrated} migrated, ${errors} errors`)
    return { migrated, errors }
  } catch (error) {
    console.error(`   ✗ Error migrating ${mapping.oldPath}:`, error)
    return { migrated: 0, errors: 1 }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting form submission migration...')
  console.log('   Moving from: forms/{formType}/submissions')
  console.log('   Moving to:   serviceAreas/{serviceArea}/inquiries\n')

  let totalMigrated = 0
  let totalErrors = 0

  for (const mapping of formMappings) {
    const result = await migrateFormType(mapping)
    totalMigrated += result.migrated
    totalErrors += result.errors
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`   Total migrated: ${totalMigrated}`)
  console.log(`   Total errors: ${totalErrors}`)
  console.log('='.repeat(50))

  if (totalErrors === 0) {
    console.log('\n✅ Migration completed successfully!')
  } else {
    console.log('\n⚠️  Migration completed with errors. Please review the output above.')
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

