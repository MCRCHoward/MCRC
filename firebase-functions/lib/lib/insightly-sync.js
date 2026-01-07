"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInsightlySyncForInquiry = runInsightlySyncForInquiry;
const firestore_1 = require("firebase-admin/firestore");
const client_1 = require("./insightly/client");
const config_1 = require("./insightly/config");
const mappers_1 = require("./insightly/mappers");
const form_data_1 = require("./inquiries/form-data");
async function runInsightlySyncForInquiry(params) {
    const { db, inquiryId, serviceArea } = params;
    const data = params.data;
    const formType = data.formType;
    const docRef = db.doc(`serviceAreas/${serviceArea}/inquiries/${inquiryId}`);
    // Mark pending up-front so CMS can show progress.
    await docRef.set({
        insightlySyncStatus: 'pending',
        insightlyLastSyncError: null,
        insightlyLastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    try {
        const hydrated = (0, form_data_1.hydrateFormDataFromFirestore)((data.formData ?? {}));
        let payload;
        if (formType === 'mediation-self-referral') {
            payload = (0, mappers_1.buildSelfReferralLeadPayload)(hydrated);
        }
        else if (formType === 'restorative-program-referral') {
            payload = (0, mappers_1.buildRestorativeReferralLeadPayload)(hydrated);
        }
        else {
            // Unsupported; leave pending state as-is? Prefer to mark failed with message.
            throw new Error(`[Insightly] Unsupported formType: ${String(formType)}`);
        }
        (0, mappers_1.validateLeadPayload)(payload);
        const lead = await (0, client_1.createInsightlyLead)(payload);
        await docRef.set({
            insightlyLeadId: lead.LEAD_ID,
            insightlyLeadUrl: (0, config_1.buildInsightlyLeadUrl)(lead.LEAD_ID) ?? null,
            insightlySyncStatus: 'success',
            insightlyLastSyncError: null,
            insightlyLastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log('[functions][insightly] Sync succeeded', {
            inquiryId,
            serviceArea,
            leadId: lead.LEAD_ID,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await docRef.set({
            insightlySyncStatus: 'failed',
            insightlyLastSyncError: message,
            insightlyLastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.error('[functions][insightly] Sync failed', { inquiryId, serviceArea, error: message });
    }
}
