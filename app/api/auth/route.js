import { NextResponse } from 'next/server';
import { readSession, createSessionCookie, SESSION_TTL_MS } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// Indique au dashboard si l'admin est actuellement connecté.
// ⚙️ Renouvellement glissant : si la session valide a passé la moitié de sa
// durée (≈ 6 mois), on re-délivre un cookie neuf d'un an. L'appareil dédié du
// restaurateur reste donc connecté en permanence tant qu'il ouvre le dashboard
// au moins une fois par an — plus jamais de mot de passe à retaper.
export async function GET(req) {
  const session = readSession(req);
  const res = NextResponse.json({ authed: Boolean(session) });
  if (session && session.exp - Date.now() < SESSION_TTL_MS / 2) {
    res.cookies.set(createSessionCookie());
  }
  return res;
}
