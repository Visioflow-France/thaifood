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
  street: '12 Avenue de la République',
  postalCode: '77340',
  city: 'Pontault-Combault',
  region: 'FR-77', // balise geo.region
  state: 'Île-de-France', // addressRegion JSON-LD
  country: 'FR',
  email: 'contact@thaifood77.fr',
  // téléphone : laissé vide tant que non renseigné. Quand il le sera, ajouter
  // `phone` ici ET `telephone` dans le JSON-LD (lib/seo.js buildRestaurantJsonLd).
  phone: '',
};

// Coordonnées GPS — ≈ centre de Pontault-Combault. À VÉRIFIER sur la carte
// pour l'adresse exacte (12 Avenue de la République) avant mise en ligne.
export const GEO = { latitude: 48.7914, longitude: 2.6035 };

// Note / avis — DOIT être identique au texte visible (Hero + Avis) et au JSON-LD.
// Remplacer par le vrai nombre d'avis Google une fois la fiche créée.
export const RATING = { ratingValue: '4.7', reviewCount: 463 };

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

// Avis représentatifs affichés sur la page d'accueil (components/Avis.js).
// Le texte DOIT être identique entre l'affichage et le JSON-LD.
export const REVIEWS = [
  {
    author: 'Evelina Ganieva',
    ratingValue: '5',
    text: "Petit restaurant sympa tout près de chez moi. J'ai pris des rouleaux pour goûter, c'était frais et très bon, j'ai adoré ❤️. La cheffe était accueillante et bienveillante.",
  },
  {
    author: 'François',
    ratingValue: '5',
    text: 'Une cuisine fantastique et des portions généreuses, préparées à la minute par la cheffe. Mon poke bowl au saumon était tout simplement délicieux !',
  },
  {
    author: 'Bouzid Bouchemla',
    ratingValue: '5',
    text: 'Excellent 👌',
  },
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: RATING.ratingValue,
      reviewCount: RATING.reviewCount,
      bestRating: '5',
      worstRating: '1',
    },
    review: REVIEWS.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: { '@type': 'Rating', ratingValue: r.ratingValue, bestRating: '5' },
      reviewBody: r.text,
    })),
  };

  // telephone uniquement si renseigné (évite de pousser un faux numéro).
  if (NAP.phone) data.telephone = NAP.phone;
  // email + sameAs uniquement si présents.
  if (NAP.email) data.email = NAP.email;
  if (sameAs.length) data.sameAs = sameAs;

  return data;
}
