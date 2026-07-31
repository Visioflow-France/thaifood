import { NAP } from '../lib/seo';

// Manifest PWA — Next 14 expose /manifest.webmanifest et câble
// automatiquement <link rel="manifest">.
export default function manifest() {
  return {
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
    ],
  };
}
