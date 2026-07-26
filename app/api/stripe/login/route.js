import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getSettings } from '../../../../lib/settings';
import { getStripe } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST : renvoie un lien vers le tableau de bord Stripe du restaurateur.
// - Express : lien de connexion hébergé par Stripe (createLoginLink).
// - Standard : pas de login link → le restaurateur se connecte sur Stripe
//   directement (on redirige vers dashboard.stripe.com).
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const stripe = getStripe();
  const { connectedAccountId } = await getSettings();
  if (!stripe || !connectedAccountId) {
    return NextResponse.json(
      { error: 'Aucun compte Stripe connecté.' },
      { status: 400 }
    );
  }
  try {
    const link = await stripe.accounts.createLoginLink(connectedAccountId);
    return NextResponse.json({ ok: true, url: link.url });
  } catch (e) {
    // Comptes Standard (ou autre cas non géré) : redirection vers Stripe.
    return NextResponse.json({ ok: true, url: 'https://dashboard.stripe.com/' });
  }
}
