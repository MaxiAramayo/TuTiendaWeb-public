/**
 * Seed de datos para los emuladores de Firebase.
 *
 * Crea: un usuario owner (con custom claims), una tienda demo, categorías con
 * subcategorías, tags y productos de ejemplo (incluyendo productos con subcategoría).
 *
 * Uso:
 *   1) En otra terminal: npm run emulators   (requiere Java 11+)
 *   2) npm run seed:emulator
 *
 * Idempotente: usa IDs fijos, se puede correr varias veces.
 */

// Apuntar el Admin SDK a los emuladores ANTES de importar firebase-admin.
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199';

import admin from 'firebase-admin';

const PROJECT_ID = 'demo-tutiendaweb';
const STORE_ID = 'demo-store';
const OWNER_UID = 'demo-owner';
const OWNER_EMAIL = 'demo@tutiendaweb.test';
const OWNER_PASSWORD = '123456';

admin.initializeApp({
    projectId: PROJECT_ID,
    storageBucket: `${PROJECT_ID}.appspot.com`,
});

const db = admin.firestore();
const auth = admin.auth();
const now = admin.firestore.FieldValue.serverTimestamp();

async function seedAuthUser() {
    try {
        await auth.getUser(OWNER_UID);
        await auth.updateUser(OWNER_UID, { email: OWNER_EMAIL, password: OWNER_PASSWORD });
    } catch {
        await auth.createUser({
            uid: OWNER_UID,
            email: OWNER_EMAIL,
            password: OWNER_PASSWORD,
            displayName: 'Dueño Demo',
        });
    }
    await auth.setCustomUserClaims(OWNER_UID, { storeId: STORE_ID, role: 'owner' });
    console.log(`✅ Usuario owner: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
}

async function seedStore() {
    await db.collection('stores').doc(STORE_ID).set({
        id: STORE_ID,
        ownerId: OWNER_UID,
        basicInfo: {
            name: 'Tienda Demo',
            slug: 'tienda-demo',
            description: 'Tienda general de prueba con emulador',
            type: 'general',
        },
        contactInfo: { whatsapp: '+5491100000000', website: '' },
        settings: { currency: 'ARS', language: 'es', timezone: 'America/Argentina/Buenos_Aires' },
        subscription: { plan: 'pro', active: true, trialUsed: false },
        metadata: {
            ownerId: OWNER_UID,
            createdAt: now,
            updatedAt: now,
            status: 'active',
            version: 1,
            onboardingCompleted: true,
            onboardingStep: 'complete',
        },
    });

    await db.collection('users').doc(OWNER_UID).set({
        uid: OWNER_UID,
        email: OWNER_EMAIL,
        displayName: 'Dueño Demo',
        storeIds: [STORE_ID],
        createdAt: now,
        updatedAt: now,
    });
    console.log('✅ Tienda demo creada');
}

interface SeedCategory {
    id: string;
    name: string;
    parentId: string | null;
}

const categories: SeedCategory[] = [
    { id: 'cat-cargadores', name: 'Cargadores', parentId: null },
    { id: 'sub-tipo-c', name: 'Cargador tipo C', parentId: 'cat-cargadores' },
    { id: 'sub-auto', name: 'Cargadores para auto', parentId: 'cat-cargadores' },
    { id: 'cat-cables', name: 'Cables', parentId: null },
    { id: 'cat-fundas', name: 'Fundas', parentId: null },
    { id: 'sub-iphone', name: 'Fundas iPhone', parentId: 'cat-fundas' },
];

async function seedCategories() {
    const col = db.collection('stores').doc(STORE_ID).collection('categories');
    for (const cat of categories) {
        await col.doc(cat.id).set({
            storeId: STORE_ID,
            name: cat.name,
            slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
            parentId: cat.parentId,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
    }
    console.log(`✅ ${categories.length} categorías (con subcategorías) creadas`);
}

const tags = [
    { id: 'tag-nuevo', name: 'Nuevo' },
    { id: 'tag-oferta', name: 'Oferta' },
];

async function seedTags() {
    const col = db.collection('stores').doc(STORE_ID).collection('tags');
    for (const tag of tags) {
        await col.doc(tag.id).set({
            storeId: STORE_ID,
            name: tag.name,
            slug: tag.name.toLowerCase(),
            createdAt: now,
            updatedAt: now,
        });
    }
    console.log(`✅ ${tags.length} tags creados`);
}

interface SeedProduct {
    id: string;
    name: string;
    price: number;
    categoryId: string;
    subcategoryId?: string;
    tags?: string[];
}

const products: SeedProduct[] = [
    { id: 'prod-cargador-20w', name: 'Cargador 20W USB-C', price: 8500, categoryId: 'cat-cargadores', subcategoryId: 'sub-tipo-c', tags: ['tag-nuevo'] },
    { id: 'prod-cargador-auto', name: 'Cargador de auto dual', price: 6200, categoryId: 'cat-cargadores', subcategoryId: 'sub-auto', tags: ['tag-oferta'] },
    { id: 'prod-cable-usbc', name: 'Cable USB-C 1m', price: 3000, categoryId: 'cat-cables' },
    { id: 'prod-funda-iphone15', name: 'Funda iPhone 15', price: 4500, categoryId: 'cat-fundas', subcategoryId: 'sub-iphone', tags: ['tag-nuevo', 'tag-oferta'] },
];

async function seedProducts() {
    const col = db.collection('stores').doc(STORE_ID).collection('products');
    for (const p of products) {
        await col.doc(p.id).set({
            storeId: STORE_ID,
            name: p.name,
            slug: p.name.toLowerCase().replace(/\s+/g, '-'),
            description: `${p.name} — producto de ejemplo`,
            price: p.price,
            costPrice: Math.round(p.price * 0.5),
            categoryId: p.categoryId,
            ...(p.subcategoryId ? { subcategoryId: p.subcategoryId } : {}),
            tags: p.tags ?? [],
            variants: [],
            imageUrls: [],
            currency: 'ARS',
            status: 'active',
            hasPromotion: false,
            createdAt: now,
            updatedAt: now,
        });
    }
    console.log(`✅ ${products.length} productos creados`);
}

async function main() {
    console.log('🌱 Sembrando datos en el emulador...');
    await seedAuthUser();
    await seedStore();
    await seedCategories();
    await seedTags();
    await seedProducts();
    console.log('\n🎉 Seed completo.');
    console.log(`   Login dashboard: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
    console.log('   Catálogo público: /tienda-demo  (o la ruta de carta que use tu app)');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
});
