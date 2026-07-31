import { SITE_URL } from '../lib/seo';

// robots.txt généré automatiquement par Next.js à /robots.txt.
// /admin et /api/ bloqués au crawl (complété par un meta noindex sur /admin
// et /commande via leurs layouts respectifs).
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
