import Stripe from 'stripe';

// ============================================================================
//  CLIENT STRIPE (compte PLATEFORME) — Stripe Connect Express
// ----------------------------------------------------------------------------
//  La clé secrète utilisée ici est celle du compte plateforme (celui qui gère
//  le site), PAS celle du restaurateur. Le restaurateur, lui, connecte son
//  propre compte via l'onboarding Express (voir app/api/stripe/onboarding).
//
//  Sans STRIPE_SECRET_KEY, le site retombe sur le mode « paiement sur place »
//  (voir lib/orders.js :: isStripeActive) : rien ne casse en l'absence de Stripe.
// ============================================================================

let _client = null;

// Renvoie le client Stripe si la clé plateforme est configurée, sinon null.
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new Stripe(key, {
      // On ne fixe pas d'apiVersion pour coller à la version de la clé du compte.
      appInfo: { name: 'Thai Food 77' },
      // Client HTTP fetch : le module node:https par défaut du SDK ne sait pas
      // ouvrir de connexion sous Cloudflare Workers (« connection to Stripe »
      // en boucle). fetch y est natif — et fonctionne aussi sous Node 18+.
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return _client;
}

export function hasStripeKey() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Reconstruit l'URL d'origine de la requête (pour les URLs de retour Stripe :
// success_url, return_url, refresh_url).
// En production, on privilégie NEXT_PUBLIC_SITE_URL (déterministe) pour éviter
// tout risque de host-header injection sur les redirections post-paiement.
// En dev, on reconstruit depuis les headers (reverse-proxy local).
export function getRequestOrigin(req) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production' && siteUrl) return siteUrl;
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'localhost:2000';
  const proto =
    req.headers.get('x-forwarded-proto') ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return `${proto}://${host}`;
}
