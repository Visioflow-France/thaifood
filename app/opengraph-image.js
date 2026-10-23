import { ImageResponse } from 'next/og';
import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE, OG_CACHE_VERSION } from '../lib/og-image';
import { cachedBinary, CACHE_KEYS } from '../lib/edge-cache';

// Image de partage Open Graph (Facebook, WhatsApp, LinkedIn, iMessage…).
// Next câble automatiquement la balise <meta property="og:image">.
// force-dynamic : génération à la demande côté serveur (évite le prerender
// build qui échoue avec @vercel/og quand le chemin du projet contient un
// espace — ex. « thai food »).
//
// ⚡ CPU : le rendu (satori + resvg) coûte plusieurs centaines de ms de CPU —
// largement au-dessus de la limite du plan gratuit Workers. Le PNG étant 100 %
// statique, il est généré ~1 fois par 24 h et par colo puis servi depuis le
// cache edge (caches.default) : les requêtes suivantes ne coûtent plus rien.
// Design modifié ? → incrémenter OG_CACHE_VERSION dans lib/og-image.js.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const alt =
  'Thaï Food 77 — Restaurant thaï & fast food thaï à Pontault-Combault';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage() {
  return cachedBinary(`${CACHE_KEYS.ogImage}?${OG_CACHE_VERSION}`, async () => {
    const generated = new ImageResponse(renderOGImage(), { ...OG_SIZE });
    return generated.arrayBuffer();
  }, { contentType: OG_CONTENT_TYPE });
}
