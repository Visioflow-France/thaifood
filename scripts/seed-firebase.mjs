// ============================================================================
//  SEED — importe le menu actuel (data/menu.json) dans Firestore.
// ----------------------------------------------------------------------------
//  À lancer UNE fois, après avoir configuré Firebase (.env.local) et activé
//  Firestore. Charge les collections `categories`, `dishes`, `promos`.
//
//  Utilisation (depuis le dossier thaifood/) :
//    node --env-file=.env.local scripts/seed-firebase.mjs
//
//  (Requiert Node 20.6+ pour --env-file. Idempotent : peut être relancé.)
// ============================================================================

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error(
    '❌ Variables Firebase manquantes. Lance avec : node --env-file=.env.local scripts/seed-firebase.mjs'
  );
  process.exit(1);
}

const menu = JSON.parse(
  readFileSync(resolve(__dirname, '../data/menu.json'), 'utf-8')
);

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
});

const db = getFirestore(app);

async function seedCollection(name, items) {
  if (!items || items.length === 0) {
    console.log(`${name}: rien à importer`);
    return;
  }
  const batch = db.batch();
  for (const item of items) {
    batch.set(db.collection(name).doc(item.id), item);
  }
  await batch.commit();
  console.log(`${name}: ${items.length} importé(s) ✅`);
}

try {
  await seedCollection('categories', menu.categories || []);
  await seedCollection('dishes', menu.dishes || []);
  await seedCollection('promos', menu.promos || []);
  console.log('\n🎉 Seed terminé. Le menu est dans Firestore.');
  process.exit(0);
} catch (e) {
  console.error('\n❌ Erreur seed :', e.message);
  process.exit(1);
}
