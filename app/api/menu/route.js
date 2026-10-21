import { getMenu } from '../../../lib/store';
import { cachedJson, CACHE_KEYS } from '../../../lib/edge-cache';

export const dynamic = 'force-dynamic';

// Menu public (plats + catégories + promos). Lu par le hook useMenu côté client.
// ⚡ CPU : réponse servie depuis le cache edge du colo (TTL 30 s, la même
// fraîcheur maximale que le cache serveur du menu). Les mutations admin
// invalident la clé (voir lib/store.js :: mutateMenu).
export async function GET() {
  return cachedJson(CACHE_KEYS.menu, () => getMenu(), { ttl: 30 });
}
