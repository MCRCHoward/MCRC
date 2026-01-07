import { defineInt, defineSecret, defineString } from 'firebase-functions/params'

// Secret (Secret Manager)
// NOTE: Secret name intentionally differs from plain env var `INSIGHTLY_API_KEY`
// to avoid Cloud Run env collision if a non-secret env var with that name exists.
export const INSIGHTLY_API_KEY_SECRET = defineSecret('INSIGHTLY_API_KEY_SECRET')

// Non-secret params (configurable at deploy time)
export const INSIGHTLY_API_URL = defineString('INSIGHTLY_API_URL')
export const INSIGHTLY_DEFAULT_OWNER_USER_ID = defineInt('INSIGHTLY_DEFAULT_OWNER_USER_ID')
export const INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID = defineInt(
  'INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID',
)
export const INSIGHTLY_DEFAULT_COUNTRY = defineString('INSIGHTLY_DEFAULT_COUNTRY')
export const INSIGHTLY_WEB_BASE_URL = defineString('INSIGHTLY_WEB_BASE_URL')

export const INSIGHTLY_DEFAULT_STATUS_ID = defineInt('INSIGHTLY_DEFAULT_STATUS_ID')
export const INSIGHTLY_SELF_REFERRAL_SOURCE_ID = defineInt('INSIGHTLY_SELF_REFERRAL_SOURCE_ID')
export const INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID = defineInt(
  'INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID',
)

