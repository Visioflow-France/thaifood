import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getDishes, saveDish } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  return NextResponse.json({ dishes: await getDishes() });
}

export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const dish = await req.json().catch(() => null);
    if (!dish || typeof dish !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    const saved = await saveDish(dish);
    return NextResponse.json({ ok: true, dish: saved });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
