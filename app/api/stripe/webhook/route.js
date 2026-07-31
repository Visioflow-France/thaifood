import { NextResponse } from 'next/server';
import { getStripe } from '../../../../lib/stripe';
import { getSettings, saveSettings } from '../../../../lib/settings';
import { markOrderPaid, markOrderFailed } from '../../../../lib/orders';

export const runtime = 'nodejs';
// Corps brut obligatoire (vérification de signature Stripe) — jamais de cache.
export const dynamic = 'force-dynamic';

// Webhook Stripe : appelé par Stripe (PAS par le navigateur, PAS derrière l'auth
// admin — la sécurité vient de la signature). Marque les commandes payées /
// échouées et rafraîchit le statut du compte connecté.
export async function POST(req) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    console.error('[stripe/webhook] signature invalide:', e.message);
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (e) {
    // On journalise et on répond 500 : Stripe rejourera l'événement (échec
    // transitoire : quota Firestore, timeout…). Évite de perdre silencieusement
    // le passage à 'paid' — la commande existe déjà (créée avant le paiement).
    console.error('[stripe/webhook] handler error:', event?.type, e.message);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(event) {
  const data = event.data?.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const ref = data?.metadata?.ref;
      if (!ref) break;
      await markOrderPaid(ref, {
        paymentIntentId: data?.payment_intent || null,
        checkoutSessionId: data?.id || null,
        paidAmount: data?.amount_total ?? null,
        feeAmount: data?.total_details?.application_fee?.amount ?? null,
      });
      break;
    }

    case 'payment_intent.succeeded': {
      const ref = data?.metadata?.ref;
      if (!ref) break;
      await markOrderPaid(ref, {
        paymentIntentId: data?.id || null,
        paidAmount: data?.amount ?? null,
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const ref = data?.metadata?.ref;
      if (!ref) break;
      await markOrderFailed(
        ref,
        data?.last_payment_error?.message || 'Paiement refusé.'
      );
      break;
    }

    case 'account.updated': {
      // Statut du compte restaurateur (charges/payouts activés, KYC complété).
      const { connectedAccountId } = await getSettings();
      if (connectedAccountId && data?.id === connectedAccountId) {
        await saveSettings({
          account: {
            chargesEnabled: data?.charges_enabled,
            payoutsEnabled: data?.payouts_enabled,
            detailsSubmitted: data?.details_submitted,
            updatedAt: new Date().toISOString(),
          },
        });
      }
      break;
    }

    default:
      break; // Événement non géré : ignoré.
  }
}
