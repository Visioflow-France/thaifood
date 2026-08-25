import { verifySession } from '../../../../../lib/auth';
import { getDb } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ============================================================================
//  TEMPS RÉEL DES COMMANDES — Server-Sent Events, par POLLING Firestore.
// ----------------------------------------------------------------------------
//  ⚠️ Cloudflare Workers : Firestore onSnapshot() exige gRPC (http2 + streams
//  Node), interdit sur workerd ("stream.on is not a function"). On garde la
//  MÊME interface SSE (events init/changes/fail) mais on interroge Firestore
//  par requêtes REST simples toutes les POLL_MS. Le dashboard (EventSource)
//  ne change pas d'un iota.
// ============================================================================

const POLL_MS = 5000; // rafraîchissement toutes les 5 s
const MAX_LIFETIME_MS = 240_000; // le client EventSource se reconnecte seul

async function fetchOrders() {
  const snap = await getDb()
    .collection('orders')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function GET(req) {
  if (!verifySession(req)) {
    return new Response('Non autorisé.', { status: 401 });
  }
  if (!process.env.FIREBASE_PROJECT_ID) {
    return new Response('Firebase non configuré.', { status: 503 });
  }

  const headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // désactive le buffering chez certains proxys
  };

  const enc = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let timer = null;
      let lastOrders = null; // précédente liste connue (pour le diff)

      const safeEnq = (chunk) => {
        if (closed) return;
        try { controller.enqueue(enc.encode(chunk)); } catch { closed = true; }
      };
      const send = (event, data) => {
        safeEnq(`event: ${event}\n`);
        safeEnq(`data: ${JSON.stringify(data)}\n\n`);
      };

      const cleanup = () => {
        closed = true;
        if (timer) clearTimeout(timer);
        try { controller.close(); } catch {}
      };

      const diffAgainst = (prev, cur) => {
        const prevMap = new Map((prev || []).map((o) => [o.id, o]));
        const curMap = new Map(cur.map((o) => [o.id, o]));
        const changes = [];
        for (const [id, order] of curMap) {
          const old = prevMap.get(id);
          if (!old) changes.push({ type: 'added', order });
          else if (JSON.stringify(old) !== JSON.stringify(order)) {
            changes.push({ type: 'modified', order });
          }
        }
        for (const id of prevMap.keys()) {
          if (!curMap.has(id)) changes.push({ type: 'removed', order: { id } });
        }
        return changes;
      };

      const tick = async () => {
        if (closed) return;
        try {
          const orders = await fetchOrders();
          if (lastOrders === null) {
            send('init', { orders });
          } else {
            const changes = diffAgainst(lastOrders, orders);
            if (changes.length) send('changes', { changes });
          }
          lastOrders = orders;
        } catch (e) {
          console.error('[orders/stream] lecture impossible :', e?.details || e?.message);
          send('fail', { message: e?.details || e?.message || 'lecture impossible' });
          cleanup();
          return;
        }
        if (Date.now() - startedAt > MAX_LIFETIME_MS) {
          // Fin propre : le navigateur EventSource se reconnecte automatiquement.
          cleanup();
          return;
        }
        timer = setTimeout(tick, POLL_MS);
      };

      send('ping', { at: 'open' });
      req.signal?.addEventListener('abort', cleanup);
      await tick();
    },
  });

  return new Response(stream, { headers });
}
