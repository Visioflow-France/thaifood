import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    // Vérification des identifiants
    if (username === validUsername && password === validPassword) {
      const res = NextResponse.json({ ok: true });
      
      // Création du cookie de session
      res.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      });

      return res;
    }

    return NextResponse.json(
      { ok: false, error: 'Identifiant ou mot de passe incorrect.' },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'Erreur serveur lors de la connexion.' },
      { status: 500 }
    );
  }
}