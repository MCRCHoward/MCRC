/**
 * Initialize Service Area Documents
 *
 * This script creates/updates the service area parent documents in Firestore
 * with name and updatedAt fields. This ensures the documents are "existent"
 * and removes the "non-existent document" warnings in the Firebase Console.
 *
 * Run with: npx tsx scripts/init-service-areas.ts
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
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

// Service area definitions
const serviceAreas = [
  {
    id: 'mediation',
    name: 'Mediation',
  },
  {
    id: 'facilitation',
    name: 'Facilitation',
  },
  {
    id: 'restorativePractices',
    name: 'Restorative Practices',
  },
] as const

/**
 * Initialize a service area document
 */
async function initServiceArea(serviceArea: (typeof serviceAreas)[number]) {
  const docPath = `serviceAreas/${serviceArea.id}`
  const docRef = db.doc(docPath)

  try {
    // Check if document exists
    const doc = await docRef.get()
    
    if (doc.exists) {
      // Update existing document
      await docRef.update({
        name: serviceArea.name,
        updatedAt: FieldValue.serverTimestamp(),
      })
      console.log(`   ✓ Updated ${docPath}`)
      return { action: 'updated' as const }
    } else {
      // Create new document
      await docRef.set({
        name: serviceArea.name,
        updatedAt: FieldValue.serverTimestamp(),
      })
      console.log(`   ✓ Created ${docPath}`)
      return { action: 'created' as const }
    }
  } catch (error) {
    console.error(`   ✗ Error processing ${docPath}:`, error)
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Initializing service area documents...\n')

  let created = 0
  let updated = 0
  let errors = 0

  for (const serviceArea of serviceAreas) {
    try {
      const result = await initServiceArea(serviceArea)
      if (result.action === 'created') {
        created++
      } else {
        updated++
      }
    } catch (error) {
      errors++
      console.error(`Failed to initialize ${serviceArea.id}:`, error)
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Created: ${created}`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Errors: ${errors}`)

  if (errors === 0) {
    console.log('\n✅ All service area documents initialized successfully!')
    process.exit(0)
  } else {
    console.log('\n❌ Some errors occurred during initialization.')
    process.exit(1)
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

