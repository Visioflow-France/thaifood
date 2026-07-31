import { getDb, getBucket, hasFirebaseConfig } from './firebase-admin';
import bundledMenu from '../data/menu.json';

// ============================================================================
//  COUCHE D'ACCÈS AUX DONNÉES — menu en UN SEUL document Firestore.
// ----------------------------------------------------------------------------
//  ⚡ Optimisation forfait Spark : tout le menu (plats + catégories + promos)
//  est stocké dans UN document unique `config/menu`. Une lecture du menu =
//  1 lecture de document (au lieu de ~220 quand on lisait 3 collections).
//
//  Cache serveur (TTL 30 s) : les chargements de page en rafale partagent une
//  seule lecture Firestore. Invalide à chaque écriture admin.
//
//  Fallback : si Firebase n'est pas configuré, vide, ou en erreur (quota Spark,
//  réseau…), on retourne le menu embarqué (data/menu.json) pour que le site et
//  le dashboard affichent toujours les plats.
//
//  Le SDK Admin contourne les règles Firestore → écritures/lectures serveur.
//  Les règles publiques verrouillent tout accès client (voir firestore.rules).
// ============================================================================

const MENU_COL = 'config';
const MENU_DOC = 'menu';
const MENU_TTL = 30_000; // cache serveur : 30 s

let _cache = null; // { dishes, categories, promos, updatedAt }
let _cacheAt = 0;

function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeMenu(doc) {
  return {
    dishes: Array.isArray(doc?.dishes) ? doc.dishes : bundledMenu.dishes || [],
    categories: Array.isArray(doc?.categories) ? doc.categories : bundledMenu.categories || [],
    promos: Array.isArray(doc?.promos) ? doc.promos : bundledMenu.promos || [],
  };
}

// --- Lecture du document unique (avec cache TTL) ---------------------------

export function invalidateMenuCache() {
  _cache = null;
}

async function loadMenuData(force = false) {
  if (!force && _cache && Date.now() - _cacheAt < MENU_TTL) return _cache;

  // Pas de Firebase configuré → menu embarqué.
  if (!hasFirebaseConfig()) {
    _cache = normalizeMenu(null);
    _cacheAt = Date.now();
    return _cache;
  }

  try {
    const snap = await getDb().collection(MENU_COL).doc(MENU_DOC).get();
    if (!snap.exists) {
      // Document menu absent (pas encore seedé) → menu embarqué.
      _cache = normalizeMenu(null);
    } else {
      _cache = normalizeMenu(snap.data());
    }
  } catch (e) {
    console.error('[store] lecture menu impossible, fallback local :', e?.details || e?.message);
    _cache = _cache || normalizeMenu(null); // on garde l'ancien cache si dispo
  }
  _cacheAt = Date.now();
  return _cache;
}

// --- Lecture (publique + admin) — 1 lecture document ------------------------

export async function getMenu() {
  return loadMenuData();
}

export async function getDishes() {
  return (await loadMenuData()).dishes;
}
export async function getCategories() {
  return (await loadMenuData()).categories;
}
export async function getPromos() {
  return (await loadMenuData()).promos;
}

// --- Mutations (read-modify-write du document unique) -----------------------
// Chaque mutation : 1 lecture + 1 écriture, puis invalidation du cache.

async function mutateMenu(fn) {
  const data = await loadMenuData(true); // force refresh avant écriture
  const next = fn({ dishes: data.dishes, categories: data.categories, promos: data.promos });
  const payload = {
    dishes: next.dishes,
    categories: next.categories,
    promos: next.promos,
    updatedAt: new Date().toISOString(),
  };
  await getDb().collection(MENU_COL).doc(MENU_DOC).set(payload, { merge: true });
  _cache = normalizeMenu(payload);
  _cacheAt = Date.now();
  return _cache;
}

// --- Nettoyage Firebase Storage ---------------------------------------------
// Supprime un objet Storage à partir de son URL publique, UNIQUEMENT si c'est
// une de nos uploads (sous « menu/ »). Les URL externes (Unsplash, etc.) et
// les erreurs sont ignorées silencieusement.

export async function deleteStorageObjectFromUrl(url) {
  try {
    if (!url || typeof url !== 'string') return;
    const m = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?]+)/);
    if (!m) return; // URL externe : rien à supprimer.
    const path = decodeURIComponent(m[1]);
    if (!path.startsWith('menu/')) return; // on ne touche qu'à nos uploads.
    await getBucket().file(path).delete();
  } catch (e) {
    console.error('[store] suppression image Storage ignorée :', e?.details || e?.message);
  }
}

// --- Plats ------------------------------------------------------------------

export async function saveDish(dish) {
  const next = { ...dish };
  let saved;
  await mutateMenu((menu) => {
    const idx = menu.dishes.findIndex((d) => d.id === next.id);
    if (!next.id || idx === -1) {
      // Nouveau plat : id + ordre auto + dispo par défaut.
      next.id = next.id || genId('dish');
      next.order = typeof next.order === 'number' ? next.order : menu.dishes.length;
      next.available = next.available !== false;
      menu.dishes.push(next);
    } else {
      const old = menu.dishes[idx];
      // Remplacement de photo → on nettoie l'ancienne image Storage.
      if (old?.img && old.img !== next.img) {
        deleteStorageObjectFromUrl(old.img); // fire-and-forget
      }
      menu.dishes[idx] = { ...old, ...next };
    }
    saved = menu.dishes.find((d) => d.id === next.id);
    return menu;
  });
  return saved;
}

export async function deleteDish(id) {
  let removedImg = null;
  await mutateMenu((menu) => {
    const dish = menu.dishes.find((d) => d.id === id);
    if (dish?.img) removedImg = dish.img;
    menu.dishes = menu.dishes.filter((d) => d.id !== id);
    // On nettoie aussi les promos qui ciblaient ce plat.
    menu.promos = menu.promos.filter((p) => !(p.scope === 'dish' && p.targetId === id));
    return menu;
  });
  if (removedImg) deleteStorageObjectFromUrl(removedImg); // fire-and-forget
}

// --- Catégories -------------------------------------------------------------

export async function saveCategory(cat) {
  const next = { ...cat };
  let saved;
  await mutateMenu((menu) => {
    const idx = menu.categories.findIndex((c) => c.id === next.id);
    if (!next.id || idx === -1) {
      next.id = next.id || genId('cat');
      next.order = typeof next.order === 'number' ? next.order : menu.categories.length;
      menu.categories.push(next);
    } else {
      menu.categories[idx] = { ...menu.categories[idx], ...next };
    }
    saved = menu.categories.find((c) => c.id === next.id);
    return menu;
  });
  return saved;
}

export async function deleteCategory(id) {
  await mutateMenu((menu) => {
    menu.categories = menu.categories.filter((c) => c.id !== id);
    return menu;
  });
}

// --- Promotions -------------------------------------------------------------

export async function savePromo(promo) {
  const next = { ...promo };
  let saved;
  await mutateMenu((menu) => {
    const idx = menu.promos.findIndex((p) => p.id === next.id);
    if (!next.id || idx === -1) {
      next.id = next.id || genId('promo');
      next.active = next.active !== false;
      menu.promos.push(next);
    } else {
      menu.promos[idx] = { ...menu.promos[idx], ...next };
    }
    saved = menu.promos.find((p) => p.id === next.id);
    return menu;
  });
  return saved;
}

export async function deletePromo(id) {
  await mutateMenu((menu) => {
    menu.promos = menu.promos.filter((p) => p.id !== id);
    return menu;
  });
}
