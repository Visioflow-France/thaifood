// Diagnostic paiement : reproduit exactement l'appel de /api/orders pour
// voir l'erreur réelle que la route masque derrière « indisponible ».
// Usage : node scripts/diagnose-stripe.mjs  (depuis thaifood/, avec .env.local)
import { config } from 'dotenv';

config({ path: '.env.local' });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('✗ STRIPE_SECRET_KEY absente du .env.local');
  process.exit(1);
}
const mode = key.startsWith('sk_live') ? 'LIVE' : 'TEST';
console.log(`Clé Stripe présente (${mode}, ${key.slice(0, 12)}…)`);

const Stripe = (await import('stripe')).default;
const stripe = new Stripe(key, { appInfo: { name: 'Thai Food 77 diag' } });

// 1) La clé est-elle valide ? (compte plateforme)
try {
  const acct = await stripe.accounts.retrieve();
  console.log(`✓ Clé valide — compte plateforme ${acct.id} (${acct.country})`);
  console.log(
    `  charges_enabled=${acct.charges_enabled} payouts_enabled=${acct.payouts_enabled}` +
      ` business_profile=${acct.business_profile?.name || '—'}`
  );
} catch (e) {
  console.error(`✗ Clé refusée par Stripe : ${e.message}`);
  process.exit(1);
}

// 2) Le compte restaurateur connecté (Firestore → config/stripe)
let connectedId = null;
try {
  const { getDb } = await import('../lib/firebase-admin.js');
  const snap = await getDb().collection('config').doc('stripe').get();
  const data = snap.exists ? snap.data() : {};
  connectedId = data.connectedAccountId || null;
  if (!connectedId) {
    console.log('⚠ Aucun connectedAccountId dans Firestore → isStripeActive()=false → paiement sur place (pas d\'erreur Stripe).');
  } else {
    console.log(`connectedAccountId Firestore : ${connectedId}`);
    try {
      const acct = await stripe.accounts.retrieve(connectedId);
      console.log(
        `  détails=${acct.details_submitted} charges=${acct.charges_enabled}` +
          ` payouts=${acct.payouts_enabled} requirements=${JSON.stringify(acct.requirements?.currently_due || [])}`
      );
    } catch (e) {
      console.error(`  ✗ Compte connecté injoignable : ${e.message}`);
    }
  }
} catch (e) {
  console.error(`✗ Firestore illisible : ${e?.details || e.message}`);
}

// 3) Reproduire la création de Checkout Session (seulement si compte connecté)
if (connectedId) {
  const fee = Math.round((2500 * Number(process.env.PLATFORM_COMMISSION_PERCENT || 0)) / 100);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      currency: 'eur',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: 2500,
            product_data: { name: 'DIAG commande test' },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: { destination: connectedId },
        metadata: { ref: 'TF-DIAG', id: 'ord_diag' },
      },
      metadata: { ref: 'TF-DIAG', id: 'ord_diag' },
      success_url: 'https://example.com/ok',
      cancel_url: 'https://example.com/ko',
    });
    console.log(`✓ Checkout Session créée : ${session.id} (mode ${session.livemode ? 'live' : 'test'})`);
    await stripe.checkout.sessions.expire(session.id);
    console.log('  (session expirée, rien à payer)');
  } catch (e) {
    console.error(`✗ ÉCHEC création Checkout Session (l'erreur vue par les clients) :`);
    console.error(`  → ${e.type || ''} ${e.message}`);
    if (e.docCode) console.error(`  docCode=${e.docCode}`);
  }
}
