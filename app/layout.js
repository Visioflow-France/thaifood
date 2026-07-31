import './globals.css';
import { SITE_URL, NAP, GEO } from '../lib/seo';

// ============================================================================
//  MÉTADONNÉES SEO GLOBALES (Next.js Metadata API).
//  - metadataBase requis pour résoudre canonical / og:image en URLs absolues.
//  - Cible locale : « restaurant thaï » et « fast food thaï » à Pontault-Combault.
// ============================================================================
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Restaurant Thaï à Pontault-Combault — Fast Food Thaï | Thaï Food 77',
    template: '%s · Thaï Food 77',
  },
  description:
    'Restaurant thaï à Pontault-Combault : cuisine thaïlandaise authentique et fast food thaï à emporter ou sur place. Pad Thaï, currys, Tom Yum, bobuns et woks préparés à la commande.',
  applicationName: 'Thaï Food 77',
  keywords: [
    'restaurant thaï Pontault-Combault',
    'fast food thaï Pontault-Combault',
    'restaurant thai pontault',
    'fast food thai pontault',
    'restaurant thaïlandais 77',
    'cuisine thaïlandaise Pontault-Combault',
    'Thaï Food 77',
    'à emporter thaï Pontault-Combault',
  ],
  authors: [{ name: NAP.name }],
  creator: NAP.name,
  publisher: NAP.name,
  category: 'restaurant',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: NAP.name,
    title: 'Restaurant Thaï & Fast Food Thaï à Pontault-Combault — Thaï Food 77',
    description:
      'Cuisine thaïlandaise authentique à Pontault-Combault. Sur place ou à emporter : Pad Thaï, currys, Tom Yum préparés à la commande.',
    // Pas d'`images` ici : générées automatiquement par app/opengraph-image.js.
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurant Thaï & Fast Food Thaï à Pontault-Combault — Thaï Food 77',
    description:
      'Cuisine thaïlandaise authentique à Pontault-Combault. Sur place ou à emporter.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  // Balises géo (SEO local) — via metadata.other (le plus propre en App Router).
  other: {
    'geo.region': NAP.region,
    'geo.placename': NAP.city,
    'geo.position': `${GEO.latitude};${GEO.longitude}`,
    ICBM: `${GEO.latitude}, ${GEO.longitude}`,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

// viewport + themeColor (Next 14.2) — la balise <meta name="viewport"> manuelle
// est retirée du <head> ci-dessous.
export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#0b0f0a',
};

export default function RootLayout({ children }) {
  // Script inline posant la classe `js` sur <html> AVANT la peinture.
  // Permet le progressive enhancement : le CSS ne masque (.reveal / img) QUE
  // si JS est actif → contenu toujours visible pour Googlebot / no-JS / JS lent.
  const setJsClass = "document.documentElement.classList.add('js')";

  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: setJsClass }} />
        <meta charSet="UTF-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" async></script>
      </head>
      <body className="noise">{children}</body>
    </html>
  );
}
