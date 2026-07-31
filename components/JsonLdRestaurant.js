import { buildRestaurantJsonLd } from '../lib/seo';

// Données structurées Restaurant / LocalBusiness (schema.org) injectées sur la
// page d'accueil uniquement (voir app/page.js). Server component — le JSON-LD
// est rendu dans le HTML et indexable par Google (rich snippet adresse,
// horaires, note, avis…). Source des données : lib/seo.js.
export default function JsonLdRestaurant() {
  const json = JSON.stringify(buildRestaurantJsonLd());
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
