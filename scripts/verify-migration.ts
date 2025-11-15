/**
 * Verification Script: Check that migration was successful
 *
 * This script verifies that:
 * 1. Service area documents exist
 * 2. Inquiries are in the correct locations
 * 3. Data structure is correct
 *
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
]

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath })
  if (!result.error) {
    break
  }
}

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
    privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
  }
}

try {
  initializeApp({
    credential: cert(getServiceAccount()),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  })
} catch (error) {
  console.error('Error initializing Firebase Admin:', error)
  process.exit(1)
}

const db = getFirestore()

const serviceAreas = ['mediation', 'facilitation', 'restorativePractices']

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n')

  let totalInquiries = 0
  let totalErrors = 0

  for (const serviceArea of serviceAreas) {
    console.log(`📋 Checking ${serviceArea}...`)

    try {
      // Check if service area document exists
      const serviceAreaDoc = await db.doc(`serviceAreas/${serviceArea}`).get()
      if (!serviceAreaDoc.exists) {
        console.log(`   ⚠ Service area document doesn't exist (will be auto-created on first write)`)
      } else {
        console.log(`   ✓ Service area document exists`)
      }

      // Check inquiries
      const inquiriesSnapshot = await db
        .collection(`serviceAreas/${serviceArea}/inquiries`)
        .get()

      const count = inquiriesSnapshot.size
      totalInquiries += count

      if (count === 0) {
        console.log(`   ℹ No inquiries found (this is OK if no forms have been submitted)`)
      } else {
        console.log(`   ✓ Found ${count} inquiry/inquiries`)

        // Sample a few to verify structure
        const sampleSize = Math.min(3, count)
        const samples = inquiriesSnapshot.docs.slice(0, sampleSize)

        for (const doc of samples) {
          const data = doc.data()
          const hasFormType = Boolean(data.formType)
          const hasServiceArea = Boolean(data.serviceArea)
          const hasFormData = Boolean(data.formData)
          const hasStatus = Boolean(data.status)

          if (hasFormType && hasServiceArea && hasFormData && hasStatus) {
            console.log(`      ✓ ${doc.id}: Valid structure`)
          } else {
            console.log(`      ✗ ${doc.id}: Missing required fields`)
            totalErrors++
          }
        }
      }
    } catch (error) {
      console.error(`   ✗ Error checking ${serviceArea}:`, error)
      totalErrors++
    }

    console.log('')
  }

  console.log('='.repeat(50))
  console.log('📊 Verification Summary:')
  console.log(`   Total inquiries found: ${totalInquiries}`)
  console.log(`   Errors: ${totalErrors}`)
  console.log('='.repeat(50))

  if (totalErrors === 0) {
    console.log('\n✅ Migration verification passed!')
    console.log('\nNext steps:')
    console.log('1. Check the dashboard inquiry pages in your browser')
    console.log('2. Test submitting a new form to verify it goes to the correct location')
    console.log('3. Verify the inquiry detail pages display correctly')
  } else {
    console.log('\n⚠️  Some issues were found. Please review the output above.')
  }
}

verifyMigration()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Verification failed:', error)
    process.exit(1)
  })

