import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getSettings } from '../../../../lib/settings';
import { getStripe } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST : renvoie un lien de connexion au tableau de bord Express du restaurateur
// (page hébergée par Stripe : voir les paiements, modifier les coordonnées…).
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
    console.error('[stripe/login] error:', e.message);
    return NextResponse.json(
      { error: e.message || 'Lien de connexion indisponible.' },
      { status: 500 }
    );
  }
}
