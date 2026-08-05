// ============================================================================
//  SET ADDRESS — met à jour l'adresse postale dans config/site (legalFields)
//  et remplace l'ancienne adresse dans le texte des mentions légales stocké.
//  Utilisation : node --env-file=.env.local scripts/set-address.mjs
// ============================================================================
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OLD_STREET = '12 Avenue de la République';
const STREET = process.argv[2] || '142 Avenue Charles Rouxel';
const POSTAL = process.argv[3] || '77340';
const CITY = process.argv[4] || 'Pontault-Combault';

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error('❌ Variables Firebase manquantes. Lance avec : node --env-file=.env.local scripts/set-address.mjs');
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
const ref = db.collection('config').doc('site');
const snap = await ref.get();
const data = snap.data() || {};

const legalFields = {
  ...(data.legalFields || {}),
  streetAddress: STREET,
  postalCode: POSTAL,
  city: CITY,
};

// Remplace l'ancienne adresse dans le texte des mentions légales déjà généré.
let legal = data.legal || '';
if (legal && legal.includes(OLD_STREET)) {
  legal = legal.split(OLD_STREET).join(STREET);
}

await ref.set({ legalFields, legal }, { merge: true });

const a = (await ref.get()).data();
console.log('✅ Adresse mise à jour :', `${a.legalFields.streetAddress}, ${a.legalFields.postalCode} ${a.legalFields.city}`);
console.log('   Adresse remplacée dans les mentions légales :', data.legal && data.legal.includes(OLD_STREET) ? 'oui' : 'non (texte absent ou déjà à jour)');
console.log('   Directeur de publication :', JSON.stringify(a.legalFields.publicationDirector || ''), a.legalFields.publicationDirector ? '✓' : '← encore VIDE');
process.exit(0);
