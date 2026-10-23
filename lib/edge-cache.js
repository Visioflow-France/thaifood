import { getCloudflareContext } from '@opennextjs/cloudflare';

// ============================================================================
//  CACHE EDGE (caches.default) — uniquement sous Cloudflare Workers.
// ----------------------------------------------------------------------------
//  Objectif : rester sous la limite CPU du plan gratuit (10 ms/requête).
//  Une réponse chaude est servie depuis le cache du colo SANS re-exécuter la
//  logique (sérialisation JSON, appels Firestore, rendu d'image…).
//
//  ⚠️ Le cache est PAR COLO et partagé entre tous les isolates/visiteurs de ce
//  colo. Les purges ne concernent donc que le colo courant : les autres servent
//  au pire l'ancienne valeur jusqu'au TTL (30 s), comme le cache serveur du
//  menu le fait déjà (voir lib/store.js).
//
//  En dev (`next dev` sous Node), `caches` n'existe pas et le contexte
//  Cloudflare est absent : tous les helpers retombent silencieusement sur
//  « pas de cache / promesse libre » — comportement d'avant, rien ne casse.
// ============================================================================

// Clés synthétiques (host fictif : le cache API exige un URL http(s), il n'y a
// aucune requête réseau derrière). Stables et indépendantes du domaine réel.
export const CACHE_KEYS = {
  menu: 'https://edge-cache.thaifood77.internal/api/menu',
  site: 'https://edge-cache.thaifood77.internal/api/site',
  config: 'https://edge-cache.thaifood77.internal/api/config',
  ogImage: 'https://edge-cache.thaifood77.internal/og/opengraph-image',
  twitterImage: 'https://edge-cache.thaifood77.internal/og/twitter-image',
};

export const TTL_SHORT = 30; // secondes — aligné sur le cache serveur existant
// 24 h pour les binaires (image OG…) : le colo régénère ~1×/jour (coût CPU
// négligeable) et les robots/WhatsApp rafraîchissent leur copie quotidiennement
// — un changement de design se propage en ≤ 24 h au lieu d'un an.
export const TTL_DAY = 86400;

function edgeCache() {
  try {
    return globalThis.caches?.default || null;
  } catch {
    return null;
  }
}

// Réponse JSON servie depuis le cache edge, sinon produite puis mise en cache.
// `bypass: true` → ni lecture ni écriture du cache (sessions admin : elles
// doivent toujours voir l'état réel, jamais une copie de 30 s).
export async function cachedJson(key, produce, { ttl = TTL_SHORT, bypass = false } = {}) {
  const cache = bypass ? null : edgeCache();
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const data = await produce();
  const res = Response.json(data, {
    headers: { 'Cache-Control': `public, max-age=${ttl}` },
  });
  if (cache) {
    try {
      await cache.put(key, res.clone()); // put local au colo : ~0 ms CPU
    } catch {
      /* cache indisponible : sans gravité, on sert sans cacher */
    }
  }
  return res;
}

// Binaire (PNG…) : produit une seule fois par colo puis servi tel quel.
// `produce` doit renvoyer un ArrayBuffer (ex. await new ImageResponse(…).arrayBuffer()).
export async function cachedBinary(key, produce, { contentType, ttl = TTL_DAY } = {}) {
  const cache = edgeCache();
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit;
  }
  const buffer = await produce();
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': `public, max-age=${ttl}`,
  };
  if (cache) {
    try {
      await cache.put(key, new Response(buffer, { headers }));
    } catch {
      /* cache indisponible : sans gravité */
    }
  }
  return new Response(buffer, { headers });
}

// Invalide des clés après une écriture admin. Pas d'erreur si le cache est
// absent (dev) : la prochaine écriture recachera.
export async function purgeEdgeCache(...keys) {
  const cache = edgeCache();
  if (!cache) return;
  await Promise.allSettled(keys.map((key) => cache.delete(key)));
}

// Déporte une tâche secondaire via ctx.waitUntil() : sous Workers, une promesse
// non attendue peut être ANNULÉE dès que la réponse est envoyée (ex. la
// suppression d'une ancienne image Storage après modification d'un plat).
// Hors Workers (dev Node), la promesse court simplement en arrière-plan.
export function fireAndForget(promise) {
  if (!promise || typeof promise.catch !== 'function') return;
  try {
    const { ctx } = getCloudflareContext();
    ctx.waitUntil(promise.catch(() => {}));
  } catch {
    promise.catch(() => {});
  }
}
