import { getDb } from './firebase-admin';
import { purgeEdgeCache, CACHE_KEYS } from './edge-cache';

// Note : getSettings est résilient — sans Firebase (clé absente/invalide,
// quota), on renvoie les défauts au lieu de faire planter le checkout.

// ============================================================================
//  RÉGLAGES PAIEMENT — Stripe Connect Express (Firestore)
// ----------------------------------------------------------------------------
//  Stocke l'ID du compte Stripe connecté + son statut dans Firestore
//  (collection `config`, document `stripe`). La persistance est indispensable
//  sur un hébergement serverless (Vercel) — sinon la connexion serait perdue
//  à chaque redémarrage.
//
//  ⚠️ La COMMISSION PLATEFORME ne vit PAS ici ni dans le dashboard : c'est un
//  réglage de la plateforme, via PLATFORM_COMMISSION_PERCENT dans .env.local.
// ============================================================================

const COL = 'config';
const DOC = 'stripe';

const DEFAULTS = {
  connectedAccountId: null,
  account: null,
};

// ----------------------------------------------------------------------------
//  CACHE SERVEUR (TTL 30 s) — isStripeActive() lit ces réglages à chaque
//  affichage du checkout et à chaque création de commande. Même principe que
//  lib/store.js et lib/site.js : invalidation à chaque écriture (onboarding
//  Stripe → fraîcheur immédiate sur cet isolate + purge du cache edge).
// ----------------------------------------------------------------------------
const SETTINGS_TTL = 30_000; // cache serveur : 30 s
let _cache = null; // { ...DEFAULTS, ...doc }
let _cacheAt = 0;

export async function getSettings() {
  if (_cache && Date.now() - _cacheAt < SETTINGS_TTL) return { ..._cache };
  try {
    const snap = await getDb().collection(COL).doc(DOC).get();
    _cache = snap.exists ? { ...DEFAULTS, ...snap.data() } : { ...DEFAULTS };
  } catch (e) {
    console.error('[settings] lecture impossible, défauts :', e?.details || e?.message);
    _cache = _cache || { ...DEFAULTS }; // on garde l'ancien cache si dispo
  }
  _cacheAt = Date.now();
  return { ..._cache };
}

// Fusionne des champs partiels (read-modify-write via merge Firestore).
export async function saveSettings(patch = {}) {
  const ref = getDb().collection(COL).doc(DOC);
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  _cache = { ...DEFAULTS, ...snap.data() };
  _cacheAt = Date.now();
  await purgeEdgeCache(CACHE_KEYS.config);
  return { ..._cache };
}

export async function getConnectedAccountId() {
  return (await getSettings()).connectedAccountId;
}

// Borne le pourcentage de commission à [0, 50].
export function clampCommission(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(50, Math.round(n * 100) / 100));
}

// Commission plateforme (%) — réglée par la PLATEFORME via
// PLATFORM_COMMISSION_PERCENT (.env.local), JAMAIS par le restaurateur.
export function getCommissionPercent() {
  return clampCommission(process.env.PLATFORM_COMMISSION_PERCENT);
}
