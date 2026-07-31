// Page de retour Stripe (confirmation de commande) : non indexée.
// (La page elle-même reste 'use client' dans page.js — seul le layout, server,
// exporte les métadonnées.)
export const metadata = {
  title: 'Confirmation de commande',
  description: 'Confirmation de votre commande Thaï Food 77.',
  robots: { index: false, follow: false },
};

export default function CommandeLayout({ children }) {
  return children;
}
