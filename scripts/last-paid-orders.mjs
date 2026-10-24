// Date la panne : dernières commandes payées en ligne dans Firestore.
import { config } from 'dotenv';
config({ path: '.env.local' });

const { getDb } = await import('../lib/firebase-admin.js');
// Pas de filtre status (évite un index composite requis) : on prend les
// dernières commandes et on regarde leur statut + paiement en local.
const snap = await getDb().collection('orders').orderBy('createdAt', 'desc').limit(30).get();
const paid = snap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .filter((o) => o.payment?.paymentIntentId)
  .slice(0, 8);

if (paid.length === 0) {
  console.log('Aucune commande payée en ligne dans les 30 dernières.');
} else {
  for (const o of paid) {
    console.log(
      `${o.createdAt}  ${o.ref}  ${o.status.padEnd(10)}  payée en ligne le ${o.paidAt || '?'}`
    );
  }
}

// Et les dernières commandes coincées en échec/attente (symptômes de la panne)
const symptoms = snap.docs
  .map((d) => d.data())
  .filter((o) => o.status === 'failed' || o.status === 'awaiting_payment')
  .slice(0, 5);
if (symptoms.length) {
  console.log('\nCommandes récentes en échec / en attente de paiement :');
  for (const o of symptoms) {
    console.log(
      `${o.createdAt}  ${o.ref}  ${o.status}  ${o.failureReason || ''}`
    );
  }
}
