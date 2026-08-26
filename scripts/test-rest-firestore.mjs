// ============================================================================
//  TEST COMPLET du client REST maison (lib/firebase-admin.js) — Firestore
//  + Storage, sans SDK. Vérifie : lecture docs, query, set/merge/update/delete,
//  transaction, upload/suppression Storage.
//    node scripts/test-rest-firestore.mjs
// ----------------------------------------------------------------------------
// Le projet n'est pas "type": "module" : on copie le shim en .mjs pour
// pouvoir l'importer depuis Node (la copie est refaite à chaque exécution).
// ============================================================================
import { readFileSync, copyFileSync, rmSync } from 'node:fs';
import path from 'node:path';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) {
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

const SHIM = path.join('scripts', '.firebase-rest-copy.mjs');
copyFileSync(path.join('lib', 'firebase-admin.js'), SHIM);

let failures = 0;
const ok = (label, cond, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

try {
  const fb = await import('./.firebase-rest-copy.mjs');

  ok('hasFirebaseConfig()', fb.hasFirebaseConfig());

  // 1. Lecture du document menu (le plus gros : 223 plats).
  const db = fb.getDb();
  const menu = await db.collection('config').doc('menu').get();
  ok('doc config/menu', menu.exists && Array.isArray(menu.data().dishes), `${menu.data()?.dishes?.length} plats`);

  // 2. Doc absent → exists:false sans throw.
  const ghost = await db.collection('config').doc('zz_doc_inexistant').get();
  ok('doc inexistant → exists:false', ghost.exists === false);

  // 3. Docs site + stripe.
  const site = await db.collection('config').doc('site').get();
  ok('doc config/site lisible', site.exists === true || site.exists === false);
  const stripe = await db.collection('config').doc('stripe').get();
  ok('doc config/stripe lisible', typeof stripe.data() === 'object' || stripe.data() === null);

  // 4. Query : dernières commandes (orderBy + limit).
  const recent = await db.collection('orders').orderBy('createdAt', 'desc').limit(3).get();
  ok('query orders (orderBy+limit)', Array.isArray(recent.docs), `${recent.docs.length} commandes`);
  if (recent.docs[0]) {
    const o = recent.docs[0].data();
    ok('commande décodée (types JS)', typeof o.total === 'number' || o.total === undefined, o.ref || o.id);
  }

  // 5. Query where.
  if (recent.docs[0]) {
    const byRef = await db.collection('orders').where('ref', '==', recent.docs[0].data().ref).limit(1).get();
    ok('query where ref ==', !byRef.empty && byRef.docs[0].id === recent.docs[0].id);
  }

  // 6. set / get / update / merge / delete sur une collection temporaire.
  const T = 'rest_test';
  const ref = db.collection(T).doc('check');
  await ref.set({ name: 'essai', count: 1, tags: ['a', 'b'], nested: { x: 1 } });
  let snap = await ref.get();
  ok('set + get', snap.exists && snap.data().count === 1 && snap.data().tags[1] === 'b' && snap.data().nested.x === 1);

  await ref.update({ status: 'preparing', extra: null });
  snap = await ref.get();
  ok('update (merge)', snap.data().name === 'essai' && snap.data().status === 'preparing' && snap.data().extra === null);

  await ref.set({ only: 'this' }); // sans merge → remplace
  snap = await ref.get();
  ok('set sans merge remplace', snap.data().only === 'this' && snap.data().name === undefined);

  await ref.delete();
  snap = await ref.get();
  ok('delete', snap.exists === false);

  // 7. Transaction (comme nextDailySequence : read + set merge atomiques).
  await db.runTransaction(async (tx) => {
    const tref = db.collection(T).doc('seq');
    const s = await tx.get(tref);
    const n = (s.exists ? Number(s.data().count) : 0) + 1;
    await tx.set(tref, { count: n }, { merge: true });
  });
  snap = await db.collection(T).doc('seq').get();
  ok('transaction (merge)', snap.exists && snap.data().count === 1, `count=${snap.data()?.count}`);
  await db.collection(T).doc('seq').delete();

  // 8. Storage : upload d'un mini PNG puis suppression.
  const PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63f8cfc0f01f0005050201edb5ca9f0000000049454e44ae426082',
    'hex'
  );
  const bucket = fb.getBucket();
  const f = bucket.file('menu/_test_rest.png');
  await f.save(PNG, { metadata: { contentType: 'image/png' } });
  ok('upload Storage', true, bucket.name);
  await f.delete();
  ok('delete Storage', true);
} catch (e) {
  failures++;
  console.log('💥 EXCEPTION :', e.message);
} finally {
  try { rmSync(SHIM); } catch {}
}

console.log(failures === 0 ? '\n🎉 TOUT PASSE' : `\n⚠️  ${failures} échec(s)`);
process.exit(failures === 0 ? 0 : 1);
