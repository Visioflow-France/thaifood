import { ImageResponse } from 'next/og';
import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE, OG_CACHE_VERSION } from '../lib/og-image';
import { cachedBinary, CACHE_KEYS } from '../lib/edge-cache';

// Image de partage Twitter / X. Next câble automatiquement la balise
// <meta name="twitter:image"> (carte summary_large_image définie dans layout.js).
// force-dynamic : voir app/opengraph-image.js (prerender @vercel/og + espace
// dans le chemin du projet).
// ⚡ CPU : mis en cache edge ~1×/24 h par colo (voir app/opengraph-image.js).
// Design modifié ? → incrémenter OG_CACHE_VERSION dans lib/og-image.js.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const alt =
  'Thaï Food 77 — Restaurant thaï & fast food thaï à Pontault-Combault';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function TwitterImage() {
  return cachedBinary(`${CACHE_KEYS.twitterImage}?${OG_CACHE_VERSION}`, async () => {
    const generated = new ImageResponse(renderOGImage(), { ...OG_SIZE });
    return generated.arrayBuffer();
  }, { contentType: OG_CONTENT_TYPE });
}
