import { NAP } from '../../../lib/seo';

// ============================================================================
//  MANIFEST PWA DÉDIÉ À L'ADMIN — sert /admin/manifest.webmanifest.
// ----------------------------------------------------------------------------
//  Next n'accepte qu'un seul app/manifest.js (à la racine, déjà pris par le
//  site vitrine avec scope:'/'). Un Route Handler permet un second manifest
//  scopé sur le dashboard :
//   - start_url '/admin' + scope '/admin/' : fonctionne sur les deux hôtes —
//     sur admin.thaifood77.fr (hôte canonique de l'admin, '/' est réécrit en
//     /admin par middleware.js) comme sur le domaine principal. Un start_url
//     '/' faisait ouvrir la page CLIENT à l'app installée (bug Safari/iOS).
//   - Icônes dédiées (tuile dorée) : l'app admin se distingue du site vitrine
//     sur l'écran d'accueil.
//   - Référencé uniquement par app/admin/layout.js (metadata.manifest).
// ============================================================================

export const dynamic = 'force-static';

export function GET() {
  const manifest = {
    name: `${NAP.name} — Administration`,
    short_name: 'Admin TF77',
    description:
      'Tableau de bord d’administration Thaï Food 77 : commandes, plats, catégories, promotions et paiements.',
    start_url: '/admin',
    scope: '/admin/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    lang: 'fr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/admin-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/admin-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/admin-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      // Masquable : version safe-area pour les masques d'icônes Android.
      { src: '/admin-icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/admin-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
