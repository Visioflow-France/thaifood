// ============================================================================
//  RESET STRIPE CONNECT — efface le lien vers le compte restaurateur connecté
//  (document Firestore `config/stripe` : connectedAccountId + account) pour
//  pouvoir refaire l'onboarding depuis zéro.
//
//  Effet : la page « Paiement » du dashboard revient à « Aucun compte
//  restaurateur connecté ». Au prochain clic sur « Connecter mon compte
//  Stripe », un NOUVEAU compte Stripe Connect sera créé (l'ancien reste dans
//  le dashboard Stripe de la plateforme, mais n'est plus lié au site).
//
//  À lancer avec :  node --env-file=.env.local scripts/reset-stripe-connect.mjs
// ============================================================================
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_CLIENT_EMAIL ||
  !process.env.FIREBASE_PRIVATE_KEY
) {
  console.error(
    '❌ Variables Firebase manquantes. Lance avec : node --env-file=.env.local scripts/reset-stripe-connect.mjs'
  );
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
const ref = db.collection('config').doc('stripe');
const snap = await ref.get();

if (!snap.exists) {
  console.log('ℹ️  Aucun compte Stripe Connect enregistré (déjà vierge). Rien à réinitialiser.');
  process.exit(0);
}

const before = snap.data();
console.log('État actuel du compte Stripe Connect :');
console.log(JSON.stringify(before, null, 2));

await ref.delete();
console.log('\n✅ Compte Stripe Connect réinitialisé. L\'onboarding repartira de zéro.');
process.exit(0);
