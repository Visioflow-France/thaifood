import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getCategories, saveCategory } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  return NextResponse.json({ categories: await getCategories() });
}

export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const category = await req.json().catch(() => null);
    if (!category || typeof category !== 'object') {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }
    const saved = await saveCategory(category);
    return NextResponse.json({ ok: true, category: saved });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
