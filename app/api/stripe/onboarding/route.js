import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getSettings, saveSettings } from '../../../../lib/settings';
import { getStripe, hasStripeKey, getRequestOrigin } from '../../../../lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST : crée (si besoin) le compte Stripe Express du restaurateur et renvoie
// une URL d'onboarding (page hébergée par Stripe : KYC, coordonnées bancaires).
// Réutilisable : si le compte existe mais est incomplet, on régénère le lien.
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Clé Stripe plateforme manquante (STRIPE_SECRET_KEY dans .env.local).' },
      { status: 500 }
    );
  }

  const origin = getRequestOrigin(req);

  try {
    let settings = await getSettings();

    // 1) Création du compte Standard (une seule fois).
    //    Standard : c'est le RESTAURATEUR qui porte les pertes (litiges, fraude),
    //    pas la plateforme. Inscription un peu plus complète, mais même commission
    //    et mêmes moyens de paiement (carte, Apple Pay, Google Pay…).
    if (!settings.connectedAccountId) {
      const acct = await stripe.accounts.create({
        type: 'standard',
        country: 'FR',
      });
      settings = await saveSettings({ connectedAccountId: acct.id });
    }

    // 2) Lien d'onboarding Stripe.
    const link = await stripe.accountLinks.create({
      account: settings.connectedAccountId,
      refresh_url: `${origin}/admin`,
      return_url: `${origin}/admin`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ ok: true, url: link.url });
  } catch (e) {
    console.error('[stripe/onboarding] error:', e.message);
    return NextResponse.json(
      { error: e.message || 'Erreur lors de la connexion Stripe.' },
      { status: 500 }
    );
  }
}
