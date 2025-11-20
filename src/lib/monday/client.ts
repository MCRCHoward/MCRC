'use server'

import {
  MONDAY_API_URL,
  MONDAY_API_TOKEN,
  MONDAY_API_VERSION,
} from './config'

interface MondayGraphQLError {
  message: string
}

interface MondayGraphQLResponse<T> {
  data?: T
  errors?: MondayGraphQLError[]
}

export async function mondayGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!MONDAY_API_TOKEN) {
    throw new Error('[Monday] MONDAY_API token is not set')
  }

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_TOKEN,
      'API-Version': MONDAY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  })

  let payload: MondayGraphQLResponse<T>
  try {
    const responseText = await response.text()
    if (!responseText) {
      throw new Error(`[Monday] Empty response from API (${response.status} ${response.statusText})`)
    }
    payload = JSON.parse(responseText) as MondayGraphQLResponse<T>
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
    throw new Error(`[Monday] Failed to parse response as JSON: ${errorMsg}`)
  }

  if (!response.ok || payload.errors?.length) {
    const errorMessages = payload.errors?.map((err) => err.message).filter(Boolean) ?? []
    const errorDetails = payload.errors?.map((err) => JSON.stringify(err)).join('; ') ?? 'No error details'
    const reason = errorMessages.length > 0
      ? errorMessages.join('; ')
      : errorDetails || `${response.status} ${response.statusText}`
    
    // Include full payload in error for debugging
    const fullError = `[Monday] GraphQL error: ${reason}${payload.errors ? ` (Full errors: ${JSON.stringify(payload.errors)})` : ''}`
    throw new Error(fullError)
  }

  if (!payload.data) {
    throw new Error('[Monday] GraphQL response contained no data')
  }

  return payload.data
}


