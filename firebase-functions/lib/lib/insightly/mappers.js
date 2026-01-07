"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLeadPayload = validateLeadPayload;
exports.buildSelfReferralLeadPayload = buildSelfReferralLeadPayload;
exports.buildRestorativeReferralLeadPayload = buildRestorativeReferralLeadPayload;
const config_1 = require("./config");
const RESTORATIVE_ORG_LABELS = {
    school: 'School / District',
    'juvenile-services': 'Juvenile Services',
    'community-organization': 'Community Organization',
    'court-legal': 'Court / Legal System',
    'self-family': 'Self / Family',
    other: 'Other',
};
const RESTORATIVE_SERVICE_LABELS = {
    'restorative-reflection': 'Restorative Reflection',
    'restorative-dialogue': 'Restorative Dialogue',
    'restorative-circle': 'Restorative Circle',
    reentry: 'Re-entry Support',
    'conflict-mediation': 'Conflict Mediation',
    'not-sure': 'Not Sure',
};
function sanitize(value) {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function splitFullName(value) {
    const sanitized = sanitize(value);
    if (!sanitized) {
        return {};
    }
    const parts = sanitized.split(/\s+/);
    if (parts.length === 1) {
        return { firstName: parts[0] };
    }
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    };
}
function descriptionBlock(title, body) {
    if (!body)
        return '';
    return `${title}\n------------------------------------------------------------------\n${body.trim()}\n`;
}
function buildBasePayload() {
    return {
        LEAD_STATUS_ID: config_1.insightlyDefaults.leadStatusId,
        OWNER_USER_ID: config_1.insightlyDefaults.ownerUserId,
        RESPONSIBLE_USER_ID: config_1.insightlyDefaults.responsibleUserId,
        ADDRESS_COUNTRY: config_1.insightlyDefaults.defaultCountry,
    };
}
function validateLeadPayload(payload) {
    const errors = [];
    if (!payload.LAST_NAME || payload.LAST_NAME.trim().length === 0) {
        errors.push('LAST_NAME is required');
    }
    if (!payload.LEAD_SOURCE_ID) {
        errors.push('LEAD_SOURCE_ID is recommended for proper lead tracking');
    }
    if (!payload.EMAIL && !payload.PHONE && !payload.MOBILE) {
        errors.push('At least one contact method (EMAIL, PHONE, or MOBILE) is recommended');
    }
    if (errors.length > 0) {
        throw new Error(`[Insightly] Payload validation failed: ${errors.join('; ')}`);
    }
}
function sanitizeTagName(tagName) {
    return tagName
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}
function withTags(...tags) {
    return tags
        .filter((tag) => Boolean(tag))
        .map((tag) => ({
        TAG_NAME: sanitizeTagName(tag.TAG_NAME),
    }));
}
function buildSelfReferralLeadPayload(values) {
    return {
        ...buildBasePayload(),
        LEAD_SOURCE_ID: config_1.insightlyDefaults.selfReferralLeadSourceId,
        FIRST_NAME: sanitize(values.firstName),
        LAST_NAME: sanitize(values.lastName) ?? 'Unknown',
        EMAIL: sanitize(values.email),
        PHONE: sanitize(values.phone),
        ADDRESS_STREET: sanitize(values.streetAddress),
        ADDRESS_CITY: sanitize(values.city),
        ADDRESS_STATE: sanitize(values.state),
        ADDRESS_POSTCODE: sanitize(values.zipCode),
        LEAD_DESCRIPTION: [
            'Source: Mediation Self-Referral (Website)',
            '',
            descriptionBlock('What brings you to seek mediation right now?', values.conflictOverview),
            descriptionBlock('Are there accessibility needs or notes for staff?', values.accessibilityNeeds),
            descriptionBlock('Other details', values.additionalInfo),
            values.preferredContactMethod ? `Preferred contact method: ${values.preferredContactMethod}` : undefined,
            values.referralSource ? `Referral source: ${values.referralSource}` : undefined,
            values.allowText ? `Text OK: ${values.allowText}` : undefined,
            values.allowVoicemail ? `Voicemail OK: ${values.allowVoicemail}` : undefined,
            '',
            '(Submitted via mcrchoward.org self-referral form)',
        ]
            .filter(Boolean)
            .join('\n'),
        TAGS: withTags({ TAG_NAME: 'MCRC' }, { TAG_NAME: 'Mediation' }, { TAG_NAME: 'Self Referral' }, sanitize(values.referralSource) ? { TAG_NAME: `Referral: ${values.referralSource}` } : undefined, values.isCourtOrdered ? { TAG_NAME: `Court Ordered: ${values.isCourtOrdered}` } : undefined),
    };
}
function buildRestorativeReferralLeadPayload(values) {
    const { firstName, lastName } = splitFullName(values.referrerName);
    const organization = (values.referrerOrg && RESTORATIVE_ORG_LABELS[values.referrerOrg]) || values.referrerOrg;
    const serviceLabel = (values.serviceRequested && RESTORATIVE_SERVICE_LABELS[values.serviceRequested]) ||
        values.serviceRequested;
    return {
        ...buildBasePayload(),
        LEAD_SOURCE_ID: config_1.insightlyDefaults.restorativeLeadSourceId,
        FIRST_NAME: firstName ?? sanitize(values.referrerName),
        LAST_NAME: lastName ?? firstName ?? 'Unknown',
        EMAIL: sanitize(values.referrerEmail),
        PHONE: sanitize(values.referrerPhone),
        TITLE: sanitize(values.referrerRole),
        ORGANIZATION_NAME: organization,
        LEAD_DESCRIPTION: [
            'Source: Restorative Program Referral (Website)',
            '',
            descriptionBlock('Brief description of the situation / harm', values.incidentDescription),
            descriptionBlock('Reason for referral', values.reasonReferral),
            descriptionBlock('Other parties involved', values.otherParties),
            descriptionBlock('Safety or confidentiality considerations', values.safetyConcerns),
            descriptionBlock('Current discipline / school / court actions', values.currentDiscipline),
            descriptionBlock('Additional context for staff', values.additionalNotes),
            '',
            values.participantName ? `Participant: ${values.participantName}` : undefined,
            values.participantSchool ? `School/Program: ${values.participantSchool}` : undefined,
            values.participantBestTime ? `Best time to contact participant/family: ${values.participantBestTime}` : undefined,
            serviceLabel ? `Requested service: ${serviceLabel}` : undefined,
            values.urgency ? `Urgency: ${values.urgency}` : undefined,
            '',
            '(Submitted via mcrchoward.org restorative program referral form)',
        ]
            .filter(Boolean)
            .join('\n'),
        TAGS: withTags({ TAG_NAME: 'MCRC' }, { TAG_NAME: 'Restorative Program' }, { TAG_NAME: 'Partner Referral' }, organization ? { TAG_NAME: `Referral Org: ${organization}` } : undefined, serviceLabel ? { TAG_NAME: `Service: ${serviceLabel}` } : undefined),
    };
}
