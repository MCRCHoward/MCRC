/**
 * Script to add submittedAt field to existing form submissions
 * Run this once if you have old submissions without submittedAt
 */

import { adminDb } from '../lib/firebase-admin'

async function addSubmittedAtToSubmissions() {
  const formTypes = [
    'mediationSelfReferral',
    'groupFacilitationInquiry',
    'restorativeProgramReferral',
    'communityEducationTrainingRequest',
  ]

  for (const formType of formTypes) {
    console.log(`\nChecking ${formType}...`)
    
    const submissionsRef = adminDb
      .collection('forms')
      .doc(formType)
      .collection('submissions')

    const snapshot = await submissionsRef.get()
    
    if (snapshot.empty) {
      console.log(`  No submissions found`)
      continue
    }

    console.log(`  Found ${snapshot.size} submissions`)
    
    let updatedCount = 0
    const batch = adminDb.batch()
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      
      // Check if submittedAt is missing
      if (!data.submittedAt) {
        console.log(`  - ${doc.id}: Adding submittedAt (using createTime)`)
        batch.update(doc.ref, {
          submittedAt: doc.createTime,
        })
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await batch.commit()
      console.log(`  ✓ Updated ${updatedCount} submissions`)
    } else {
      console.log(`  ✓ All submissions have submittedAt field`)
    }
  }

  console.log('\n✅ Done!')
}

// Run the script
addSubmittedAtToSubmissions().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

