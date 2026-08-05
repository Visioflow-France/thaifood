// ============================================================================
//  SET PHONE — enregistre le numéro de téléphone du restaurant dans le
//  document Firestore `config/site` (même source que le dashboard).
//  À lancer avec :  node --env-file=.env.local scripts/set-phone.mjs
// ============================================================================
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PHONE = process.argv[2] || '01 75 13 61 91';

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error('❌ Variables Firebase manquantes. Lance avec : node --env-file=.env.local scripts/set-phone.mjs');
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);
await db.collection('config').doc('site').set({ phone: PHONE }, { merge: true });

const snap = await db.collection('config').doc('site').get();
console.log('✅ Téléphone enregistré :', snap.data().phone);
process.exit(0);
