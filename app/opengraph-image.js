import { ImageResponse } from 'next/og';
import { renderOGImage, OG_SIZE, OG_CONTENT_TYPE } from '../lib/og-image';

// Image de partage Open Graph (Facebook, WhatsApp, LinkedIn, iMessage…).
// Next 14 câble automatiquement la balise <meta property="og:image">.
// force-dynamic : génération à la demande côté serveur (évite le prerender
// build qui échoue avec @vercel/og quand le chemin du projet contient un
// espace — ex. « thai food ». Sur Vercel le chemin n'en a pas : OK).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const alt =
  'Thaï Food 77 — Restaurant thaï & fast food thaï à Pontault-Combault';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return new ImageResponse(renderOGImage(), { ...OG_SIZE });
}
