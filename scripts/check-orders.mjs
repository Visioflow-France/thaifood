// Outil de diagnostic : liste les dernières commandes Firestore.
// Usage : node --env-file=.env.local scripts/check-orders.mjs
import { getDb } from '../lib/firebase-admin.js';

const snap = await getDb().collection('orders').orderBy('createdAt', 'desc').limit(10).get();
if (snap.empty) {
  console.log('Aucune commande en base.');
} else {
  for (const d of snap.docs) {
    const o = d.data();
    const seq = Number.isFinite(o.dailySeq) ? `n°${o.dailySeq}` : '  — ';
    console.log(
      seq.padEnd(5),
      '|', String(o.status).padEnd(16),
      '|', String(o.type).padEnd(8),
      '|', String(o.createdAt || '').slice(0, 19),
      '|', o.ref,
      o.printedAt ? '| imprimé' : ''
    );
  }
}
