import { Timestamp } from 'firebase-admin/firestore';

export function serializeFirestoreData<T>(data: any): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data instanceof Timestamp) {
        return data.toDate().toISOString() as any;
    }

    if (Array.isArray(data)) {
        return data.map(item => serializeFirestoreData(item)) as any;
    }

    if (typeof data === 'object') {
        const serialized: any = {};
        for (const key in data) {
            serialized[key] = serializeFirestoreData(data[key]);
        }
        return serialized;
    }

    return data;
}
