'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { Btn, Card, Select } from './ui';
import { formatPrice } from '../../lib/pricing';

// ============================================================================
//  Onglet « Commandes » du dashboard — réceptionne les commandes en temps réel
//  (polling de /api/admin/orders) et imprime automatiquement un ticket de
//  cuisine bien formaté dès qu'une nouvelle commande arrive.
// ----------------------------------------------------------------------------
//  Impression : un navigateur ne peut pas imprimer « en silence » (sans la
//  fenêtre d'impression du système). On ouvre donc le ticket dans une iframe
//  masquée et on déclenche print() : l'opérateur n'a qu'à valider (ou régler
//  l'imprimante thermique en « imprimante par défaut » pour aller plus vite).
// ============================================================================

const FALLBACK_POLL_MS = 10000; // synchronisation des commandes (toutes les 10 s)
const PRINTED_KEY = 'tf77_printed_orders';
const SEED_KEY = 'tf77_printed_seeded';
const AUTOPRINT_KEY = 'tf77_autoprint';
const SOUND_KEY = 'tf77_order_sound';
const RECENT_MS = 15 * 60 * 1000; // fenêtre « commande récente » au 1er chargement

// Statuts affichables (libellé + couleur). L'ordre = flux logique.
const STATUS = {
  awaiting_payment: { label: 'Paiement en attente', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30' },
  received: { label: 'Nouvelle', cls: 'bg-gold-400/15 text-gold-300 border-gold-400/40' },
  paid: { label: 'Payée', cls: 'bg-green-500/15 text-green-300 border-green-400/30' },
  confirmed: { label: 'Confirmée', cls: 'bg-sky-500/15 text-sky-300 border-sky-400/30' },
  preparing: { label: 'En préparation', cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' },
  ready: { label: 'Prête', cls: 'bg-teal-500/15 text-teal-300 border-teal-400/30' },
  fulfilled: { label: 'Terminée', cls: 'bg-white/[0.06] text-cream-50/55 border-white/15' },
  failed: { label: 'Échec paiement', cls: 'bg-red-500/15 text-red-300 border-red-400/30' },
  cancelled: { label: 'Annulée', cls: 'bg-red-500/15 text-red-300 border-red-400/30' },
};

// Une commande déclenche l'alerte (impression auto + bip + compteur) dès qu'elle
// est effective : en mode paiement sur place (statut 'received') comme en
// paiement en ligne (statut 'paid' posé par le webhook Stripe). Les commandes
// 'awaiting_payment' restent visibles mais grisées (paiement non finalisé).
const AUTO_PRINT_STATUSES = ['received', 'paid'];

const STATUS_OPTIONS = [
  'received', 'awaiting_payment', 'paid', 'failed',
  'confirmed', 'preparing', 'ready', 'fulfilled', 'cancelled',
];

// Libellé lisible d'une commande : numéro du jour (« Commande n°3 ») si
// disponible, sinon repli sur la référence TF-XXXXXX (anciennes commandes).
function orderLabel(o) {
  if (o && Number.isFinite(o.dailySeq)) return `Commande n°${o.dailySeq}`;
  return (o && o.ref) || 'Commande';
}

// --- Outils -----------------------------------------------------------------

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return formatDateTime(iso);
}

// --- Services (midi / soir) --------------------------------------------------
// Créneaux du restaurant en heure de Paris. Le filtre « service » n'affiche que
// les commandes du service en cours (ou du prochain service hors créneau) : la
// sélection suit l'horaire automatiquement, sans intervention de l'opérateur.

const TZ = 'Europe/Paris';
const SERVICES = [
  { id: 'midi', start: 12 * 60, end: 15 * 60 }, // 12h00 → 15h00
  { id: 'soir', start: 18 * 60 + 30, end: 23 * 60 }, // 18h30 → 23h00
];

// Date/heure Paris d'un instant : { day: 'YYYY-MM-DD', minutes: minutes depuis minuit }.
function parisParts(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = d
    .toLocaleString('sv-SE', { timeZone: TZ, hour12: false })
    .match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})/);
  if (!m) return null;
  return { day: m[1], minutes: (Number(m[2]) % 24) * 60 + Number(m[3]) };
}

// 720 → « 12h », 1110 → « 18h30 » (libellé compact des créneaux).
const hm = (min) => `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`;

