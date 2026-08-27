import crypto from 'crypto';
import { computeTotals, FREE_DELIVERY_THRESHOLD, MIN_DELIVERY_ORDER, getEffectivePrice } from './pricing';
import { getSettings } from './settings';
import { getDb } from './firebase-admin';
import { getDishes, getPromos } from './store';

// ============================================================================
//  COUCHE DE COMMANDES — Firestore (collection `orders`) + Stripe-ready
// ----------------------------------------------------------------------------
//  buildOrder() = validation + construction + RECALCUL des prix depuis le menu
//  (le prix envoyé par le client est ignoré). Le stockage se fait dans Firestore.
//  Mêmes fonctions exportées qu'avant : les routes API et le tunnel de commande
//  ne changent pas (buildOrder est désormais async).
//
//  PAIEMENT STRIPE CONNECT (Express) :
//  - isStripeActive() : vrai si clé plateforme + compte restaurateur connecté.
//  - markOrderPaid / markOrderFailed : appelés par le webhook Stripe.
//  Statut : received | awaiting_payment | paid | failed | confirmed | preparing
//           | ready | fulfilled | cancelled.
// ============================================================================

const COL_ORDERS = 'orders';

function genId(prefix = 'ord') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Référence courte lisible par le client, ex : "TF-7K3Q9F".
// Alphabet sans caractères ambigus (0/O, 1/I/L…). Tirage cryptographique
// (CSPRNG) pour limiter l'énumération — la ref sert aussi d'identifiant de
// suivi de commande (voir /api/orders/[ref]).
const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function genReference() {
  const bytes = crypto.randomBytes(6);
  let s = '';
  for (let i = 0; i < 6; i++) s += REF_CHARS[bytes[i] % REF_CHARS.length];
  return `TF-${s}`;
}

// Clé du jour au format YYYY-MM-DD (fuseau Europe/Paris) : sert au numéro de
// commande quotidien qui se réinitialise chaque jour à 1.
export function todayKey(tz = 'Europe/Paris') {
  try {
    return new Date().toLocaleDateString('sv-SE', { timeZone: tz });
  } catch {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}

// Numéro de commande séquentiel par jour (1, 2, 3…) via un compteur Firestore
// `config/orderSeq` mis à jour en transaction (atomique, sans doublon).
// Se réinitialise à 1 au changement de jour (fuseau Europe/Paris).
export async function nextDailySequence() {
  const counterRef = getDb().collection('config').doc('orderSeq');
  const today = todayKey();
  let seq = 1;
  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.exists ? snap.data() : null;
    seq = !data || data.date !== today ? 1 : (Number(data.count) || 0) + 1;
    tx.set(counterRef, { date: today, count: seq }, { merge: true });
  });
  return { day: today, seq };
}

// Statuts de commande autorisés (partagé entre l'API admin et la logique).
export const ORDER_STATUSES = [
  'received', // nouvelle (paiement sur place)
  'awaiting_payment', // en attente de paiement Stripe
  'paid', // payée en ligne
  'failed', // échec paiement
  'confirmed', // confirmée par le restaurateur
  'preparing', // en préparation
  'ready', // prête
  'fulfilled', // terminée
  'cancelled', // annulée
];

// Erreur métier (données invalides) — renvoyée en 400 par l'API.
export class OrderError extends Error {}

const REQUIRED_BY_TYPE = {
  pickup: ['firstName', 'lastName', 'phone'],
  delivery: ['firstName', 'lastName', 'phone', 'address', 'postalCode', 'city'],
};

const FIELD_LABELS = {
  firstName: 'prénom',
  lastName: 'nom',
  phone: 'téléphone',
  email: 'e-mail',
  address: 'adresse',
  postalCode: 'code postal',
  city: 'ville',
};

