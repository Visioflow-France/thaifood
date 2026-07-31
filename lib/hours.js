// ============================================================================
//  LOGIQUE D'OUVERTURE — pure, partagée entre le site public (client) et
//  l'API serveur (pour bloquer les commandes hors horaires).
//
//  Modèle `hours` : { <getDay()>: [{ open: 'HH:MM', close: 'HH:MM' }, ...] }
//  getDay() : 0=dimanche, 1=lundi, … 6=samedi. Tableau vide ou absent = fermé.
//
//  ⏰ FUSEAU HORAIRE : les horaires sont saisis en heure FRANÇAISE. On calcule
//  toujours « maintenant » en Europe/Paris via Intl.DateTimeFormat, ce qui est
//  INDÉPENDANT du fuseau du serveur (UTC sur Vercel) comme du navigateur. Ainsi
//  client et serveur tombent toujours d'accord (le restaurant est à Paris).
// ============================================================================

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// weekday court en-GB -> index getDay() (0=dim … 6=sam).
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

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

// Composantes Paris d'un instant : index de jour (0-6), quantième/mois, minutes
// écoulées depuis minuit. Utilise Intl → insensible au fuseau système.
function parisParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    hourCycle: 'h23',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = WEEKDAY_INDEX[get('weekday')];
  const hour = Number(get('hour')) % 24; // '24' (minuit) -> 0
  const minute = Number(get('minute'));
  return {
    day,
    dom: Number(get('day')),
    month: Number(get('month')),
    minutes: hour * 60 + minute,
  };
}

// Le restaurant est-il ouvert à l'instant `date` (heure de Paris) ?
export function isOpenAt(hours, date = new Date()) {
  const { day, minutes } = parisParts(date);
  const slots = getSlots(hours, day);
  return slots.some((s) => {
    const o = toMin(s?.open);
    const c = toMin(s?.close);
    return o != null && c != null && minutes >= o && minutes < c;
  });
}

export const isOpenNow = isOpenAt;

// Prochaine ouverture après `from` (cherche sur 8 jours, en heure de Paris).
// Renvoie { day, dom, month, hh, mm } ou null.
export function nextOpening(hours, from = new Date()) {
  const now = parisParts(from);
  for (let i = 0; i < 8; i++) {
    const probe = new Date(from.getTime() + i * 86400000);
    const p = parisParts(probe);
    const slots = getSlots(hours, p.day)
      .slice()
      .sort((a, b) => (toMin(a.open) || 0) - (toMin(b.open) || 0));
    for (const s of slots) {
      const o = toMin(s?.open);
      if (o == null) continue;
      if (i === 0 && o <= now.minutes) continue; // créneau déjà passé aujourd'hui
      const [hh, mm] = s.open.split(':');
      return { day: p.day, dom: p.dom, month: p.month, hh, mm };
    }
  }
  return null;
}

// Texte humain : « jeudi 31/07 à 18:30 ».
export function formatNextOpening(hours, from = new Date()) {
  const next = nextOpening(hours, from);
  if (!next) return 'prochainement';
  const p = (n) => String(n).padStart(2, '0');
  return `${DAYS[next.day]} ${p(next.dom)}/${p(next.month)} à ${p(Number(next.hh))}:${p(Number(next.mm))}`;
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
