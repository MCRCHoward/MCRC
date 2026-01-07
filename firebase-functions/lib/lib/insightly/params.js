"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID = exports.INSIGHTLY_SELF_REFERRAL_SOURCE_ID = exports.INSIGHTLY_DEFAULT_STATUS_ID = exports.INSIGHTLY_WEB_BASE_URL = exports.INSIGHTLY_DEFAULT_COUNTRY = exports.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID = exports.INSIGHTLY_DEFAULT_OWNER_USER_ID = exports.INSIGHTLY_API_URL = exports.INSIGHTLY_API_KEY_SECRET = void 0;
const params_1 = require("firebase-functions/params");
// Secret (Secret Manager)
// NOTE: Secret name intentionally differs from plain env var `INSIGHTLY_API_KEY`
// to avoid Cloud Run env collision if a non-secret env var with that name exists.
exports.INSIGHTLY_API_KEY_SECRET = (0, params_1.defineSecret)('INSIGHTLY_API_KEY_SECRET');
// Non-secret params (configurable at deploy time)
exports.INSIGHTLY_API_URL = (0, params_1.defineString)('INSIGHTLY_API_URL');
exports.INSIGHTLY_DEFAULT_OWNER_USER_ID = (0, params_1.defineInt)('INSIGHTLY_DEFAULT_OWNER_USER_ID');
exports.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID = (0, params_1.defineInt)('INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID');
exports.INSIGHTLY_DEFAULT_COUNTRY = (0, params_1.defineString)('INSIGHTLY_DEFAULT_COUNTRY');
exports.INSIGHTLY_WEB_BASE_URL = (0, params_1.defineString)('INSIGHTLY_WEB_BASE_URL');
exports.INSIGHTLY_DEFAULT_STATUS_ID = (0, params_1.defineInt)('INSIGHTLY_DEFAULT_STATUS_ID');
exports.INSIGHTLY_SELF_REFERRAL_SOURCE_ID = (0, params_1.defineInt)('INSIGHTLY_SELF_REFERRAL_SOURCE_ID');
exports.INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID = (0, params_1.defineInt)('INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID');
