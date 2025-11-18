"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInquiryUpdated = exports.onInquiryCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const options_1 = require("firebase-functions/v2/options");
const STAFF_ROLES = ['admin', 'coordinator'];
if (!admin.apps.length) {
    admin.initializeApp();
}
(0, options_1.setGlobalOptions)({
    region: 'us-central1',
    maxInstances: 20,
});
const db = admin.firestore();
async function getStaffUserIds() {
    const snapshot = await db
        .collection('users')
        .where('role', 'in', STAFF_ROLES)
        .get();
    if (snapshot.empty) {
        console.warn('[functions] No staff users found when attempting to create tasks/activity');
        return [];
    }
    return snapshot.docs.map((doc) => doc.id);
}
async function createAdminTask(payload) {
    const staffIds = await getStaffUserIds();
    if (!staffIds.length)
        return;
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    for (const staffId of staffIds) {
        const taskRef = db.collection('users').doc(staffId).collection('tasks').doc();
        batch.set(taskRef, {
            title: payload.title,
            type: payload.type,
            status: 'pending',
            priority: payload.priority ?? 'medium',
            serviceArea: payload.serviceArea,
            inquiryId: payload.inquiryId,
            link: payload.link,
            assignedTo: staffId,
            createdAt: now,
            due: payload.due ?? null,
        });
    }
    await batch.commit();
    console.log(`[functions] Created task "${payload.title}" for ${staffIds.length} staff member(s)`);
}
async function createAdminActivity(payload) {
    const staffIds = await getStaffUserIds();
    if (!staffIds.length)
        return;
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    for (const staffId of staffIds) {
        const activityRef = db.collection('users').doc(staffId).collection('activity').doc();
        batch.set(activityRef, {
            ...payload,
            read: false,
            createdAt: now,
        });
    }
    await batch.commit();
    console.log(`[functions] Created activity "${payload.message}" for ${staffIds.length} staff member(s)`);
}
function getParticipantName(data) {
    if (!data)
        return 'New Inquiry';
    const formData = (data.formData ?? {});
    const firstName = formData.firstName ?? formData.contactOneFirstName ?? formData.participantName;
    const lastName = formData.lastName ?? formData.contactOneLastName ?? '';
    if (typeof formData.name === 'string' && formData.name.trim().length > 0) {
        return formData.name.trim();
    }
    if (typeof firstName === 'string' && firstName.trim().length > 0) {
        const last = typeof lastName === 'string' && lastName.trim().length > 0 ? ` ${lastName}` : '';
        return `${firstName}${last}`.trim();
    }
    return 'New Inquiry';
}
function formatServiceAreaLabel(serviceArea) {
    switch (serviceArea) {
        case 'facilitation':
            return 'Facilitation';
        case 'restorativePractices':
            return 'Restorative Practices';
        default:
            return 'Mediation';
    }
}
async function closeInitialTasks(inquiryId) {
    const snapshot = await db
        .collectionGroup('tasks')
        .where('inquiryId', '==', inquiryId)
        .where('type', '==', 'new-inquiry')
        .where('status', '==', 'pending')
        .get();
    if (snapshot.empty) {
        return;
    }
    const batch = db.batch();
    const completedAt = admin.firestore.FieldValue.serverTimestamp();
    for (const doc of snapshot.docs) {
        batch.update(doc.ref, {
            status: 'done',
            completedAt,
        });
    }
    await batch.commit();
    console.log(`[functions] Closed ${snapshot.size} initial task(s) for inquiry ${inquiryId}`);
}
function toTimestamp(value) {
    if (!value)
        return null;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed))
        return null;
    return admin.firestore.Timestamp.fromMillis(parsed);
}
exports.onInquiryCreated = (0, firestore_1.onDocumentCreated)({
    document: 'serviceAreas/{serviceId}/inquiries/{inquiryId}',
    region: 'us-central1',
    retry: false,
}, async (event) => {
    const data = event.data?.data();
    const serviceArea = event.params.serviceId;
    const inquiryId = event.params.inquiryId;
    const participantName = getParticipantName(data);
    const serviceLabel = formatServiceAreaLabel(serviceArea);
    const link = `/dashboard/${serviceArea}/inquiries/${inquiryId}`;
    await createAdminTask({
        title: `New ${serviceLabel} inquiry from ${participantName}`,
        link,
        inquiryId,
        serviceArea,
        type: 'new-inquiry',
        priority: 'high',
        due: null,
    });
    await createAdminActivity({
        message: `New ${serviceLabel} inquiry from ${participantName}.`,
        link,
        inquiryId,
    });
});
exports.onInquiryUpdated = (0, firestore_1.onDocumentUpdated)({
    document: 'serviceAreas/{serviceId}/inquiries/{inquiryId}',
    region: 'us-central1',
    retry: false,
}, async (event) => {
    const beforeStatus = event.data?.before?.get('status');
    const afterStatus = event.data?.after?.get('status');
    if (beforeStatus === afterStatus || afterStatus !== 'intake-scheduled') {
        return;
    }
    const serviceArea = event.params.serviceId;
    const inquiryId = event.params.inquiryId;
    const participantName = getParticipantName(event.data?.after?.data());
    const link = `/dashboard/${serviceArea}/inquiries/${inquiryId}`;
    const scheduledTimeRaw = event.data?.after?.get('calendlyScheduling.scheduledTime');
    await closeInitialTasks(inquiryId);
    await createAdminTask({
        title: `Intake call with ${participantName}`,
        link,
        inquiryId,
        serviceArea,
        type: 'intake-call',
        priority: 'high',
        due: toTimestamp(scheduledTimeRaw),
    });
    await createAdminActivity({
        message: `${participantName} has scheduled their intake.`,
        link,
        inquiryId,
    });
});
