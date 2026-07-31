// Petit helper pour appeler les routes API admin depuis le dashboard.
export async function api(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (res.status === 401) {
    // Session expirée -> on recharge pour revenir à l'écran de connexion.
    if (typeof window !== 'undefined') window.location.reload();
    throw new Error('Session expirée');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Une erreur est survenue');
  return json;
}

// ----------------------------------------------------------------------------
//  Compression côté client → WebP (max 800 px de large, qualité 80 %).
//  Objectif : chaque image < ~150 Ko avant l'envoi (économise Firebase Storage).
//  Si l'image ne peut pas être décodée (ex : HEIC), on renvoie le fichier tel quel.
// ----------------------------------------------------------------------------
async function compressToWebP(file, maxDim = 800, quality = 0.8) {
  if (typeof document === 'undefined' || !file?.type?.startsWith('image/')) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // format non décodable côté navigateur → envoi brut
  }
  try {
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    );
    return blob || file;
  } finally {
    if (bitmap?.close) bitmap.close();
  }
}

// Upload d'une image (compressée en WebP avant envoi). Renvoie l'URL publique.
export async function uploadImage(file) {
  const compressed = await compressToWebP(file);
  const fd = new FormData();
  // On force un nom .webp quand on a compressé (Blob sans nom) pour que le
  // serveur stocke bien au format webp.
  const isCompressedBlob = compressed instanceof Blob && !(compressed instanceof File);
  const filename = isCompressedBlob ? `photo-${Date.now().toString(36)}.webp` : compressed.name;
  fd.append('file', compressed, filename);

  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Échec de l'envoi de l'image");
  return json.url;
}
