import { NextResponse } from 'next/server';
import { verifyCredentials, createSessionCookie, isAuthConfigured } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    // Fail-safe : admin désactivé tant que les identifiants ne sont pas
    // configurés (voir lib/auth.js).
    if (!isAuthConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'Administration désactivée : identifiants non configurés sur le serveur.' },
        { status: 503 }
      );
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { ok: false, error: 'Identifiant ou mot de passe incorrect.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(createSessionCookie());
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Erreur serveur lors de la connexion.' },
      { status: 500 }
    );
  }
}
