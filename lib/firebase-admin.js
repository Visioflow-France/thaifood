import { createSign } from 'node:crypto';

// ============================================================================
//  FIREBASE SANS SDK — client REST maison (Firestore + Cloud Storage)
// ----------------------------------------------------------------------------
//  Le SDK firebase-admin ne peut PAS tourner sur Cloudflare Workers : il
//  repose sur gRPC (inexistant sous workerd) et bundlé il dépasse la limite
//  de taille des Workers (15 Mo vs 3 Mo). On parle donc directement aux API
//  REST via fetch + un JWT de compte de service (node:crypto, ~0 Ko).
//
//  Cette API imite le SDK Admin (getDb().collection().doc().get()/set()…)
//  pour que lib/store.js, lib/orders.js, lib/site.js, lib/settings.js,
//  lib/rateLimit.js et app/api/admin/upload n'aient rien à changer.
//
//  Variables requises : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
//  FIREBASE_PRIVATE_KEY. Optionnelle : FIREBASE_STORAGE_BUCKET.
//  ⚠️ Pas de watch temps réel (onSnapshot) : le flux SSE des commandes
//  reste désactivé (IS_FIRESTORE_REST = true), le dashboard interroge
//  /api/admin/orders en polling (fallback déjà prévu côté client).
// ============================================================================

export const IS_FIRESTORE_REST = true; // pas de gRPC, jamais.

let _token = null; // { token, expiresAt }

function b64url(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

// OAuth2 Google : JWT RS256 signé avec la clé du compte de service → token
// d'accès (cache ~50 min). Scopes : Firestore + Storage.
async function getAccessToken() {
  if (_token && Date.now() < _token.expiresAt) return _token.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: process.env.FIREBASE_CLIENT_EMAIL,
      scope:
        'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.read_write',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(
    (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  );
  const assertion = `${header}.${claims}.${Buffer.from(signature).toString('base64url')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Auth Google échouée (${res.status}) ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  _token = { token: j.access_token, expiresAt: Date.now() + ((j.expires_in || 3600) - 60) * 1000 };
  return _token.token;
}

// --- Firestore : base + appel authentifié -----------------------------------

const FS_OPS = { '==': 'EQUAL', '!=': 'NOT_EQUAL', '>': 'GREATER_THAN', '>=': 'GREATER_THAN_OR_EQUAL', '<': 'LESS_THAN', '<=': 'LESS_THAN_OR_EQUAL', in: 'IN', 'array-contains': 'ARRAY_CONTAINS' };

function fsBase() {
  return `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

async function fsApi(path, { method = 'GET', body, params } = {}) {
  const url = new URL(`${fsBase()}/${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      // Paramètres répétés (ex : updateMask.fieldPaths=a&…=b) — jamais "a,b".
      for (const item of Array.isArray(v) ? v : [v]) url.searchParams.append(k, item);
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Firestore ${res.status} sur ${path} : ${t.slice(0, 300)}`);
  }
  return res.status === 200 || res.status === 201 ? res.json().catch(() => ({})) : {};
}

// --- Conversion JS ↔ format « Value » de l'API Firestore ---------------------

export function toValue(v) {
  if (v === null || v === undefined) return { nullValue: 'NULL_VALUE' };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  return { mapValue: { fields: toFields(v) } };
}

export function toFields(obj = {}) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = toValue(val);
  return fields;
}

export function fromValue(v = {}) {
  if ('nullValue' in v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('bytesValue' in v) return v.bytesValue;
  if ('arrayValue' in v) return (v.arrayValue?.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue?.fields || {});
  return undefined;
}

export function fromFields(fields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromValue(v);
  return out;
}

// --- Références / snapshots (imitent le SDK Admin) ---------------------------

function makeSnapshot(id, json) {
  const data = json?.fields ? fromFields(json.fields) : null;
  return { id, exists: Boolean(json?.fields), data: () => data };
}

function makeDocRef(col, id) {
  const path = `${col}/${id}`;
  return {
    id,
    _path: path,
    get: () => fsApi(path).then((j) => makeSnapshot(id, j)).catch((e) => {
      if (/Firestore 404/.test(e.message)) return { id, exists: false, data: () => null };
      throw e;
    }),
    // set() sans merge REMPLACE le document ; avec merge, fusionne les champs
    // de premier niveau (comme le SDK).
    set: (data, opts) =>
      fsApi(path, {
        method: 'PATCH',
        params: opts?.merge ? { 'updateMask.fieldPaths': Object.keys(data || {}) } : undefined,
        body: { fields: toFields(data) },
      }).then(() => {}),
    update: (patch) =>
      fsApi(path, {
        method: 'PATCH',
        params: { 'updateMask.fieldPaths': Object.keys(patch || {}) },
        body: { fields: toFields(patch) },
      }).then(() => {}),
    delete: () => fsApi(path, { method: 'DELETE' }).then(() => {}),
  };
}

function makeQuery(col, { filters = [], orders = [], limitN } = {}) {
  return {
    where: (f, op, v) => makeQuery(col, { filters: [...filters, { f, op, v }], orders, limitN }),
    orderBy: (f, dir) => makeQuery(col, { filters, orders: [...orders, { f, dir }], limitN }),
    limit: (n) => makeQuery(col, { filters, orders, limitN: n }),
    get: async () => {
      const structuredQuery = { from: [{ collectionId: col }] };
      if (filters.length) {
        structuredQuery.where = {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(({ f, op, v }) => ({
              fieldFilter: { field: { fieldPath: f }, op: FS_OPS[op] || 'EQUAL', value: toValue(v) },
            })),
          },
        };
      }
      if (orders.length) {
        structuredQuery.orderBy = orders.map(({ f, dir }) => ({
          field: { fieldPath: f },
          direction: dir === 'desc' ? 'DESCENDING' : 'ASCENDING',
        }));
      }
      if (limitN) structuredQuery.limit = limitN;
      const rows = await fsApi(':runQuery', {
        method: 'POST',
        body: { structuredQuery },
      });
      const docs = (Array.isArray(rows) ? rows : [])
        .filter((r) => r.document)
        .map((r) => {
          const id = r.document.name.split('/').pop();
          return { id, ref: makeDocRef(col, id), ...makeSnapshot(id, r.document) };
        });
      return { empty: docs.length === 0, docs };
    },
  };
}

// --- Transaction (lecture + écritures atomiques) -----------------------------
// Utilisée pour le compteur de commandes quotidien (config/orderSeq).
async function runTransaction(fn) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { transaction } = await fsApi(':beginTransaction', { method: 'POST', body: {} });
    const writes = [];
    const tx = {
      get: async (ref) => {
        try {
          const j = await fsApi(ref._path, { params: { transaction } });
          return makeSnapshot(ref.id, j);
        } catch (e) {
          // Doc absent dans la transaction → snap.exists = false (comme le SDK).
          if (/Firestore 404/.test(e.message)) return { id: ref.id, exists: false, data: () => null };
          throw e;
        }
      },
      set: (ref, data, opts) => {
        // Nom de ressource complet SANS https://… (exigé par :commit).
        const name = `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${ref._path}`;
        const write = { update: { name, fields: toFields(data) } };
        if (opts?.merge) write.updateMask = { fieldPaths: Object.keys(data || {}) };
        writes.push(write);
      },
      // update() = set() avec fusion (même sémantique que le SDK Admin : les
      // champs non mentionnés sont préservés). Indispensable à markOrderPaid.
      update: (ref, patch) => {
        const name = `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${ref._path}`;
        writes.push({
          update: { name, fields: toFields(patch) },
          updateMask: { fieldPaths: Object.keys(patch || {}) },
        });
      },
    };
    try {
      await fn(tx);
      await fsApi(':commit', { method: 'POST', body: { transaction, writes } });
      return;
    } catch (e) {
      lastErr = e;
      try { await fsApi(':rollback', { method: 'POST', body: { transaction } }); } catch {}
      if (!/Firestore 40[09]/.test(e.message)) throw e; // non-conflit → bug réel
    }
  }
  throw lastErr;
}

