import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/types'
import { getClientSideURL } from './getURL'

export const getMeUser = async (args?: {
  nullUserRedirect?: string
  validUserRedirect?: string
}): Promise<{
  token: string
  user: User
}> => {
  const { nullUserRedirect, validUserRedirect } = args || {}
  const cookieStore = await cookies()
  const token = cookieStore.get('firebase-token')?.value

  // Note: This function may need to be updated to use Firebase Auth
  // Currently it references a Payload API endpoint that may not exist
  const meUserReq = await fetch(`${getClientSideURL()}/api/users/me`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  })

  const {
    user,
  }: {
    user: User
  } = await meUserReq.json()

  if (validUserRedirect && meUserReq.ok && user) {
    redirect(validUserRedirect)
  }

  if (nullUserRedirect && (!meUserReq.ok || !user)) {
    redirect(nullUserRedirect)
  }

  // Token will exist here because if it doesn't the user will be redirected
  return {
    token: token!,
    user,
  }
}
