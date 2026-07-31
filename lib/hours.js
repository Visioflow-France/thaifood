// ============================================================================
//  LOGIQUE D'OUVERTURE — pure, partagée entre le site public (client) et
//  l'API serveur (pour bloquer les commandes hors horaires).
//
//  Modèle `hours` : { <getDay()>: [{ open: 'HH:MM', close: 'HH:MM' }, ...] }
//  getDay() : 0=dimanche, 1=lundi, … 6=samedi. Tableau vide ou absent = fermé.
// ============================================================================

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function getSlots(hours, dayIndex) {
  if (!hours) return [];
  return hours[dayIndex] || hours[String(dayIndex)] || [];
}

function toMin(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

// Le restaurant est-il ouvert à l'instant `date` ?
export function isOpenAt(hours, date = new Date()) {
  const slots = getSlots(hours, date.getDay());
  const mins = date.getHours() * 60 + date.getMinutes();
  return slots.some((s) => {
    const o = toMin(s?.open);
    const c = toMin(s?.close);
    return o != null && c != null && mins >= o && mins < c;
  });
}

export const isOpenNow = isOpenAt;

// Prochaine heure d'ouverture après `from` (cherche sur 8 jours).
export function nextOpening(hours, from = new Date()) {
  for (let i = 0; i < 8; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    const slots = getSlots(hours, d.getDay())
      .slice()
      .sort((a, b) => (toMin(a.open) || 0) - (toMin(b.open) || 0));
    for (const s of slots) {
      const o = toMin(s?.open);
      if (o == null) continue;
      const candidate = new Date(d);
      candidate.setHours(Math.floor(o / 60), o % 60, 0, 0);
      if (candidate.getTime() > from.getTime()) return candidate;
    }
  }
  return null;
}

// Texte humain : « jeudi 31/07 à 18:30 ».
export function formatNextOpening(hours, from = new Date()) {
  const d = nextOpening(hours, from);
  if (!d) return 'prochainement';
  const p = (n) => String(n).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${p(d.getDate())}/${p(d.getMonth() + 1)} à ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Résumé lisible d'un jour pour le pied de page : « 11:30 – 14:00 · 18:30 – 22:00 ».
export function daySummary(slots = []) {
  return slots
    .map((s) => {
      const o = s?.open || '';
      const c = s?.close || '';
      if (!o || !c) return '';
      return `${o} – ${c}`;
    })
    .filter(Boolean)
    .join(' · ');
}
