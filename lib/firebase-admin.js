import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// ============================================================================
//  FIREBASE ADMIN SDK (côté serveur) — API modulaire
// ----------------------------------------------------------------------------
//  Initialise l'app Firebase avec la clé de service (compte de service) lue
//  depuis .env.local / variables Vercel. Expose :
//    - getDb()      → Firestore (données : plats, catégories, promos, commandes)
//    - getBucket()  → Cloud Storage (photos uploadées)
//
//  Le SDK Admin **contourne les règles de sécurité** Firestore/Storage : le
//  serveur a donc accès à tout. Les navigateurs n'y touchent pas directement
//  (tout passe par nos routes API) — sauf la LECTURE des images Storage, qui
//  doit rester publique (règle `allow read: if true;`).
//
//  Variables requises : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//  Optionnelle : FIREBASE_STORAGE_BUCKET (défaut: <projectId>.appspot.com)
// ============================================================================

let _app = null;
let _db = null;
let _bucket = null;

function serviceAccountCert() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // La clé privée contient des "\n" (littéraux) qu'on convertit en vrais sauts.
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

export function getFirebaseApp() {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApps()[0];
    return _app;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  _app = initializeApp({
    credential: cert(serviceAccountCert()),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  });
  return _app;
}

export function getDb() {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

export function getBucket() {
  if (!_bucket) _bucket = getStorage(getFirebaseApp()).bucket();
  return _bucket;
}

// Vrai si les identifiants Firebase sont présents.
export function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}
