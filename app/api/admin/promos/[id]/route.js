import { NextResponse } from 'next/server';
import { verifySession } from '../../../../../lib/auth';
import { savePromo, deletePromo } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const promo = await req.json().catch(() => null);
    if (!promo || typeof promo !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    promo.id = id;
    const saved = await savePromo(promo);
    return NextResponse.json({ ok: true, promo: saved });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await deletePromo(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
