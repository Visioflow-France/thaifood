import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getOrders } from '../../../../lib/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Liste les commandes (les plus récentes en premier) pour le dashboard.
export async function GET(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  return NextResponse.json({ orders: await getOrders() });
}
