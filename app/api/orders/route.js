import { NextResponse } from 'next/server';
import { buildOrder, saveOrder, OrderError, isStripeActive } from '../../../lib/orders';
import { getStripe, getRequestOrigin } from '../../../lib/stripe';
import { getSettings, getCommissionPercent } from '../../../lib/settings';
import { getSiteInfo } from '../../../lib/site';
import { hasFirebaseConfig } from '../../../lib/firebase-admin';
import { isOpenNow, formatNextOpening } from '../../../lib/hours';

export const runtime = 'nodejs';
// Toujours dynamique : on écrit dans un fichier, jamais de cache.
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // Les commandes nécessitent Firestore (pas de fallback, contrairement au
    // menu). Si Firebase n'est pas configuré, on échoue proprement.
    if (!hasFirebaseConfig()) {
      return NextResponse.json(
        { ok: false, error: 'Service de commande indisponible, réessayez.' },
        { status: 503 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const order = await buildOrder(payload);

    // ------------------------------------------------------------------
    //  HORAIRES : on refuse la commande si le restaurant est fermé.
    //  (Le contrôle côté client est une aide visuelle ; ici c'est la vraie
    //  barrière, impossible à contourner depuis le navigateur.)
    // ------------------------------------------------------------------
    const { hours } = await getSiteInfo();
    if (!isOpenNow(hours)) {
      throw new OrderError(
        `Le restaurant est actuellement fermé. Réouverture ${formatNextOpening(hours)}.`
      );
    }

    // ----------------------------------------------------------------------
    //  PAIEMENT EN LIGNE (Stripe Connect Express).
    //  Si Stripe est configuré + un compte restaurateur est connecté :
    //  on crée une Stripe Checkout Session (destination charge vers le compte
    //  du restaurateur + commission plateforme). Le client est ensuite
    //  redirigé vers la page Stripe, puis revient sur /commande?ref=…
    //  Le webhook Stripe confirme le paiement (statut -> 'paid').
    //
    //  Sinon : comportement historique (commande enregistrée « reçue »,
    //  réglée sur place / à la livraison).
    // ----------------------------------------------------------------------
    if (await isStripeActive()) {
      const stripe = getStripe();
      const settings = await getSettings();
      const origin = getRequestOrigin(req);

      const amount = Math.max(50, Math.round(order.total * 100)); // EUR, min Stripe = 0,50€
      const fee = Math.round((amount * getCommissionPercent()) / 100);

      let session;
      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          locale: 'fr',
          currency: 'eur',
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: amount,
                product_data: {
                  name: `Commande ${order.ref}`,
                  description: order.items.map((i) => `${i.qty}× ${i.name}`).join(' · ').slice(0, 200),
                },
              },
            },
          ],
          payment_intent_data: {
            // Destination charge : l'argent part sur le compte du restaurateur,
            // la plateforme prélève sa commission (application_fee_amount).
            application_fee_amount: fee,
            transfer_data: { destination: settings.connectedAccountId },
            metadata: { ref: order.ref, id: order.id },
          },
          metadata: { ref: order.ref, id: order.id },
          customer_email: order.customer.email || undefined,
          success_url: `${origin}/commande?ref=${order.ref}`,
          cancel_url: `${origin}/commande?ref=${order.ref}&status=cancel`,
        });
      } catch (e) {
        console.error('[orders] Stripe session error:', e.message);
        return NextResponse.json(
          { ok: false, error: 'Paiement en ligne indisponible, réessayez.' },
          { status: 502 }
        );
      }

      order.status = 'awaiting_payment';
      order.checkoutSessionId = session.id;
      await saveOrder(order);

      return NextResponse.json({ ok: true, order, checkoutUrl: session.url }, { status: 201 });
    }

    // Mode « paiement sur place » (Stripe désactivé).
    await saveOrder(order);
    return NextResponse.json({ ok: true, order }, { status: 201 });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    console.error('[orders] POST error:', e);
    return NextResponse.json(
      { ok: false, error: 'Une erreur est survenue, réessayez.' },
      { status: 500 }
    );
  }
}
