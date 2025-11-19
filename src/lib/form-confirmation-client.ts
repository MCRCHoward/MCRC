'use client'

export type FormConfirmationRequest = {
  to: string
  name: string
  formName: string
  summary?: string
}

export async function requestFormConfirmationEmail(payload: FormConfirmationRequest) {
  try {
    await fetch('/api/form-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
  } catch (error) {
    console.warn('[form-confirmation] Failed to trigger confirmation email', error)
  }
}


