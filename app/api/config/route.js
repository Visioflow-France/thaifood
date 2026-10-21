import { isStripeActive } from '../../../lib/orders';
import { cachedJson, CACHE_KEYS } from '../../../lib/edge-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET public : indique si le paiement en ligne (Stripe) est actif.
// Sert au checkout à afficher le bon message (« Paiement sécurisé par Stripe »
// vs « Règlement sur place ») et le bon libellé de bouton.
// ⚡ CPU : réponse en cache edge (TTL 30 s) ; la valeur ne change qu'à la
// connexion/déconnexion du compte Stripe restaurateur (purge à l'écriture,
// voir lib/settings.js :: saveSettings).
export async function GET() {
  return cachedJson(
    CACHE_KEYS.config,
    async () => ({ onlinePayment: await isStripeActive() }),
    { ttl: 30 }
  );
}
