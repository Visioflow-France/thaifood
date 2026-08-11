import { getDb } from './firebase-admin';

// ============================================================================
//  LIMITATION ANTI FORCE-BRUTE sur /api/login.
// ----------------------------------------------------------------------------
//  max MAX_ATTEMPTS tentatives par fenêtre de WINDOW_MS, par IP. Au-delà,
//  l'IP est bloquée LOCK_MS. L'état est persisté dans Firestore : indispensable
//  sur un hébergement serverless (Vercel) où la mémoire d'une instance n'est ni
//  partagée ni persistante entre les invocations.
//
//  Fail-open : en cas d'erreur Firestore ponctuelle, on laisse passer (on ne
//  veut surtout pas bloquer l'admin légitime). Le pire cas est donc un contourn
//  passager de la limite — jamais un blocage intempestif.
//
//  Volume attendu négligeable : un seul admin, connexion occasionnelle.
// ============================================================================

const COLLECTION = 'loginAttempts';
const MAX_ATTEMPTS = 5; // tentatives autorisées avant blocage
const WINDOW_MS = 15 * 60 * 1000; // fenêtre de comptage : 15 min
const LOCK_MS = 15 * 60 * 1000; // durée du blocage : 15 min

// IP client réelle. Vercel (et la plupart des hôtes) renseigne x-forwarded-for.
export function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function docId(ip) {
  // Sécurise l'ID de document (les '/' ne sont pas autorisés).
  return String(ip).replace(/[/]/g, '_');
}

// True/False : l'IP peut-elle tenter une connexion maintenant ?
// Renvoie { allowed, retryAfterSec }.
export async function checkRateLimit(ip) {
  try {
    const db = getDb();
    const ref = db.collection(COLLECTION).doc(docId(ip));
    const snap = await ref.get();
    if (!snap.exists) return { allowed: true };

    const now = Date.now();
    const { lockedUntil, firstAttemptAt } = snap.data();
    if (lockedUntil && lockedUntil > now) {
      return { allowed: false, retryAfterSec: Math.ceil((lockedUntil - now) / 1000) };
    }
    // Fenêtre expirée → on oublie l'historique.
    if (firstAttemptAt && now - firstAttemptAt > WINDOW_MS) {
      await ref.delete();
    }
    return { allowed: true };
  } catch {
    return { allowed: true }; // fail-open
  }
}

// À appeler après un échec d'authentification. Renvoie { locked, retryAfterSec }.
export async function recordFailedAttempt(ip) {
  try {
    const db = getDb();
    const ref = db.collection(COLLECTION).doc(docId(ip));
    const snap = await ref.get();
    const now = Date.now();

    if (!snap.exists) {
      await ref.set({ count: 1, firstAttemptAt: now, lockedUntil: 0 });
      return { locked: false, retryAfterSec: 0 };
    }

    let { count = 0, firstAttemptAt = now } = snap.data();
    // Nouvelle fenêtre si la précédente est dépassée.
    if (now - firstAttemptAt > WINDOW_MS) {
      count = 0;
      firstAttemptAt = now;
    }
    count += 1;

    const locked = count >= MAX_ATTEMPTS;
    const lockedUntil = locked ? now + LOCK_MS : 0;
    await ref.set({ count, firstAttemptAt, lockedUntil });
    return { locked, retryAfterSec: locked ? Math.ceil(LOCK_MS / 1000) : 0 };
  } catch {
    return { locked: false, retryAfterSec: 0 }; // fail-open
  }
}

// À appeler après une connexion réussie : on nettoie l'historique de l'IP.
export async function clearAttempts(ip) {
  try {
    await getDb().collection(COLLECTION).doc(docId(ip)).delete();
  } catch {
    /* ignore */
  }
}
