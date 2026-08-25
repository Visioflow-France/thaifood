/** @type {import('next').NextConfig} */

// Headers de sécurité appliqués à toutes les routes.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limite la fuite de la ref commande dans le Referer vers Stripe/analytics.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
