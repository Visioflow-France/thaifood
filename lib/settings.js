import { getDb } from './firebase-admin';

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

export async function getSettings() {
  const snap = await getDb().collection(COL).doc(DOC).get();
  if (!snap.exists) return { ...DEFAULTS };
  return { ...DEFAULTS, ...snap.data() };
}

// Fusionne des champs partiels (read-modify-write via merge Firestore).
export async function saveSettings(patch = {}) {
  const ref = getDb().collection(COL).doc(DOC);
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return { ...DEFAULTS, ...snap.data() };
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
