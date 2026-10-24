import { NAP } from '../../lib/seo';

// ============================================================================
//  MANIFEST PWA DU SITE VITRINE — ex app/manifest.js (convention fichier).
// ----------------------------------------------------------------------------
//  Converti en Route Handler pour deux raisons :
//   1. La convention fichier (app/manifest.js) GÈRE le <link rel="manifest">
//      de TOUTES les pages et écrase metadata.manifest des layouts — empêchant
//      l'admin d'avoir son propre manifest PWA.
//   2. Avec les liens déclarés explicitement (layout racine + layout admin),
//      chaque hôte référence SON manifest.
//  Même URL qu'avant (/manifest.webmanifest) → aucun changement visible pour
//  les visiteurs ni les PWA déjà installées.
// ============================================================================

export const dynamic = 'force-static';

export function GET() {
  const manifest = {
    name: `${NAP.name} — Restaurant Thaï & Fast Food Thaï à Pontault-Combault`,
    short_name: NAP.name,
    description:
      'Restaurant thaï et fast food thaï à Pontault-Combault. Cuisine thaïlandaise authentique préparée à la commande, sur place ou à emporter.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'fr',
    categories: ['food', 'restaurant'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      // PNG + maskable : requis par Chrome pour l'installabilité (icône ≥192px)
      // et pour les masques d'icônes Android (purpose 'maskable').
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
