import { NextResponse } from 'next/server';
import { verifySession } from '../../../../lib/auth';
import { getBucket } from '../../../../lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

// Upload d'une image depuis le dashboard → Firebase Storage (plus de disque
// local, qui ne persiste pas sur Vercel). Renvoie une URL publique utilisable
// directement comme image de plat.
// ⚠️ Nécessite une règle Storage « allow read: if true; » (lecture publique)
//    pour que les images s'affichent sur le site. Voir le README.
export async function POST(req) {
  if (!verifySession(req)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo).' }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json({ error: 'Format non supporté.' }, { status: 400 });
  }

  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  const filename = `up_${stamp}_${rand}.${ext}`;
  const filepath = `menu/${filename}`;

  try {
    const bucket = getBucket();
    await bucket.file(filepath).save(Buffer.from(bytes), {
      metadata: { contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}` },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      filepath
    )}?alt=media`;
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error('[upload] Storage error:', e.message);
    return NextResponse.json({ error: 'Upload impossible.' }, { status: 500 });
  }
}