// Construit + valide une commande à partir d'une charge entrante.
// Lève OrderError en cas de données invalides.
//
// ⚠️ SOURCE DE VÉRITÉ DES PRIX = le menu (Firestore/bundled). Le serveur
// RECALCULE chaque prix depuis le plat correspondant (et y applique la promo
// courante). Le prix envoyé par le navigateur est IGNORÉ : impossible pour un
// client de forcer un prix (0 €) ou d'ajouter un plat inconnu / indisponible.
export async function buildOrder(payload = {}) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (items.length === 0) throw new OrderError('Votre panier est vide.');

  const type = payload.type === 'delivery' ? 'delivery' : 'pickup';
  const c = payload.customer || {};

  for (const f of REQUIRED_BY_TYPE[type]) {
    if (!String(c[f] || '').trim()) {
      throw new OrderError(`Champ requis : ${FIELD_LABELS[f] || f}.`);
    }
  }
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
    throw new OrderError('Adresse e-mail invalide.');
  }
  if (!/^[+0-9().\s-]{8,}$/.test(c.phone)) {
    throw new OrderError('Numéro de téléphone invalide.');
  }

  // Index du menu par nom normalisé (le panier client est lui-même clé par nom).
  const dishes = await getDishes();
  const promos = await getPromos();
  const dishByName = new Map();
  for (const d of dishes) {
    if (d && d.name) dishByName.set(String(d.name).trim().toLowerCase(), d);
  }

  const normItems = items.map((i) => {
    const key = String(i.name || '').trim().toLowerCase();
    const dish = dishByName.get(key);
    if (!dish) {
      throw new OrderError(`Plat introuvable : ${i.name || 'inconnu'}.`);
    }
    if (dish.available === false) {
      throw new OrderError(`Ce plat n'est plus disponible : ${dish.name}.`);
    }
    return {
      name: String(dish.name).slice(0, 120),
      price: Math.max(0, Number(getEffectivePrice(dish, promos)) || 0),
      qty: Math.max(1, Math.min(99, parseInt(i.qty, 10) || 1)),
      image: dish.img || i.image || null,
    };
  });

  const { subtotal, deliveryFee, total } = computeTotals(normItems, type, {
    postalCode: c.postalCode,
    city: c.city,
  });

  // Montant minimum pour la livraison (hors frais) — barrière serveur, le
  // contrôle client du Checkout n'est qu'une aide visuelle.
  if (type === 'delivery' && subtotal < MIN_DELIVERY_ORDER) {
    throw new OrderError(
      `La livraison est possible uniquement à partir de ${MIN_DELIVERY_ORDER.toFixed(2).replace('.', ',')}€ de commande.`
    );
  }

  return {
    id: genId('ord'),
    ref: genReference(),
    createdAt: new Date().toISOString(),
    // Statut par défaut. En paiement en ligne, la route /api/orders passe à
    // 'awaiting_payment', puis le webhook Stripe met à 'paid' / 'failed'.
    status: 'received', // received | awaiting_payment | paid | failed | confirmed | preparing | ready | fulfilled | cancelled
    type,
    customer: {
      firstName: String(c.firstName || '').trim(),
      lastName: String(c.lastName || '').trim(),
      phone: String(c.phone || '').trim(),
      email: String(c.email || '').trim(),
      address: String(c.address || '').trim(),
      postalCode: String(c.postalCode || '').trim(),
      city: String(c.city || '').trim(),
      // Détails de livraison facultatifs (affichés sur le ticket).
      building: String(c.building || '').trim().slice(0, 50),
      door: String(c.door || '').trim().slice(0, 50),
      accessCode: String(c.accessCode || '').trim().slice(0, 50),
      intercom: String(c.intercom || '').trim().slice(0, 80),
      floor: String(c.floor || '').trim().slice(0, 50),
      notes: String(c.notes || '').trim().slice(0, 500),
    },
    scheduledFor: payload.scheduledFor || null,
    items: normItems,
    subtotal,
    deliveryFee,
    total,
    channel: 'web',
    freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
  };
}

// --- Stockage Firestore -----------------------------------------------------

