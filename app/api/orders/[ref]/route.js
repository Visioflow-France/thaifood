import { NextResponse } from 'next/server';
import { getOrderByRef, recoverOrderIfNeeded } from '../../../../lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Suivi public de commande par référence (page /commande après paiement Stripe).
// ⚠️ Route SANS auth : on n'expose JAMAIS les données client (RGPD). Seuls les
// champs nécessaires au suivi (statut, récap, totaux) sont renvoyés. Les PII
// (nom, téléphone, e-mail, adresse) et les détails de paiement restent
// strictement côté serveur / dashboard authentifié.
export async function GET(_req, { params }) {
  try {
    const { ref } = await params;
    if (!ref) {
      return NextResponse.json(
        { ok: false, error: 'Référence manquante.' },
        { status: 400 }
      );
    }
    let order = await getOrderByRef(ref);
    // Filet de sécurité : la page /commande est ouverte juste APRÈS le paiement.
    // Si le webhook Stripe n'est pas encore arrivé (ou a été perdu), on vérifie
    // directement auprès de Stripe → le client voit « payé » sans attendre.
    order = (await recoverOrderIfNeeded(order)) || order;
    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'Commande introuvable.' },
        { status: 404 }
      );
    }
    const { customer, payment, failureReason, ...publicView } = order;
    return NextResponse.json({ ok: true, order: publicView });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Erreur serveur.' },
      { status: 500 }
    );
  }
}
