import { NextResponse } from 'next/server';
import { verifySession } from '../../../lib/auth';
import { getSiteInfo, saveSiteInfo, buildLegalMarkdown } from '../../../lib/site';
import { cachedJson, CACHE_KEYS } from '../../../lib/edge-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET public : tout ce qui sert au site public (téléphone, mentions légales,
// champs légaux, horaires, réseaux sociaux, contenu éditable de l'accueil).
// ⚡ CPU : réponse en cache edge (TTL 30 s) SAUF pour les sessions admin,
// qui reçoivent toujours l'état réel (lecture Firestore fraîche, le dashboard
// doit voir ses modifications immédiatement).
export async function GET(req) {
  const isAdmin = verifySession(req);
  return cachedJson(
    CACHE_KEYS.site,
    async () => {
      const info = await getSiteInfo(isAdmin); // admin → force la relecture
      return {
        phone: info.phone,
        legal: info.legal,
        legalFields: info.legalFields,
        hours: info.hours,
        socials: info.socials,
        content: info.content,
      };
    },
    { ttl: 30, bypass: isAdmin }
  );
}

// POST admin : met à jour un ou plusieurs champs parmi téléphone, mentions
// légales, champs légaux, horaires, réseaux sociaux, contenu.
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    // Base de fusion lue FRAÎCHE (pas de cache 30 s) : une modification récente
    // faite depuis une autre session/isolate ne doit jamais être écrasée.
    const current = await getSiteInfo(true);

    const patch = {};

    if (typeof body.phone === 'string') patch.phone = body.phone.slice(0, 40);

    if (body.legalFields && typeof body.legalFields === 'object') {
      const next = { ...current.legalFields };
      for (const [k, v] of Object.entries(body.legalFields)) {
        if (typeof v === 'string') next[k] = v.slice(0, 200);
      }
      patch.legalFields = next;
    }

    if (body.regenerate) {
      const fields = patch.legalFields || current.legalFields || {};
      patch.legal = buildLegalMarkdown({ ...fields, phone: patch.phone ?? current.phone });
    } else if (typeof body.legal === 'string') {
      patch.legal = body.legal.slice(0, 30000);
    }

    // Horaires : { <jour>: [{open,close}, ...] }. On borne/normalise les valeurs.
    if (body.hours && typeof body.hours === 'object') {
      const next = {};
      for (const [day, slots] of Object.entries(body.hours)) {
        const arr = Array.isArray(slots) ? slots : [];
        next[day] = arr
          .filter((s) => s && (s.open || s.close))
          .slice(0, 4)
          .map((s) => ({
            open: String(s.open || '').slice(0, 5),
            close: String(s.close || '').slice(0, 5),
          }));
      }
      patch.hours = next;
    }

    // Réseaux sociaux : URLs (chaînes).
    if (body.socials && typeof body.socials === 'object') {
      const next = { ...current.socials };
      for (const [k, v] of Object.entries(body.socials)) {
        if (typeof v === 'string') next[k] = v.slice(0, 300);
      }
      patch.socials = next;
    }

    // Contenu éditable de l'accueil.
    if (body.content && typeof body.content === 'object') {
      const next = { ...current.content };
      for (const [k, v] of Object.entries(body.content)) {
        if (k === 'histoireImages' && Array.isArray(v)) {
          next.histoireImages = v.slice(0, 6).map((x) => String(x || '').slice(0, 500));
        } else if (typeof v === 'string') {
          next[k] = v.slice(0, 1000);
        }
      }
      patch.content = next;
    }

    const next = await saveSiteInfo(patch);
    return NextResponse.json({
      ok: true,
      phone: next.phone,
      legal: next.legal,
      legalFields: next.legalFields,
      hours: next.hours,
      socials: next.socials,
      content: next.content,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur.' }, { status: 500 });
  }
}
