// Test ponctuel : Firestore en mode REST (celui des Workers Cloudflare).
//   node scripts/test-rest-firestore.mjs
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) {
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const { initializeApp, cert } = await import('firebase-admin/app');
const { getFirestore } = await import('firebase-admin/firestore');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore(app);
db.settings({ preferRest: true }); // <- mode utilisé sous Cloudflare Workers

const t0 = Date.now();
const snap = await db.collection('config').doc('menu').get();
const data = snap.data() || {};
console.log(
  `REST OK en ${Date.now() - t0} ms — doc config/menu existe: ${snap.exists} — plats: ${(data.dishes || []).length}`
);
process.exit(0);
