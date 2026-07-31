import crypto from 'crypto';

// ============================================================================
//  AUTHENTIFICATION ADMIN — session cookie signée (HMAC SHA-256).
// ----------------------------------------------------------------------------
//  FAIL-SAFE : en production, l'admin est DÉSACTIVÉ tant que des valeurs
//  fortes et personnelles ne sont pas définies via .env (ADMIN_USERNAME,
//  ADMIN_PASSWORD, SESSION_SECRET). Les valeurs par défaut historiques
//  (présentes dans d'anciennes versions du dépôt) sont refusées en prod.
//
//  En dev (NODE_ENV!=='production'), on retombe sur des valeurs de commodité
//  et un secret éphémère aléatoire (les sessions sont reset au redémarrage).
//
//  Pour une mise en ligne robuste, envisagez Firebase Auth (voir README) ;
//  ce module reste une barrière suffisante tant que les secrets sont secrets.
// ============================================================================

// Valeurs par défaut historiques désormais refusées en production.
const INSECURE_DEFAULTS = new Set([
  'adminthaifood',
  'meilleurthai77',
  'thai-food-77-local-session-secret-change-me',
]);

const IS_PROD = process.env.NODE_ENV === 'production';

// Résout un identifiant admin : valeur forte perso (env) > défaut historique en
// dev > null en prod (admin désactivé).
function resolveCredential(envVar, legacyDefault) {
  const v = process.env[envVar];
  if (v && !INSECURE_DEFAULTS.has(v)) return v;
  return IS_PROD ? null : legacyDefault;
}

const ADMIN_USERNAME = resolveCredential('ADMIN_USERNAME', 'adminthaifood');
const ADMIN_PASSWORD = resolveCredential('ADMIN_PASSWORD', 'meilleurthai77');

// Secret de signature : stable + perso en prod, éphémère en dev, null en prod
// si non configuré (alors aucune session ne peut être créée ni vérifiée).
function resolveSessionSecret() {
  const v = process.env.SESSION_SECRET;
  if (v && !INSECURE_DEFAULTS.has(v)) return v;
  if (IS_PROD) return null;
  return crypto.randomBytes(32).toString('hex');
}
const SESSION_SECRET = resolveSessionSecret();

// Avertissement visible au démarrage si la prod est mal configurée.
if (IS_PROD) {
  if (!SESSION_SECRET) {
    console.error('[auth] ⚠️ SESSION_SECRET manquant ou valeur par défaut en production — admin DÉSACTIVÉ.');
  }
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error('[auth] ⚠️ ADMIN_USERNAME/ADMIN_PASSWORD manquants ou valeurs par défaut en production — admin DÉSACTIVÉ.');
  }
}

export const COOKIE_NAME = 'tf_admin_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// True si l'admin est utilisable dans la conf courante.
export function isAuthConfigured() {
  return Boolean(SESSION_SECRET && ADMIN_USERNAME && ADMIN_PASSWORD);
}

export function verifyCredentials(username, password) {
  // Fail-safe : si la conf est invalide, on n'authentifie jamais.
  if (!isAuthConfigured()) return false;
  return safeEqual(username, ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

function sign(payload) {
  if (!SESSION_SECRET) return ''; // aucune signature possible (admin désactivé).
  return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionCookie() {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  };
}

// `req` = NextRequest (Route Handler). Renvoie true si la session est valide.
export function verifySession(req) {
  if (!SESSION_SECRET) return false; // admin désactivé.
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return false;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return false;
    // Comparaison timing-safe de la signature (digest hex de longueur fixe).
    if (!safeEqual(sign(payload), sig)) return false;
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function clearSessionCookie() {
  return { name: COOKIE_NAME, value: '', httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 };
}