// --- API publique (mêmes noms qu'avant) ---------------------------------------

export function getDb() {
  return {
    collection: (col) => ({
      doc: (id) => makeDocRef(col, String(id)),
      ...makeQuery(col),
    }),
    runTransaction,
  };
}

// --- Cloud Storage (upload/suppression d'images) ------------------------------

export function getBucket() {
  // Les projets Firebase récents utilisent <pid>.firebasestorage.app
  // (l'ancien <pid>.appspot.com n'existe plus pour eux).
  const name =
    process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  // ⚠️ Écriture via l'API GCS (storage.googleapis.com) : l'endpoint
  // firebasestorage.googleapis.com répond 403 même avec un token de compte
  // de service sur ces buckets récents. La LECTURE publique, elle, passe par
  // l'URL v0 de firebasestorage (règles Firebase « allow read ») — c'est
  // l'URL construite par la route /api/admin/upload, inchangée.
  const base = `https://storage.googleapis.com/storage/v1/b/${name}/o`;
  const uploadBase = `https://storage.googleapis.com/upload/storage/v1/b/${name}/o`;
  return {
    name,
    file(path) {
      const enc = encodeURIComponent(path);
      return {
        save: async (buf, { metadata } = {}) => {
          const res = await fetch(`${uploadBase}?uploadType=media&name=${enc}`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${await getAccessToken()}`,
              'Content-Type': metadata?.contentType || 'application/octet-stream',
            },
            body: buf,
          });
          if (!res.ok) {
            const t = await res.text().catch(() => '');
            throw new Error(`Upload Storage échoué (${res.status}) ${t.slice(0, 200)}`);
          }
        },
        delete: async () => {
          const res = await fetch(`${base}/${enc}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${await getAccessToken()}` },
          });
          if (!res.ok && res.status !== 404) {
            throw new Error(`Suppression Storage échouée (${res.status})`);
          }
        },
      };
    },
  };
}

// Vrai si les identifiants Firebase sont présents.
export function hasFirebaseConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}
