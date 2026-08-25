import { NextResponse } from 'next/server';
import { verifySession } from '../../../../../lib/auth';
import { saveCategory, deleteCategory } from '../../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const category = await req.json().catch(() => null);
    if (!category || typeof category !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    category.id = id;
    const saved = await saveCategory(category);
    return NextResponse.json({ ok: true, category: saved });
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
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
