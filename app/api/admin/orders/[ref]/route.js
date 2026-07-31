import { NextResponse } from 'next/server';
import { verifySession } from '../../../../../lib/auth';
import { updateOrderStatus, markOrderPrinted } from '../../../../../lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Met à jour une commande : changement de statut (status) ou marquage « imprimé ».
// PATCH /api/admin/orders/<ref>  body: { status: '...' } | { action: 'print' }
export async function PATCH(req, { params }) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const ref = params?.ref;
  if (!ref) {
    return NextResponse.json({ error: 'Référence manquante.' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));

  if (body.action === 'print') {
    const order = await markOrderPrinted(ref);
    if (!order) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    return NextResponse.json({ ok: true, order });
  }

  if (typeof body.status === 'string') {
    const order = await updateOrderStatus(ref, body.status);
    if (!order) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    return NextResponse.json({ ok: true, order });
  }

  return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
}
