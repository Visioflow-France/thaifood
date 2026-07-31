// Métadonnées de la page mentions légales (la page est 'use client' dans
// page.js — ce layout server porte les métadonnées).
export const metadata = {
  title: 'Mentions légales',
  description:
    'Mentions légales du restaurant thaï Thaï Food 77 à Pontault-Combault (77).',
  alternates: { canonical: '/mentions-legales' },
  robots: { index: false, follow: true },
};

export default function MentionsLegalesLayout({ children }) {
  return children;
}
