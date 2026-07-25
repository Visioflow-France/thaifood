import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getSettings, saveSettings } from '../../../../lib/settings';
import { getStripe, hasStripeKey } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET : état du paiement (clé plateforme configurée ? compte connecté ? prêt à
// encaisser ?). Resynchronise le statut du compte depuis Stripe pour que
// l'admin (le restaurateur) voie la vérité (charges_enabled, payouts_enabled…).
//
// NB : la COMMISSION PLATEFORME n'apparaît pas ici ni dans le dashboard — c'est
// un réglage de la plateforme (PLATFORM_COMMISSION_PERCENT dans .env.local),
// pas du restaurateur.
export async function GET(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const settings = await getSettings();
  const configured = hasStripeKey();
  const stripe = getStripe();

  let account = null;
  if (configured && settings.connectedAccountId && stripe) {
    try {
      const acct = await stripe.accounts.retrieve(settings.connectedAccountId);
      account = {
        id: acct.id,
        chargesEnabled: acct.charges_enabled,
        payoutsEnabled: acct.payouts_enabled,
        detailsSubmitted: acct.details_submitted,
        businessName: acct.business_profile?.name || null,
      };
      await saveSettings({
        account: {
          chargesEnabled: acct.charges_enabled,
          payoutsEnabled: acct.payouts_enabled,
          detailsSubmitted: acct.details_submitted,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('[stripe/account] retrieve error:', e.message);
      account = { id: settings.connectedAccountId, error: 'Compte introuvable.' };
    }
  }

  return NextResponse.json({
    configured,
    connectedAccountId: settings.connectedAccountId,
    account,
    ready: Boolean(
      configured && settings.connectedAccountId && account?.chargesEnabled
    ),
  });
}
