// Le tableau de bord admin ne doit pas être indexé (en plus du robots.txt).
// metadata.manifest SURCHARGE celui du layout racine : pointe le manifest PWA
// dédié à l'admin (Route Handler app/admin/manifest.webmanifest/route.js),
// ce qui rend /admin installable comme application distincte du site vitrine.
export const metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
  manifest: '/admin/manifest.webmanifest',
  // Icône raccourci iOS (Safari ignore le manifest pour les raccourcis
  // d'écran d'accueil) + couleur de thème cohérente avec le dashboard.
  // icons.apple SURCHARGE l'apple-touch-icon du layout racine : sans ça,
  // iOS installait l'admin avec l'icône du site vitrine.
  icons: {
    apple: '/admin-apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Admin TF77',
  },
};

export const viewport = {
  themeColor: '#0a0a0a',
  // viewport-fit=cover : en appli installée (iOS, statusBarStyle
  // black-translucent), le contenu s'étend sous la barre système — le Shell
  // compense avec des marges safe-area (env(safe-area-inset-*)).
  viewportFit: 'cover',
};

export default function AdminLayout({ children }) {
  return children;
}
