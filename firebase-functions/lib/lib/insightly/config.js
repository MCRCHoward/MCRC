"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightlyDefaults = void 0;
exports.getInsightlyApiConfig = getInsightlyApiConfig;
exports.buildInsightlyLeadUrl = buildInsightlyLeadUrl;
const params_1 = require("./params");
function safeParamString(getter) {
    try {
        const v = getter();
        return v && v.trim().length > 0 ? v : undefined;
    }
    catch {
        return undefined;
    }
}
function safeParamNumber(getter) {
    try {
        const v = getter();
        return typeof v === 'number' && !Number.isNaN(v) ? v : undefined;
    }
    catch {
        return undefined;
    }
}
function requireValue(name, value) {
    if (!value) {
        throw new Error(`[Insightly] Missing required configuration: ${name}`);
    }
    return value;
}
function parseNumberEnv(name, fallback) {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }
    const value = Number(raw);
    if (Number.isNaN(value)) {
        throw new Error(`[Insightly] Environment variable ${name} must be a number`);
    }
    return value;
}
function getInsightlyApiConfig() {
    // Production: prefer Firebase params/secrets (Secret Manager)
    // Local: allow dotenv-provided process.env.* for emulators
    const apiUrlRaw = safeParamString(() => params_1.INSIGHTLY_API_URL.value()) ?? process.env.INSIGHTLY_API_URL;
    const apiKeyRaw = safeParamString(() => params_1.INSIGHTLY_API_KEY_SECRET.value()) ?? process.env.INSIGHTLY_API_KEY;
    const apiUrl = requireValue('INSIGHTLY_API_URL', apiUrlRaw).replace(/\/+$/, '');
    const apiKey = requireValue('INSIGHTLY_API_KEY', apiKeyRaw);
    return { apiUrl, apiKey };
}
exports.insightlyDefaults = {
    leadStatusId: safeParamNumber(() => params_1.INSIGHTLY_DEFAULT_STATUS_ID.value()) ??
        parseNumberEnv('INSIGHTLY_DEFAULT_STATUS_ID', 3380784),
    selfReferralLeadSourceId: safeParamNumber(() => params_1.INSIGHTLY_SELF_REFERRAL_SOURCE_ID.value()) ??
        parseNumberEnv('INSIGHTLY_SELF_REFERRAL_SOURCE_ID', 3442168),
    restorativeLeadSourceId: safeParamNumber(() => params_1.INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID.value()) ??
        parseNumberEnv('INSIGHTLY_RESTORATIVE_REFERRAL_SOURCE_ID', 3442170),
    ownerUserId: safeParamNumber(() => params_1.INSIGHTLY_DEFAULT_OWNER_USER_ID.value()) ??
        parseNumberEnv('INSIGHTLY_DEFAULT_OWNER_USER_ID'),
    responsibleUserId: safeParamNumber(() => params_1.INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID.value()) ??
        parseNumberEnv('INSIGHTLY_DEFAULT_RESPONSIBLE_USER_ID'),
    defaultCountry: safeParamString(() => params_1.INSIGHTLY_DEFAULT_COUNTRY.value()) ??
        process.env.INSIGHTLY_DEFAULT_COUNTRY ??
        'United States',
    webBaseUrl: (safeParamString(() => params_1.INSIGHTLY_WEB_BASE_URL.value()) ?? process.env.INSIGHTLY_WEB_BASE_URL)?.replace(/\/+$/, ''),
    retryConfig: {
        maxRetries: parseNumberEnv('INSIGHTLY_MAX_RETRIES', 3) || 3,
        initialDelayMs: parseNumberEnv('INSIGHTLY_RETRY_INITIAL_DELAY_MS', 1000) || 1000,
        maxDelayMs: parseNumberEnv('INSIGHTLY_RETRY_MAX_DELAY_MS', 10000) || 10000,
        backoffMultiplier: parseNumberEnv('INSIGHTLY_RETRY_BACKOFF_MULTIPLIER', 2) || 2,
    },
};
function buildInsightlyLeadUrl(leadId) {
    if (!exports.insightlyDefaults.webBaseUrl)
        return undefined;
    return `${exports.insightlyDefaults.webBaseUrl}/Leads/Details/${leadId}`;
}
