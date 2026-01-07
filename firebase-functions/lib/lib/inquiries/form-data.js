"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareFormDataForFirestore = prepareFormDataForFirestore;
exports.hydrateFormDataFromFirestore = hydrateFormDataFromFirestore;
const firestore_1 = require("firebase-admin/firestore");
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
function serializeValue(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (Array.isArray(value)) {
        return value.map((item) => serializeValue(item)).filter((item) => item !== undefined);
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        const next = {};
        for (const [key, childValue] of entries) {
            const serialized = serializeValue(childValue);
            if (serialized !== undefined) {
                next[key] = serialized;
            }
        }
        return next;
    }
    return value;
}
function hydrateValue(value) {
    if (value instanceof firestore_1.Timestamp) {
        return value.toDate();
    }
    if (typeof value === 'string' && ISO_DATE_PATTERN.test(value)) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }
    if (Array.isArray(value)) {
        return value.map((item) => hydrateValue(item));
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        const next = {};
        for (const [key, childValue] of entries) {
            next[key] = hydrateValue(childValue);
        }
        return next;
    }
    return value;
}
function prepareFormDataForFirestore(data) {
    return serializeValue(data);
}
function hydrateFormDataFromFirestore(data) {
    return hydrateValue(data);
}
