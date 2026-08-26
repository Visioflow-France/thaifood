import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getPromos, savePromo } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  return NextResponse.json({ promos: await getPromos() });
}

export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const promo = await req.json().catch(() => null);
    if (!promo || typeof promo !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    const saved = await savePromo(promo);
    return NextResponse.json({ ok: true, promo: saved });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
