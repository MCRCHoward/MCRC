#!/usr/bin/env npx tsx
/**
 * Verify Firestore access for paperIntakes collection
 *
 * This script tests that the Admin SDK can read/write to the paperIntakes
 * collection. Run after deploying firestore.rules to verify configuration.
 *
 * Usage:
 *   npx tsx scripts/verify-firestore-paperintakes.ts
 *
 * Or add to package.json:
 *   "verify:firestore": "tsx scripts/verify-firestore-paperintakes.ts"
 */

import { config as loadEnv } from 'dotenv'
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app'
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

// =============================================================================
// Constants
// =============================================================================

const COLLECTION_NAME = 'paperIntakes'
const TEST_PREFIX = '__test__'

// =============================================================================
// Firebase Admin Initialization
// =============================================================================

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL
  const privateKey =
    (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(
      /\\n/g,
      '\n'
    )

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials in environment variables')
    console.error(
      'Required: FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID), FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY'
    )
    process.exit(1)
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

// =============================================================================
// Test Functions
// =============================================================================

interface TestResult {
  name: string
  passed: boolean
  duration: number
  error?: string
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = performance.now()
  try {
    await testFn()
    const duration = performance.now() - start
    console.log(`  PASS ${name} (${duration.toFixed(0)}ms)`)
    return { name, passed: true, duration }
  } catch (error) {
    const duration = performance.now() - start
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`  FAIL ${name} (${duration.toFixed(0)}ms)`)
    console.log(`     Error: ${errorMessage}`)
    return { name, passed: false, duration, error: errorMessage }
  }
}

async function testWrite(db: Firestore): Promise<string> {
  const testDoc = {
    _testMarker: TEST_PREFIX,
    intakeDate: new Date().toISOString().slice(0, 10),
    isCourtOrdered: false,
    disputeDescription: 'Test document for verification - safe to delete',
    participant1: {
      name: 'Test Participant',
    },
    phoneChecklist: {
      explainedProcess: false,
      explainedNeutrality: false,
      explainedConfidentiality: false,
      policeInvolvement: false,
      peaceProtectiveOrder: false,
      safetyScreeningComplete: false,
    },
    staffAssessment: {
      canRepresentSelf: true,
      noFearOfCoercion: true,
      noDangerToSelf: true,
      noDangerToCenter: true,
    },
    overallSyncStatus: 'pending',
    status: 'submitted',
    dataEntryBy: 'verification-script',
    dataEntryByName: 'Verification Script',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  const docRef = await db.collection(COLLECTION_NAME).add(testDoc)
  return docRef.id
}

async function testRead(db: Firestore, docId: string): Promise<void> {
  const snapshot = await db.collection(COLLECTION_NAME).doc(docId).get()
  if (!snapshot.exists) {
    throw new Error('Document not found after write')
  }
}

async function testQuery(db: Firestore): Promise<number> {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get()
  return snapshot.size
}

async function testStatusQuery(db: Firestore): Promise<void> {
  // This tests the composite index: overallSyncStatus + createdAt
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('overallSyncStatus', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get()
  // Success if no error thrown (index exists)
  void snapshot.size
}

async function testUpdate(db: Firestore, docId: string): Promise<void> {
  await db.collection(COLLECTION_NAME).doc(docId).update({
    staffNotes: 'Updated by verification script',
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function testDelete(db: Firestore, docId: string): Promise<void> {
  await db.collection(COLLECTION_NAME).doc(docId).delete()
}

async function cleanupTestDocuments(db: Firestore): Promise<number> {
  // Find and delete any leftover test documents
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .where('_testMarker', '==', TEST_PREFIX)
    .get()

  if (snapshot.empty) {
    return 0
  }

  const batch = db.batch()
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref)
  })
  await batch.commit()

  return snapshot.size
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  console.log('\nPaper Intakes Firestore Verification\n')
  console.log('='.repeat(50))

  // Initialize
  console.log('\nInitializing Firebase Admin SDK...')
  const app = getAdminApp()
  const db = getFirestore(app)
  console.log(
    '   Project:',
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )

  // Run tests
  console.log('\nRunning Tests...\n')

  const results: TestResult[] = []
  let testDocId: string | null = null

  // Test 1: Write
  results.push(
    await runTest('Write document', async () => {
      testDocId = await testWrite(db)
    })
  )

  // Test 2: Read (only if write succeeded)
  if (testDocId) {
    results.push(
      await runTest('Read document', async () => {
        await testRead(db, testDocId!)
      })
    )
  }

  // Test 3: Update (only if write succeeded)
  if (testDocId) {
    results.push(
      await runTest('Update document', async () => {
        await testUpdate(db, testDocId!)
      })
    )
  }

  // Test 4: Query with orderBy
  results.push(
    await runTest('Query with orderBy', async () => {
      const count = await testQuery(db)
      console.log(`     Found ${count} documents`)
    })
  )

  // Test 5: Query with composite index (may fail if index not deployed)
  results.push(
    await runTest('Query with composite index (status + createdAt)', async () => {
      await testStatusQuery(db)
    })
  )

  // Test 6: Delete (only if write succeeded)
  if (testDocId) {
    results.push(
      await runTest('Delete document', async () => {
        await testDelete(db, testDocId!)
      })
    )
  }

  // Cleanup any leftover test documents
  console.log('\nCleanup...')
  const cleaned = await cleanupTestDocuments(db)
  if (cleaned > 0) {
    console.log(`   Removed ${cleaned} leftover test document(s)`)
  } else {
    console.log('   No cleanup needed')
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('\nSummary\n')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`   Total:  ${total}`)
  console.log(`   Passed: ${passed}`)
  console.log(`   Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nSome tests failed. Check the errors above.')
    console.log('\n   Common issues:')
    console.log('   - Composite index not deployed: Run `firebase deploy --only firestore:indexes`')
    console.log('   - Missing credentials: Check FIREBASE_ADMIN_* environment variables')
    console.log('   - Network issues: Check firewall/VPN settings')
    process.exit(1)
  }

  console.log('\nAll tests passed! Firestore is ready for paperIntakes.\n')
}

main().catch((error) => {
  console.error('\nUnexpected error:', error)
  process.exit(1)
})
