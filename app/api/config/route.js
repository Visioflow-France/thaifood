import { NextResponse } from 'next/server';
import { isStripeActive } from '../../../lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET public : indique si le paiement en ligne (Stripe) est actif.
// Sert au checkout à afficher le bon message (« Paiement sécurisé par Stripe »
// vs « Règlement sur place ») et le bon libellé de bouton.
export async function GET() {
  return NextResponse.json({ onlinePayment: await isStripeActive() });
}
