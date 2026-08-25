import { verifySession } from '../../../../../lib/auth';
import { getDb, IS_FIRESTORE_REST } from '../../../../../lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ============================================================================
//  TEMPS RÉEL DES COMMANDES — Server-Sent Events.
//  UNE seule écoute onSnapshot (côté serveur, SDK Admin) sur la collection
//  'orders' par client admin connecté. Firestore n'est JAMAIS exposé au
//  navigateur (sécurité maximale, PII côté serveur uniquement).
//  Lecture initiale = N commandes, puis seules les commandes modifiées
//  génèrent des lectures (économise le quota Spark vs. un polling complet).
// ============================================================================

export async function GET(req) {
  if (!verifySession(req)) {
    return new Response('Non autorisé.', { status: 401 });
  }
  if (!process.env.FIREBASE_PROJECT_ID) {
    return new Response('Firebase non configuré.', { status: 503 });
  }
  // onSnapshot (watch temps réel) exige gRPC : indisponible sous Cloudflare
  // Workers (mode REST). Le client détecte l'échec et poll /api/admin/orders.
  if (IS_FIRESTORE_REST) {
    return new Response('Temps réel indisponible sur cet hébergement.', { status: 503 });
  }

  const headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // désactive le buffering chez certains proxys
  };

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let sentInit = false;
      let unsub = null;
      const safeEnq = (chunk) => {
        try { controller.enqueue(enc.encode(chunk)); } catch {}
      };
      const send = (event, data) => {
        safeEnq(`event: ${event}\n`);
        safeEnq(`data: ${JSON.stringify(data)}\n\n`);
      };

      send('ping', { at: 'open' });

      try {
        unsub = getDb()
          .collection('orders')
          .orderBy('createdAt', 'desc')
          .limit(100)
          .onSnapshot(
            (snap) => {
              const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              if (!sentInit) {
                sentInit = true;
                send('init', { orders });
              } else {
                const changes = snap.docChanges().map((c) => ({
                  type: c.type, // 'added' | 'modified' | 'removed'
                  order: { id: c.doc.id, ...c.doc.data() },
                }));
                if (changes.length) send('changes', { changes });
              }
            },
            (err) => {
              console.error('[orders/stream] écoute interrompue :', err?.details || err?.message);
              send('fail', { message: err?.details || err?.message || 'écoute interrompue' });
              try { controller.close(); } catch {}
            }
          );
      } catch (e) {
        console.error('[orders/stream] init impossible :', e?.message);
        send('fail', { message: e?.message || 'init impossible' });
        try { controller.close(); } catch {}
      }

      // Déconnexion du client → on libère l'écoute Firestore.
      const cleanup = () => {
        try { unsub && unsub(); } catch {}
        try { controller.close(); } catch {}
      };
      req.signal?.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, { headers });
}
