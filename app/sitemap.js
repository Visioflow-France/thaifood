import { SITE_URL } from '../lib/seo';

// Sitemap XML généré automatiquement par Next.js à /sitemap.xml.
// On ne liste QUE les routes indexables (exclut /commande noindex et /admin).
export default function sitemap() {
  const lastModified = new Date();
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/mentions-legales`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
