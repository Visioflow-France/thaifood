import { NextResponse } from 'next/server';
import { getStripe } from '../../../lib/stripe';
import { getSettings } from '../../../lib/settings';
import { hasFirebaseConfig, getDb } from '../../../lib/firebase-admin';

// ============================================================================
//  HEALTH CHECK — surveiller AVANT que les clients ne le fassent.
// ----------------------------------------------------------------------------
//  GET /api/health : vérifie VRAIMENT que les briques critiques répondent.
//    - stripe    : la clé plateforme est acceptée (accounts.retrieve) et le
//                  compte restaurateur connecté peut encaisser (charges_enabled).
//    - firestore : lecture réelle d'un document (config/stripe).
//  Réponse : { ok, checks: { stripe: {...}, firestore: {...} }, ts }
//  - 200 si tout va bien, 503 sinon → n'importe quel monitoring externe
//    (UptimeRobot, Cloudflare Health Checks…) peut alerter sur le code HTTP.
//  Durée totale plafonnée à ~10 s : chaque vérification a son propre timeout.
// ============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// fetch avec délai : une brique qui ne répond pas ne doit pas bloquer les autres.
async function withTimeout(promise, ms, label) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} : timeout ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Un secret est-il présent ET au bon format ? Attrape les erreurs de collage
// (ex : sk_live_sk_live_… doublé lors d'un copier-coller) avant Stripe ne les
// refuse au premier client.
function secretShape(key, prefix) {
  if (!key) return { present: false, shape: false };
  const trimmed = key.trim();
  const shape =
    trimmed.startsWith(prefix) &&
    !trimmed.slice(prefix.length).startsWith(prefix) && // pas de préfixe doublé
    trimmed.length > prefix.length + 20;
  return { present: true, shape };
}

async function checkStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  const shape = secretShape(key, 'sk_live_').shape || secretShape(key, 'sk_test_').shape;
  if (!key || !shape) {
    return { ok: false, error: 'STRIPE_SECRET_KEY absente ou format invalide (préfixe doublé ?)' };
  }
  try {
    const stripe = getStripe();
    // 1 appel gratuit : valide la clé AUPRÈS de Stripe (détecte « Expired
    // API Key », clé roulée, compte restreint…) — isStripeActive() ne le fait pas.
    const acct = await withTimeout(stripe.accounts.retrieve(), 8000, 'stripe');
    // Le compte restaurateur connecté (Firestore) peut-il encaisser ?
    const { connectedAccountId } = await getSettings();
    let connected = null;
    if (connectedAccountId) {
      const c = await withTimeout(stripe.accounts.retrieve(connectedAccountId), 8000, 'stripe-connect');
      connected = {
        id: c.id,
        chargesEnabled: Boolean(c.charges_enabled),
        payoutsEnabled: Boolean(c.payouts_enabled),
        requirements: c.requirements?.currently_due?.length || 0,
      };
    }
    return {
      ok: true,
      livemode: key.startsWith('sk_live_'),
      platform: { id: acct.id, chargesEnabled: Boolean(acct.charges_enabled) },
      connected,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function checkFirestore() {
  if (!hasFirebaseConfig()) return { ok: false, error: 'Firebase non configuré (commandes impossibles)' };
  try {
    // Lecture réelle : le JWT de service est signé, Google répond, le doc existe.
    await withTimeout(getDb().collection('config').doc('stripe').get(), 8000, 'firestore');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function GET() {
  const [stripe, firestore] = await Promise.all([checkStripe(), checkFirestore()]);
  const checks = { stripe, firestore };
  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    { ok, checks, ts: new Date().toISOString() },
    { status: ok ? 200 : 503 }
  );
}