// Service à afficher selon l'heure courante : le service en cours, sinon le
// prochain (avant 12h → midi du jour ; à partir de 15h → soir du jour, y
// compris après la fermeture pour garder la main sur les commandes du soir).
function serviceFor(iso) {
  const now = parisParts(iso) || { day: '', minutes: 0 };
  const active = now.minutes < SERVICES[0].end ? SERVICES[0] : SERVICES[1];
  return { ...active, day: now.day, label: `Service ${active.id} · ${hm(active.start)}–${hm(active.end)}` };
}

// Une commande appartient au service si sa date (prévue si renseignée, sinon
// création) tombe dans le créneau du même jour.
function inService(o, svc) {
  const t = parisParts(o.scheduledFor || o.createdAt);
  return !!t && t.day === svc.day && t.minutes >= svc.start && t.minutes < svc.end;
}

// --- Impression du ticket ---------------------------------------------------
// Construit un ticket 80 mm (police monospace, largeur ~ 42 caractères).

const W = 42; // largeur utile en caractères

const center = (s) => {
  s = String(s);
  if (s.length >= W) return s.slice(0, W);
  const pad = Math.floor((W - s.length) / 2);
  return ' '.repeat(pad) + s;
};
const padR = (s, n) => {
  s = String(s);
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
};
const padL = (s, n) => {
  s = String(s);
  return s.length >= n ? s.slice(s.length - n) : ' '.repeat(n - s.length) + s;
};
const DASH = '-'.repeat(W);

