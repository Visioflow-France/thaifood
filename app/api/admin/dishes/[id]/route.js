import { NextResponse } from 'next/server';
import { verifySession } from '../../../../../lib/auth';
import { saveDish, deleteDish } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const dish = await req.json().catch(() => null);
    if (!dish || typeof dish !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    dish.id = id;
    const saved = await saveDish(dish);
    return NextResponse.json({ ok: true, dish: saved });
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
    await deleteDish(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
