// ============================================================================
//  SOURCE DE VÉRITÉ SEO — partagée par layout (métadonnées), JSON-LD, sitemap
//  et robots. Constantes CODÉES EN DUR (le socle du SEO local doit être stable
//  et cohérent) — on n'appelle PAS getSiteInfo() ici pour garder le rendu
//  statique (pas de Firestore au request time = meilleur TTFB / SEO).
//
//  À synchroniser manuellement si l'adresse, les horaires ou le téléphone
//  changent (et idéalement tenus identiques à la Google Business Profile).
// ============================================================================

// Domaine canonique — piloté par NEXT_PUBLIC_SITE_URL (fallback thaifood.fr).
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://thaifood.fr').replace(/\/$/, '');

// Nom, adresse, téléphone (NAP) — doit être strictement identique partout
// (site, footer, mentions légales, Google Business Profile, annuaires).
export const NAP = {
  name: 'Thaï Food 77',
  street: '142 Avenue Charles Rouxel',
  postalCode: '77340',
  city: 'Pontault-Combault',
  region: 'FR-77', // balise geo.region
  state: 'Île-de-France', // addressRegion JSON-LD
  country: 'FR',
  email: 'pad.77thai@gmail.com',
  phone: '01 75 13 61 91',
};

// Coordonnées GPS — ≈ Pontault-Combault. À VÉRIFIER/préciser sur la carte
// pour l'adresse exacte (142 Avenue Charles Rouxel) avant mise en ligne.
export const GEO = { latitude: 48.7914, longitude: 2.6035 };

// Horaires d'ouverture (JSON-LD OpeningHoursSpecification). Tenus en cohérence
// avec DEFAULT_HOURS de lib/site.js.
export const HOURS_SPEC = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '11:30', closes: '14:00' },
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '18:30', closes: '22:00' },
  { days: ['Friday'], opens: '11:30', closes: '14:00' },
  { days: ['Friday'], opens: '18:30', closes: '22:30' },
  { days: ['Saturday'], opens: '18:30', closes: '22:30' },
  { days: ['Sunday'], opens: '12:00', closes: '22:00' },
];

// Réseaux sociaux (sameAs). Remplir quand les profils existent.
export const SOCIALS = {
  instagram: '',
  facebook: '',
  tiktok: '',
  tripadvisor: '',
};

// Cuisines servies (mots-clés forts pour le référencement local).
export const CUISINES = ['Thaïlandaise', 'Fast food'];

export const PRICE_RANGE = '€€';

// URLs pratiques.
export const url = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const ICON_URL = url('/icon.svg');
export const MENU_URL = url('/#commander');

// ----------------------------------------------------------------------------
//  JSON-LD Restaurant / LocalBusiness — données structurées pour Google
//  (rich snippet adresse, horaires, note…). Construit côté serveur et injecté
//  sur la home via components/JsonLdRestaurant.js.
// ----------------------------------------------------------------------------
export function buildRestaurantJsonLd() {
  const sameAs = Object.values(SOCIALS).filter(Boolean);
  const data = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'LocalBusiness'],
    '@id': url('/#restaurant'),
    name: NAP.name,
    legalName: NAP.name,
    description:
      'Restaurant thaï et fast food thaï à Pontault-Combault (77). Cuisine thaïlandaise authentique préparée à la commande : Pad Thaï, currys, Tom Yum, bobuns, woks. Sur place ou à emporter.',
    url: SITE_URL,
    image: [ICON_URL, url('/opengraph-image')],
    logo: ICON_URL,
    hasMenu: MENU_URL,
    servesCuisine: CUISINES,
    priceRange: PRICE_RANGE,
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Carte bancaire, Espèces',
    address: {
      '@type': 'PostalAddress',
      streetAddress: NAP.street,
      postalCode: NAP.postalCode,
      addressLocality: NAP.city,
      addressRegion: NAP.state,
      addressCountry: NAP.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: GEO.latitude, longitude: GEO.longitude },
    openingHoursSpecification: HOURS_SPEC.map((s) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.days,
      opens: s.opens,
      closes: s.closes,
    })),
  };

  // telephone uniquement si renseigné (évite de pousser un faux numéro).
  if (NAP.phone) data.telephone = NAP.phone;
  // email + sameAs uniquement si présents.
  if (NAP.email) data.email = NAP.email;
  if (sameAs.length) data.sameAs = sameAs;

  return data;
}
