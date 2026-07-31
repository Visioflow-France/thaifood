import { ImageResponse } from 'next/og';
import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from '../lib/og-image';

// Image de partage Twitter / X. Next 14 câble automatiquement la balise
// <meta name="twitter:image"> (carte summary_large_image définie dans layout.js).
// force-dynamic : voir app/opengraph-image.js (prerender @vercel/og + espace
// dans le chemin du projet).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const alt =
  'Thaï Food 77 — Restaurant thaï & fast food thaï à Pontault-Combault';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return new ImageResponse(renderOGImage(), { ...OG_SIZE });
}
