import { NextResponse } from 'next/server';
import { verifyCredentials, createSessionCookie } from '../../../lib/auth';
import {
  getClientIp,
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
} from '../../../lib/rateLimit';

export async function POST(req) {
  const ip = getClientIp(req);

  // Anti force-brute : bloque l'IP au-delà de 5 tentatives / 15 min.
  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return NextResponse.json(
      { ok: false, error: `Trop de tentatives. Réessayez dans ${mins} min.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    );
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide.' }, { status: 400 });
  }

  const { username, password } = body;
  if (!verifyCredentials(username, password)) {
    const { locked, retryAfterSec } = await recordFailedAttempt(ip);
    if (locked) {
      const mins = Math.ceil(retryAfterSec / 60);
      return NextResponse.json(
        { ok: false, error: `Trop de tentatives échouées. Compte bloqué ${mins} min.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }
    return NextResponse.json(
      { ok: false, error: 'Identifiant ou mot de passe incorrect.' },
      { status: 401 }
    );
  }

  // Succès : on oublie les tentatives échouées de cette IP.
  await clearAttempts(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(createSessionCookie());
  return res;
}