// Recherche une commande par ref (ou id). Renvoie { doc, order } ou null.
async function findOrderDoc(ref) {
  const col = getDb().collection(COL_ORDERS);
  const byRef = await col.where('ref', '==', ref).limit(1).get();
  if (!byRef.empty) {
    const d = byRef.docs[0];
    return { doc: d.ref, order: { id: d.id, ...d.data() } };
  }
  const byId = await col.doc(ref).get();
  if (byId.exists) return { doc: byId.ref, order: { id: byId.id, ...byId.data() } };
  return null;
}

export async function saveOrder(order) {
  await getDb().collection(COL_ORDERS).doc(order.id).set(order);
  return order;
}

export async function getOrders() {
  try {
    const snap = await getDb().collection(COL_ORDERS).orderBy('createdAt', 'desc').get();
    return snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Quota Firestore dépassé / réseau : on ne fait pas planter le dashboard.
    console.error('[orders] lecture impossible :', e?.details || e?.message);
    return [];
  }
}

export async function getOrderByRef(ref) {
  const found = await findOrderDoc(ref);
  return found ? found.order : null;
}

export async function updateOrderStatus(ref, status) {
  const found = await findOrderDoc(ref);
  if (!found) return null;
  const patch = { status, updatedAt: new Date().toISOString() };
  await found.doc.update(patch);
  return { ...found.order, ...patch };
}

// Marque une commande comme « ticket imprimé » (idempotent). Sert à éviter de
// réimprimer plusieurs fois une même commande (cross-appareil).
export async function markOrderPrinted(ref) {
  const found = await findOrderDoc(ref);
  if (!found) return null;
  if (found.order.printedAt) return { ...found.order };
  const patch = { printedAt: new Date().toISOString() };
  await found.doc.update(patch);
  return { ...found.order, ...patch };
}

// ============================================================================
//  PAIEMENT STRIPE
// ============================================================================

// Paiement en ligne activé ? Nécessite la clé plateforme (env) ET un compte
// restaurateur connecté (Firestore → settings). Sinon : règlement sur place.
export async function isStripeActive() {
  if (!process.env.STRIPE_SECRET_KEY) return false;
  const { connectedAccountId } = await getSettings();
  return Boolean(connectedAccountId);
}

// Marque une commande payée (appelé par le webhook Stripe). Idempotent.
// Ne ressuscite pas une commande annulée manuellement par le restaurateur.
export async function markOrderPaid(ref, payment = {}) {
  const found = await findOrderDoc(ref);
  if (!found) return null;
  // Déjà payée -> rien à faire (évite d'écraser payment/paidAt).
  if (found.order.status === 'paid') return { ...found.order };
  // Annulée manuellement -> on ne la repasse pas en payée.
  if (found.order.status === 'cancelled') return { ...found.order };
  const patch = {
    status: 'paid',
    paidAt: new Date().toISOString(),
    payment: {
      paymentIntentId: payment.paymentIntentId || found.order.payment?.paymentIntentId || null,
      checkoutSessionId: payment.checkoutSessionId || null,
      feeAmount: typeof payment.feeAmount === 'number' ? payment.feeAmount : null,
      paidAmount: typeof payment.paidAmount === 'number' ? payment.paidAmount : null,
    },
    updatedAt: new Date().toISOString(),
  };
  // Livraison : numéro quotidien attribué au succès du paiement (et non à la
  // création) pour ne pas consommer de numéro sur une commande abandonnée.
  // Idempotent : un retrait a déjà son numéro, et un 2e webhook sur une commande
  // déjà 'paid' sort plus haut (early-return) — pas de double incrémentation.
  if (!Number.isFinite(found.order.dailySeq)) {
    const { day, seq } = await nextDailySequence();
    patch.day = day;
    patch.dailySeq = seq;
  }
  await found.doc.update(patch);
  return { ...found.order, ...patch };
}

// Marque une commande en échec de paiement (appelé par le webhook Stripe).
export async function markOrderFailed(ref, reason = '') {
  const found = await findOrderDoc(ref);
  if (!found) return null;
  const patch = {
    status: 'failed',
    failureReason: String(reason || '').slice(0, 300),
    updatedAt: new Date().toISOString(),
  };
  await found.doc.update(patch);
  return { ...found.order, ...patch };
}
