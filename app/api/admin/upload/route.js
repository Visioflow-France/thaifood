import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getBucket, hasFirebaseConfig } from '../../../../lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

// Extension -> type MIME canonique (jamais confiance au Content-Type client).
const MIME_BY_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
};

// Détecte le vrai format d'une image depuis ses premiers octets (magic bytes).
// Renvoie une extension normalisée ou null si ce n'est pas une image reconnue.
function detectImageKind(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG : FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'png';
  // GIF : 47 49 46 38 (7a/9a)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 &&
      (buf[4] === 0x37 || buf[4] === 0x39)) return 'gif';
  // WEBP : "RIFF"...."WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'webp';
  // AVIF/HEIC : boîte "ftyp" (octets 4-7) avec brand avif/avis/mif1 (octets 8-11).
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString('latin1');
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') return 'avif';
  }
  return null;
}

// Upload d'une image depuis le dashboard → Firebase Storage (plus de disque
// local, qui ne persiste pas sur Vercel). Renvoie une URL publique utilisable
// directement comme image de plat.
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasFirebaseConfig()) {
    return NextResponse.json(
      { error: "Firebase n'est pas configuré (FIREBASE_PRIVATE_KEY manquant ou invalide) : upload impossible." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData().catch(() => null);
    const file = formData?.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo).' }, { status: 400 });
    }
    const buf = Buffer.from(bytes);

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: 'Format non supporté.' }, { status: 400 });
    }

    // Vrai contrôle du contenu : magic bytes. Bloque un fichier non-image
    // renommé en .png (ex : HTML/JS injection sur l'origine Storage).
    const kind = detectImageKind(buf);
    if (!kind) {
      return NextResponse.json({ error: "Le fichier n'est pas une image valide." }, { status: 400 });
    }

    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 7);
    // On stocke avec l'extension réelle détectée (cohérente avec le contenu).
    const storeExt = kind === 'jpeg' ? 'jpg' : kind;
    const filename = `up_${stamp}_${rand}.${storeExt}`;
    const filepath = `menu/${filename}`;

    const bucket = getBucket();
    await bucket.file(filepath).save(buf, {
      metadata: { contentType: MIME_BY_EXT[storeExt] || `image/${storeExt}` },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      filepath
    )}?alt=media`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error('[upload] Storage error:', e?.message);
    return NextResponse.json({ error: "Échec de l'upload : " + (e?.message || 'erreur inconnue') }, { status: 500 });
  }
}
