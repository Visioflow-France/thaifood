import { NextResponse } from 'next/server';

// ============================================================================
//  MIDDLEWARE (nom historique — voir note) — routage par hostname.
// ----------------------------------------------------------------------------
//  NB : Next 16 renomme `middleware.js` en `proxy.js`, MAIS le nouveau fichier
//  `proxy.js` est figé sur le runtime Node.js (impossible d'y déclarer `edge`),
//  et l'adaptateur @opennextjs/cloudflare ne supporte que le middleware Edge.
//  On garde donc le nom `middleware.js` (toujours supporté en 16.x, simple
//  dépréciation) qui, lui, compile en Edge. À surveiller lors des mises à
//  jour Next/OpenNext : si OpenNext supporte un jour proxy.js, renommer.
//
//  Un seul worker OpenNext sert les deux hôtes :
//   - thaifood77.fr        → site vitrine (aucune interception, next() direct)
//   - admin.thaifood77.fr  → dashboard admin (rewrite de / vers /admin)
//
//  Le sous-domaine est déclaré UNIQUEMENT dans le dashboard Cloudflare
//  (Custom Domain) : ce fichier n'y touche pas, et wrangler.toml n'a volontairement
//  aucune clé `routes` — cf. doc Cloudflare « Source of truth » : sans clé routes,
//  aucun deploy ne peut créer/supprimer un domaine. Un deploy raté ne touche donc
//  ni le domaine principal ni le sous-domaine.
//
//  Les cookies de session admin (sameSite=lax) et les fetchs relatifs de
//  AdminApp (/api/...) fonctionnent à l'identique sur les deux hôtes.
// ============================================================================

const ADMIN_HOST = 'admin.thaifood77.fr';
const MAIN_HOST = 'thaifood77.fr';

export function middleware(request) {
  // x-forwarded-host : fiable derrière Cloudflare ; host : fallback (dev local).
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();

  const { pathname } = request.nextUrl;

  // Un seul point d'entrée : /admin sur le domaine principal redirige vers le
  // sous-domaine (307 = méthode préservée, pas de cache navigateur agressif).
  // Testé AVANT le early-return ci-dessous, sinon jamais atteint.
  if (host === MAIN_HOST && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return NextResponse.redirect(
      new URL(`https://${ADMIN_HOST}${pathname}${request.nextUrl.search}`),
      307
    );
  }

  // Site vitrine et dev local : on ne touche à rien (chemin critique zéro).
  if (host !== ADMIN_HOST) return NextResponse.next();

  // Racine du sous-domaine → dashboard.
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/admin', request.url));
  }

  // Dashboard et API : passent tels quels (l'admin fetch /api/... en relatif,
  // même origine → cookies OK, aucune logique CORS nécessaire).
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Fichiers PWA statiques (icônes du manifest, apple-touch-icon, service
  // workers) : passent tels quels. La redirection vers le domaine principal
  // serait bloquante — le navigateur REFUSE d'enregistrer un service worker
  // servi en redirection (302) — et inutile pour les icônes (small payload,
  // même worker). sw.js / firebase-messaging-sw.js n'existent pas encore :
  // prévu pour le futur service worker (offline / notifications push).
  if (
    pathname.startsWith('/icon') ||
    pathname.startsWith('/admin-icon') ||
    pathname.startsWith('/admin-apple-touch-icon') ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/sw.js' ||
    pathname === '/firebase-messaging-sw.js'
  ) {
    return NextResponse.next();
  }

  // Toute autre page sur le sous-domaine → site vitrine (un seul contenu
  // canonique, pas de doublon SEO).
  return NextResponse.redirect(
    new URL(`https://${MAIN_HOST}${pathname}${request.nextUrl.search}`),
    302
  );
}
