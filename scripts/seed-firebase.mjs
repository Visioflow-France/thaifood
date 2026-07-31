// ============================================================================
//  SEED — importe le menu (data/menu.json) dans Firestore, en UN SEUL document
//  `config/menu` (optimisation forfait Spark : 1 lecture = tout le menu).
// ----------------------------------------------------------------------------
//  À lancer UNE fois, après avoir configuré Firebase (.env.local) et activé
//  Firestore. Charge dishes + categories + promos dans le document unique.
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

try {
  await db.collection('config').doc('menu').set(
    {
      dishes: menu.dishes || [],
      categories: menu.categories || [],
      promos: menu.promos || [],
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(
    `menu : ${(menu.dishes || []).length} plat(s), ${(menu.categories || []).length} catégorie(s)` +
      ` importés ✅ → document unique config/menu`
  );
  console.log('\n🎉 Seed terminé.');
  process.exit(0);
} catch (e) {
  console.error('\n❌ Erreur seed :', e.message);
  process.exit(1);
}
