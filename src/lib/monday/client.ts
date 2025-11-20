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

  const payload = (await response.json()) as MondayGraphQLResponse<T>

  if (!response.ok || payload.errors?.length) {
    const reason =
      payload.errors?.map((err) => err.message).join('; ') ??
      `${response.status} ${response.statusText}`
    throw new Error(`[Monday] GraphQL error: ${reason}`)
  }

  if (!payload.data) {
    throw new Error('[Monday] GraphQL response contained no data')
  }

  return payload.data
}


