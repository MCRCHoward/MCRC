import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serviceType, formData } = body

    if (!serviceType || !formData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Map service type to form collection ID
    const formIdMap: Record<string, string> = {
      'Mediation': 'mediationSelfReferral',
      'Group Facilitation': 'groupFacilitationInquiry',
      'Restorative Program': 'restorativeProgramReferral',
      'Community Education': 'communityEducationTrainingRequest',
    }

    const formId = formIdMap[serviceType]
    if (!formId) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Add submission to Firestore using Admin SDK
    const submissionRef = await adminDb
      .collection('forms')
      .doc(formId)
      .collection('submissions')
      .add({
        ...formData,
        submittedAt: new Date(),
        submittedBy: 'web-form', // Since we don't have auth context in API route
        submissionType: 'web-form',
        reviewed: false,
      })

    return NextResponse.json({
      success: true,
      id: submissionRef.id,
    })
  } catch (error) {
    console.error('[submit-service-request] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit request' },
      { status: 500 }
    )
  }
}

