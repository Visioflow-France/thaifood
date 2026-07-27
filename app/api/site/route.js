import { NextResponse } from 'next/server';
import { verifySession } from '../../../lib/auth';
import { getSiteInfo, saveSiteInfo } from '../../../lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET public : téléphone (bandeau + footer) + mentions légales (page dédiée).
export async function GET() {
  const info = await getSiteInfo();
  return NextResponse.json({ phone: info.phone, legal: info.legal });
}

// POST admin : met à jour le téléphone et/ou les mentions légales.
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const patch = {};
  if (typeof body.phone === 'string') patch.phone = body.phone.slice(0, 40);
  if (typeof body.legal === 'string') patch.legal = body.legal.slice(0, 20000);
  const next = await saveSiteInfo(patch);
  return NextResponse.json({ ok: true, phone: next.phone, legal: next.legal });
}