function buildTicket(order, site) {
  const f = site?.legalFields || {};
  const name = f.companyName || 'Thaï Food 77';
  const addr = [f.streetAddress, [f.postalCode, f.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const phone = site?.phone || f.phone || '';

  const lines = [];
  // --- En-tête : identité de l'établissement (mentions d'un ticket de caisse) ---
  lines.push(center(name));
  if (f.legalForm) lines.push(center(f.legalForm));
  if (addr) lines.push(center(addr));
  if (phone) lines.push(center(`Tél. ${phone}`));
  if (f.siret) lines.push(center(`SIRET : ${f.siret}`));
  if (f.tvaIntracom) lines.push(center(`TVA : ${f.tvaIntracom}`));
  lines.push('='.repeat(W));
  lines.push(center('TICKET DE COMMANDE'));
  lines.push(center(order.type === 'delivery' ? '>>>> LIVRAISON <<<<' : '>> RETrait SUR PLACE <<'));
  lines.push('='.repeat(W));
  lines.push(`${orderLabel(order)}   ${formatDateTime(order.createdAt)}`);
  if (order.ref && Number.isFinite(order.dailySeq)) lines.push(`Réf : ${order.ref}`);
  lines.push(`Mode : ${order.type === 'delivery' ? 'LIVRAISON' : 'RETRAIT SUR PLACE'}`);
  if (order.scheduledFor) lines.push(`Pour : ${formatDateTime(order.scheduledFor)}`);
  lines.push(DASH);

  for (const it of order.items || []) {
    const qty = `${it.qty}x`;
    const amt = formatPrice((it.price || 0) * it.qty);
    // ligne prix alignée à droite
    const left = `${padR(qty, 4)} ${it.name}`.slice(0, W - amt.length - 1);
    lines.push(`${left} ${padL(amt, amt.length)}`);
  }
  lines.push(DASH);
  lines.push(`${padR('Sous-total', W - 10)}${padL(formatPrice(order.subtotal), 10)}`);
  if (order.type === 'delivery') {
    lines.push(`${padR('Livraison', W - 10)}${padL(order.deliveryFee === 0 ? 'Offerte' : formatPrice(order.deliveryFee), 10)}`);
  }
  lines.push(`${padR('TOTAL', W - 10)}${padL(formatPrice(order.total), 10)}`);
  const paid = order.status === 'paid' || !!order.payment;
  lines.push(`${padR('Règlement', W - 10)}${padL(paid ? 'PAYE EN LIGNE' : 'A REGLER', 10)}`);
  lines.push('='.repeat(W));

  const c = order.customer || {};
  lines.push(center('CLIENT'));
  lines.push(`${c.firstName || ''} ${c.lastName || ''}`.trim());
  if (c.phone) lines.push(`Tél : ${c.phone}`);
  if (c.email) lines.push(c.email);
  if (order.type === 'delivery' && c.address) {
    lines.push(`Livraison : ${c.address}`);
    if (c.postalCode || c.city) lines.push(`           ${c.postalCode || ''} ${c.city || ''}`.trim());
    // Détails d'accès facultatifs (uniquement s'ils sont renseignés).
    const access = [
      c.building && `Bat ${c.building}`,
      c.door && `Porte ${c.door}`,
      c.floor && `Etage ${c.floor}`,
      c.intercom && `Int ${c.intercom}`,
      c.accessCode && `Code ${c.accessCode}`,
    ].filter(Boolean);
    if (access.length) lines.push(access.join(' · '));
  }
  if (c.notes) {
    lines.push('');
    lines.push(center('NOTE CLIENT'));
    lines.push(c.notes);
  }
  lines.push('='.repeat(W));
  lines.push(center('Merci de votre confiance !'));
  lines.push(center('À très bientôt'));

  return lines.map((l) => escapeHtml(l)).join('<br>');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Envoie un (ou plusieurs) ticket(s) à RawBT via le schéma rawbt:.
// ⚠️ Chrome n'autorise ce protocole que sur un GESTE UTILISATEUR (clic) —
// une navigation programmatique (polling/SSE) est bloquée avec l'erreur
// « Not allowed to launch custom protocol because a user gesture is required ».
// On tente quand même l'auto (certains kiosques/WebView l'autorisent) et on
// propose un bouton de secours (voir printPendingRef) si elle est bloquée.
//
// Plusieurs commandes = UN SEUL envoi : chaque window.location.href écrase le
// précédent, donc on concatène les tickets avec une séparation claire.
function printTicket(orderOrOrders, site) {
  if (typeof window === 'undefined' || !orderOrOrders) return;
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders.filter(Boolean) : [orderOrOrders];
  if (orders.length === 0) return;

  const SEP = '\n\n' + '='.repeat(W) + '\n\n';
  const allText = orders
    .map((order) => {
      // On récupère le contenu généré par le modèle de ticket
      const ticketContent = buildTicket(order, site);

      // Nettoyage rapide du HTML pour garder du texte propre pour RawBT
      return ticketContent
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
    })
    .join(SEP);

  // Envoi direct à RawBT (une seule navigation pour tout le lot).
  window.location.href = `rawbt:${encodeURIComponent(allText || `Commande #${orders.map((o) => o.ref || o.id).join(', ')}`)}`;
}

// Marque une commande « imprimée » côté serveur (fire-and-forget, idempotent).
function markPrintedServer(ref) {
  try {
    fetch(`/api/admin/orders/${encodeURIComponent(ref)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'print' }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

// Commande factice pour tester l'impression depuis le dashboard.
function sampleOrder() {
  return {
    ref: 'TF-TEST0',
    dailySeq: 1,
    createdAt: new Date().toISOString(),
    type: 'delivery',
    status: 'paid',
    items: [
      { name: 'Pad Thaï', price: 12.9, qty: 2 },
      { name: 'Tom Kha Poulet', price: 11.5, qty: 1 },
    ],
    subtotal: 37.3,
    deliveryFee: 0,
    total: 37.3,
    customer: {
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      email: 'jean.dupont@email.fr',
      address: '12 rue des Lilas',
      postalCode: '77000',
      city: 'Melun',
      building: 'B',
      door: '17',
      floor: '3',
      intercom: 'Dupont',
      accessCode: '1234A',
      notes: 'Sans piment — test d’impression.',
    },
  };
}

// Débloque (resume) le contexte audio après une interaction utilisateur.
function unlockAudio() {
  try {
    _audio = _audio || new (window.AudioContext || window.webkitAudioContext)();
    if (_audio.state === 'suspended') _audio.resume();
  } catch {
    /* audio indisponible : on ignore */
  }
}

// Sonnerie type TÉLÉPHONE FIXE (WebAudio) : « dring-dring » métallique avec
// trille rapide (le marteau frappe alternativement deux cloches), dans le
// médium — perçant sans être aigu. Silencieuse si le contexte audio est
// verrouillé (déverrouillage au 1er clic, unlockAudio).
//
// Timbre : deux ondes carrées désaccordées (640/830 Hz) modulées en amplitude
// à 20 Hz (trille du marteau) + compresseur de sortie pour protéger contre la
// saturation si deux sonneries se chevauchent (2 commandes d'un coup).
let _audio;
let _master;
function chimeVolume() {
  try {
    return Number(localStorage.getItem('tf77_chime_vol')) || 0.75;
  } catch {
    return 0.75;
  }
}
// Une sonnerie « dring » de `dur` secondes démarrée à l'instant absolu t0.
function ringSegment(t0, dur, vol) {
  // Deux cloches légèrement désaccordées → timbre métallique de sonnerie.
  const o1 = _audio.createOscillator();
  const o2 = _audio.createOscillator();
  o1.type = 'square';
  o2.type = 'square';
  o1.frequency.value = 640; // cloche grave
  o2.frequency.value = 830; // cloche aiguë (médium, pas stridente)

  // Trille à 20 Hz : gain oscillant 0 → 0.5, comme le marteau alterné.
  const trem = _audio.createGain();
  trem.gain.value = 0.25;
  const lfo = _audio.createOscillator();
  lfo.frequency.value = 20;
  const depth = _audio.createGain();
  depth.gain.value = 0.25;
  lfo.connect(depth);
  depth.connect(trem.gain);

  // Enveloppe : attaque et extinction courtes (pas de claquement).
  const env = _audio.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  env.gain.setValueAtTime(vol, t0 + dur - 0.04);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  o1.connect(trem);
  o2.connect(trem);
  trem.connect(env);
  env.connect(_master);

  const tEnd = t0 + dur + 0.02;
  o1.start(t0); o1.stop(tEnd);
  o2.start(t0); o2.stop(tEnd);
  lfo.start(t0); lfo.stop(tEnd);
}
function playChime() {
  try {
    _audio = _audio || new (window.AudioContext || window.webkitAudioContext)();
    if (_audio.state === 'suspended') _audio.resume();
    // Chaîne maître (créée une fois) : compresseur → sortie. Il plafonne le
    // niveau quand plusieurs sonneries se superposent (pas de clipping).
    if (!_master) {
      const comp = _audio.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 6;
      comp.connect(_audio.destination);
      _master = _audio.createGain();
      _master.connect(comp);
    }
    const vol = chimeVolume();
    // Cadence téléphone : « dring —— dring » (deux sonneries, court silence).
    const t = _audio.currentTime;
    ringSegment(t + 0.0, 0.9, vol);
    ringSegment(t + 1.25, 0.9, vol);
  } catch {
    /* audio indisponible : on ignore */
  }
}

// --- Composant --------------------------------------------------------------

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [range, setRange] = useState('all'); // 'all' | 'today' | '7d' | 'service'
  const [toast, setToast] = useState(''); // "Nouvelle commande TF-XXXX"
  const [err, setErr] = useState('');
  const [info, setInfo] = useState(''); // bandeau informatif (mode polling = normal)
  const printedRef = useRef(new Set());
  const seededRef = useRef(false);
  // Tickets en attente d'impression : remplis par l'auto (si Chrome la bloque),
  // vidés par le clic sur le bouton de la bannière (gesture valide l'impression).
  const [pendingPrint, setPendingPrint] = useState([]);
  // Refs pour éviter les closures périmées dans les callbacks temps réel (SSE).
  const autoPrintRef = useRef(autoPrint);
  const soundRef = useRef(soundOn);
  const siteRef = useRef(site);
  useEffect(() => { autoPrintRef.current = autoPrint; }, [autoPrint]);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => { siteRef.current = site; }, [site]);

  // Charge les infos du site (pour l'en-tête du ticket) + préférence d'impression.
  useEffect(() => {
    fetch('/api/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setSite({ phone: j.phone, legalFields: j.legalFields }))
      .catch(() => {});

    try {
      const seeded = localStorage.getItem(SEED_KEY);
      seededRef.current = !!seeded;
      if (seeded) {
        printedRef.current = new Set(JSON.parse(localStorage.getItem(PRINTED_KEY) || '[]'));
      }
      const ap = localStorage.getItem(AUTOPRINT_KEY);
      if (ap !== null) setAutoPrint(ap === '1');
      const sd = localStorage.getItem(SOUND_KEY);
      if (sd !== null) setSoundOn(sd === '1');
    } catch {
      /* localStorage indisponible */
    }
  }, []);

  function persist() {
    try {
      localStorage.setItem(PRINTED_KEY, JSON.stringify([...printedRef.current]));
    } catch {}
  }

  // Imprime un lot de nouvelles commandes + notifie (sonnerie + bandeau).
  // Le son est indépendant de l'impression : il joue dès que soundRef est actif.
  // Impression : on tente l'auto (peut être bloquée par Chrome sans gesture) ;
  // dans ce cas les tickets restent dans pendingPrint → bannière avec bouton.
  const printAndNotify = useCallback((batch) => {
    batch.forEach((o) => printedRef.current.add(o.ref));
    persist();
    if (soundRef.current) playChime();
    if (autoPrintRef.current) {
      printTicket(batch, siteRef.current); // tentative auto (une seule navigation)
      // On suppose l'impression partie ; si Chrome l'a bloquée, l'opérateur
      // utilise « Ticket » sur la carte ou la bannière ci-dessous.
    }
    batch.forEach((o) => markPrintedServer(o.ref));
    setToast(`Nouvelle commande : ${batch.map(orderLabel).join(', ')}`);
    setTimeout(() => setToast(''), 8000);
    // Statut partagé par la bannière « À imprimer » (secours anti-blocage Chrome).
    setPendingPrint((prev) => [...prev, ...batch.filter((o) => !prev.some((p) => p.ref === o.ref))]);
  }, []);

  // Ingestion d'une liste complète (init SSE ou refresh manuel).
  const ingest = useCallback(
    (list) => {
      setOrders(list);
      // Au 1er chargement, on marque l'historique comme imprimé SAUF les
      // commandes récentes (< 15 min) payées et non imprimées.
      if (!seededRef.current) {
        seededRef.current = true;
        try { localStorage.setItem(SEED_KEY, '1'); } catch {}
        list.forEach((o) => {
          const isRecent =
            AUTO_PRINT_STATUSES.includes(o.status) &&
            !o.printedAt &&
            o.createdAt &&
            Date.now() - new Date(o.createdAt).getTime() < RECENT_MS;
          if (!isRecent) printedRef.current.add(o.ref);
        });
        persist();
        const recent = list.filter(
          (o) => AUTO_PRINT_STATUSES.includes(o.status) && !printedRef.current.has(o.ref)
        );
        if (recent.length) printAndNotify(recent);
        return;
      }
      const fresh = list.filter(
        (o) =>
          AUTO_PRINT_STATUSES.includes(o.status) &&
          !o.printedAt &&
          !printedRef.current.has(o.ref)
      );
      if (fresh.length) printAndNotify(fresh);
    },
    [printAndNotify]
  );

  const refresh = useCallback(async () => {
    try {
      const j = await api('/api/admin/orders');
      ingest(j.orders || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [ingest]);

  // Synchronisation des commandes. Sous Cloudflare Workers le flux SSE n'est
  // pas disponible (Firestore gRPC impossible sur workerd) : on interroge
  // directement /api/admin/orders toutes les FALLBACK_POLL_MS. Sur un
  // hébergement Node classique (dev local), le SSE est essayé d'abord.
  useEffect(() => {
    let es;
    let pollId;
    let closed = false;

    const startFallback = () => {
      if (pollId) return;
      // Message informatif (pas une alerte rouge) : le polling est le
      // fonctionnement NORMAL sous Cloudflare Workers.
      setInfo(`Synchronisation automatique toutes les ${FALLBACK_POLL_MS / 1000} s.`);
      refresh();
      pollId = setInterval(refresh, FALLBACK_POLL_MS);
    };

    // En prod (Cloudflare), la route stream répond 503 en mode REST : on
    // détecte ce cas AVANT d'ouvrir l'EventSource pour éviter une erreur
    // réseau dans la console.
    let streamAvailable = true;
    fetch('/api/admin/orders/stream', { cache: 'no-store' })
      .then((r) => {
        if (r.status === 503) {
          streamAvailable = false;
          startFallback();
        }
      })
      .catch(() => {
        streamAvailable = false;
        startFallback();
      });

    if (streamAvailable && typeof window !== 'undefined' && 'EventSource' in window) {
      es = new EventSource('/api/admin/orders/stream');
      es.addEventListener('open', () => setErr(''));
      es.addEventListener('init', (ev) => {
        setLoading(false);
        try { ingest((JSON.parse(ev.data).orders) || []); } catch {}
      });
      es.addEventListener('changes', (ev) => {
        try {
          const { changes = [] } = JSON.parse(ev.data);
          setOrders((prev) => {
            let next = [...prev];
            for (const ch of changes) {
              const o = ch.order;
              if (!o) continue;
              if (ch.type === 'removed') next = next.filter((x) => x.ref !== o.ref);
              else {
                const i = next.findIndex((x) => x.ref === o.ref);
                if (i >= 0) next[i] = o; else next.unshift(o);
              }
            }
            next.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            return next;
          });
          // Impression auto + sonnerie sur ajout/modification d'une commande effective.
          const toPrint = changes
            .filter(
              (ch) =>
                ch.order &&
                (ch.type === 'added' || ch.type === 'modified') &&
                AUTO_PRINT_STATUSES.includes(ch.order.status) &&
                !ch.order.printedAt &&
                !printedRef.current.has(ch.order.ref)
            )
            .map((ch) => ch.order);
          if (toPrint.length) printAndNotify(toPrint);
        } catch {}
      });
      es.onerror = () => {
        if (closed) return;
        try { es.close(); } catch {}
        startFallback();
      };
    } else {
      startFallback();
    }

    return () => {
      closed = true;
      try { es && es.close(); } catch {}
      if (pollId) clearInterval(pollId);
    };
  }, [ingest, refresh, printAndNotify]);

  // Pré-charge (resume) le contexte audio au premier clic (débloque le bip).
  useEffect(() => {
    const unlock = () => { unlockAudio(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  function toggleAutoPrint(v) {
    setAutoPrint(v);
    try { localStorage.setItem(AUTOPRINT_KEY, v ? '1' : '0'); } catch {}
  }

  function toggleSound(v) {
    setSoundOn(v);
    try { localStorage.setItem(SOUND_KEY, v ? '1' : '0'); } catch {}
    // Feedback immédiat : on entend le son qu'on vient d'activer.
    if (v) playChime();
  }

  async function changeStatus(order, status) {
    try {
      await api(`/api/admin/orders/${encodeURIComponent(order.ref)}`, 'PATCH', { status });
      setOrders((prev) => prev.map((o) => (o.ref === order.ref ? { ...o, status } : o)));
    } catch (e) {
      // Bandeau d'erreur non bloquant : le statut reste modifiable.
      setErr(`Statut de ${order.ref} non modifié : ${e.message}`);
      setTimeout(() => setErr(''), 6000);
    }
  }

  function reprint(order) {
    printTicket(order, site);
  }

 function testPrint() {
  // Joue aussi la sonnerie pour tester son + impression d'un coup.
  // Appelé depuis un clic = geste utilisateur → le schéma rawbt: passe toujours.
  playChime();
  printTicket(sampleOrder(), site);
}

  // Filtre d'historique par plage de dates.
  function inRange(o) {
    if (range === 'all' || range === 'service') return true; // 'service' → filtré par inService
    const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
    if (!t) return false;
    if (range === 'today') {
      const d = new Date();
      return t >= new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }
    return Date.now() - t < 7 * 86400000; // '7d'
  }

  // Service courant (12h–15h ou 18h30–23h, heure de Paris) : recalculé à
  // chaque rendu pour suivre l'horaire sans avoir à recharger la page.
  const service = useMemo(() => serviceFor(new Date().toISOString()), [orders]);

  // Les livraisons non payées (awaiting_payment) ou en échec (failed) ne sont
  // pas affichées : une livraison n'apparaît que lorsqu'elle est effectivement
  // payée. Les documents restent en base (retour client sur la page /commande).
  const HIDDEN_STATUSES = new Set(['awaiting_payment', 'failed']);
  const shown = orders.filter(
    (o) =>
      (range !== 'service' || inService(o, service)) &&
      inRange(o) &&
      !HIDDEN_STATUSES.has(o.status)
  );
  const newCount = orders.filter(
    (o) => AUTO_PRINT_STATUSES.includes(o.status) && !o.printedAt
  ).length;

  return (
    <div>
      {/* En-tête : compteur + impression auto + rafraîchir */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center">
            <iconify-icon icon="solar:clipboard-list-linear" className="text-xl text-gold-400" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-cream-50">Commandes en direct</h2>
            <p className="text-xs text-cream-50/45">
              {newCount > 0 ? (
                <span className="text-gold-300">{newCount} nouvelle(s) à traiter</span>
              ) : (
                'Aucune nouvelle commande'
              )}
              {' · '}temps réel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-cream-50/70 cursor-pointer select-none bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => toggleSound(e.target.checked)}
              className="accent-[#c9a96e]"
            />
            <iconify-icon icon="solar:speaker-linear" className="text-sm text-gold-400" />
            Son commande
          </label>
          <label className="flex items-center gap-2 text-xs text-cream-50/70 cursor-pointer select-none bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => toggleAutoPrint(e.target.checked)}
              className="accent-[#c9a96e]"
            />
            <iconify-icon icon="solar:printer-linear" className="text-sm text-gold-400" />
            Impression auto
          </label>
          <Btn variant="ghost" onClick={testPrint} title="Imprime un ticket d’exemple pour vérifier l’imprimante">
            <span className="inline-flex items-center gap-1.5">
              <iconify-icon icon="solar:printer-linear" className="text-sm" />
              Tester l’impression
            </span>
          </Btn>
          <Btn variant="ghost" onClick={refresh}>
            <span className="inline-flex items-center gap-1.5">
              <iconify-icon icon="solar:refresh-circle-linear" className="text-sm" />
              Actualiser
            </span>
          </Btn>
        </div>
      </div>

      {/* Filtres d'historique */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[
          { id: 'service', label: 'Service', title: `Uniquement les commandes du service courant (${service.label})` },
          { id: 'today', label: "Aujourd’hui" },
          { id: '7d', label: '7 derniers jours' },
          { id: 'all', label: 'Tout l’historique' },
        ].map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            title={r.title}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              range === r.id
                ? 'bg-gold-400 text-th-950 border-gold-400'
                : 'bg-white/[0.03] text-cream-50/60 border-white/[0.08] hover:text-cream-50'
            }`}
          >
            {r.label}
          </button>
        ))}
        <span className="text-xs text-cream-50/40 ml-1">{shown.length} commande(s)</span>
      </div>

      {/* Tickets bloqués par Chrome (pas de geste utilisateur) : bannière de
          secours. UN clic = impression garantie (gesture valide le rawbt:). */}
      {pendingPrint.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-amber-200 bg-amber-400/10 border border-amber-400/40 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            <iconify-icon icon="solar:printer-linear" className="text-base text-amber-300 animate-pulse" />
            <span>
              {pendingPrint.length} ticket(s) prêt(s) — cliquez pour lancer l&apos;impression&nbsp;:
              {' '}{pendingPrint.map(orderLabel).join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                printTicket(pendingPrint, site);
                setPendingPrint([]);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400 text-th-950 hover:bg-amber-300 transition-colors"
            >
              🖨 Imprimer maintenant
            </button>
            <button
              onClick={() => setPendingPrint([])}
              className="px-2 py-1.5 text-xs text-amber-200/70 hover:text-amber-200"
              title="Masquer sans imprimer (les cartes gardent le bouton Ticket)"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gold-200 bg-gold-400/10 border border-gold-400/30 rounded-lg px-3 py-2">
          <iconify-icon icon="solar:bell-bing-linear" className="text-base text-gold-400" />
          {toast}
        </div>
      )}
      {info && !err && (
        <div className="mb-4 text-[12px] text-cream-50/50 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 flex items-center gap-2">
          <iconify-icon icon="solar:refresh-linear" className="text-base text-gold-400/70" />
          {info}
        </div>
      )}
      {err && (
        <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <p className="text-cream-50/40 text-sm">Chargement des commandes…</p>
      ) : shown.length === 0 ? (
        <div className="text-center py-16">
          <iconify-icon icon="solar:bill-list-linear" className="text-4xl text-cream-50/20" />
          <p className="text-cream-50/45 mt-3">
            {orders.length === 0
              ? 'Aucune commande pour le moment.'
              : 'Aucune commande sur cette période.'}
          </p>
          <p className="text-xs text-cream-50/30 mt-1">
            Les nouvelles commandes apparaîtront ici et le ticket s&apos;imprimera automatiquement.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <OrderCard
              key={o.id || o.ref}
              order={o}
              onStatusChange={(s) => changeStatus(o, s)}
              onReprint={() => reprint(o)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, onStatusChange, onReprint }) {
  const c = order.customer || {};
  const st = STATUS[order.status] || { label: order.status, cls: 'bg-white/[0.06] text-cream-50/55 border-white/15' };
  const isNew = AUTO_PRINT_STATUSES.includes(order.status);
  const isPending = order.status === 'awaiting_payment';

  return (
    <Card className={`${isNew ? 'border-gold-400/40 bg-gold-400/[0.04]' : ''} ${isPending ? 'opacity-55' : ''}`}>
      {isPending && (
        <div className="flex items-center gap-2 text-[11px] text-yellow-200/90 bg-yellow-500/10 border border-yellow-400/20 rounded-lg px-2.5 py-1.5 mb-3">
          <iconify-icon icon="solar:hand-money-linear" className="text-sm text-yellow-300" />
          Paiement en attente — commande non encaissée (non enregistrée tant que le client n&apos;a pas payé).
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base text-cream-50">{orderLabel(order)}</h3>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${st.cls}`}>
              {st.label}
            </span>
            {Number.isFinite(order.dailySeq) && order.ref && (
              <span className="text-[10px] text-cream-50/35 font-mono">{order.ref}</span>
            )}
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                order.type === 'delivery'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                  : 'bg-sky-500/15 text-sky-300 border-sky-400/30'
              }`}
            >
              <iconify-icon icon={order.type === 'delivery' ? 'solar:scooter-linear' : 'solar:hand-bag-linear'} className="text-xs" />
              {order.type === 'delivery' ? 'Livraison' : 'Retrait sur place'}
            </span>
            {order.printedAt && (
              <span className="text-[10px] text-cream-50/40 inline-flex items-center gap-1">
                <iconify-icon icon="solar:printer-linear" className="text-xs" /> imprimé
              </span>
            )}
          </div>
          <p className="text-xs text-cream-50/45 mt-1">
            {formatDateTime(order.createdAt)} · {relTime(order.createdAt)} · {order.type === 'delivery' ? 'Livraison' : 'Retrait'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="py-1.5 text-xs w-auto min-w-[150px]"
          >
            {(STATUS_OPTIONS.includes(order.status)
              ? STATUS_OPTIONS
              : [order.status, ...STATUS_OPTIONS]
            ).map((s) => (
              <option key={s} value={s}>
                {(STATUS[s]?.label) || s}
              </option>
            ))}
          </Select>
          <Btn variant="ghost" onClick={onReprint} className="py-1.5">
            <span className="inline-flex items-center gap-1.5">
              <iconify-icon icon="solar:printer-linear" className="text-sm" />
              Ticket
            </span>
          </Btn>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-3">
        {/* Articles */}
        <div>
          <ul className="space-y-1">
            {(order.items || []).map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-cream-50/85">
                  <span className="text-gold-400/80 font-medium">{it.qty}×</span> {it.name}
                </span>
                <span className="text-cream-50/55 text-xs">{formatPrice((it.price || 0) * it.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-white/[0.07] flex items-center justify-between">
            <span className="text-xs text-cream-50/50">Total</span>
            <span className="font-serif text-lg text-gold-400">{formatPrice(order.total)}</span>
          </div>
          {order.type === 'delivery' && (
            <p className="text-[11px] text-cream-50/40 mt-1">
              Livraison : {order.deliveryFee === 0 ? 'offerte' : formatPrice(order.deliveryFee)}
            </p>
          )}
        </div>

        {/* Client */}
        <div className="text-sm space-y-1">
          <p className="text-cream-50/85 font-medium">
            {c.firstName} {c.lastName}
          </p>
          {c.phone && (
            <p className="text-cream-50/55 flex items-center gap-1.5">
              <iconify-icon icon="solar:phone-linear" className="text-xs text-gold-400/70" />
              <a href={`tel:${c.phone}`} className="hover:text-gold-400">{c.phone}</a>
            </p>
          )}
          {c.email && (
            <p className="text-cream-50/55 text-xs flex items-center gap-1.5">
              <iconify-icon icon="solar:letter-linear" className="text-xs text-gold-400/70" />
              {c.email}
            </p>
          )}
          {order.type === 'delivery' && (
            <p className="text-cream-50/55 text-xs flex items-start gap-1.5">
              <iconify-icon icon="solar:map-point-linear" className="text-xs text-gold-400/70 mt-0.5" />
              <span>
                {c.address}{c.address && (c.postalCode || c.city) ? ', ' : ''}
                {[c.postalCode, c.city].filter(Boolean).join(' ')}
              </span>
            </p>
          )}
          {order.type === 'delivery' &&
            [c.building, c.door, c.floor, c.intercom, c.accessCode].some(Boolean) && (
            <p className="text-cream-50/55 text-xs flex items-start gap-1.5">
              <iconify-icon icon="solar:key-minimalistic-square-linear" className="text-xs text-gold-400/70 mt-0.5" />
              <span>
                {[
                  c.building && `Bât ${c.building}`,
                  c.door && `Porte ${c.door}`,
                  c.floor && `Étage ${c.floor}`,
                  c.intercom && `Interphone ${c.intercom}`,
                  c.accessCode && `Code ${c.accessCode}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </p>
          )}
          {c.notes && (
            <p className="text-cream-50/55 text-xs bg-white/[0.03] border border-white/[0.07] rounded-lg px-2 py-1.5 mt-1">
              <span className="text-gold-400/70">Note : </span>{c.notes}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
