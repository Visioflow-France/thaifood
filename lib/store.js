import { getDb, hasFirebaseConfig } from './firebase-admin';
import bundledMenu from '../data/menu.json';

// ============================================================================
//  COUCHE D'ACCÈS AUX DONNÉES — Firestore (Firebase)
// ----------------------------------------------------------------------------
//  Plats / catégories / promos sont stockés dans Firestore (collections
//  `dishes`, `categories`, `promos`). Le SDK Admin contourne les règles de
//  sécurité → le serveur lit/écrit tout.
//
//  Fallback : si Firebase n'est pas configuré (ex: dev sans .env.local) OU si
//  Firestore est encore vide (menu non « seedé »), on retourne le menu
//  embarqué (data/menu.json bundlé) pour que le site affiche toujours quelque
//  chose. Les écritures, elles, nécessitent Firebase configuré.
//
//  Mêmes fonctions exportées qu'avant : les routes API et le dashboard ne
//  changent pas.
// ============================================================================

const COL = {
  dishes: 'dishes',
  categories: 'categories',
  promos: 'promos',
};

function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

async function readCollection(name) {
  const snap = await getDb().collection(name).get();
  return snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function collectionCount(name) {
  const snap = await getDb().collection(name).count().get();
  return snap.data().count;
}

// --- Lecture (publique) -----------------------------------------------------

export async function getMenu() {
  if (!hasFirebaseConfig()) return bundledMenu;
  const [dishes, categories, promos] = await Promise.all([
    readCollection(COL.dishes),
    readCollection(COL.categories),
    readCollection(COL.promos),
  ]);
  // Firestore vide (pas encore seedé) → menu embarqué.
  if (dishes.length === 0 && categories.length === 0) return bundledMenu;
  return { dishes, categories, promos };
}

export const getDishes = () => readCollection(COL.dishes);
export const getCategories = () => readCollection(COL.categories);
export const getPromos = () => readCollection(COL.promos);

// --- Plats ------------------------------------------------------------------

export async function saveDish(dish) {
  const next = { ...dish };
  if (!next.id) {
    next.id = genId('dish');
    next.order = typeof next.order === 'number' ? next.order : await collectionCount(COL.dishes);
    next.available = next.available !== false;
  }
  await getDb().collection(COL.dishes).doc(next.id).set(next, { merge: true });
  return next;
}

export async function deleteDish(id) {
  await getDb().collection(COL.dishes).doc(id).delete();
  // On nettoie aussi les promos qui ciblaient ce plat (filtrage en code pour
  // éviter d'avoir à créer un index composite Firestore).
  const promos = await readCollection(COL.promos);
  await Promise.all(
    promos
      .filter((p) => p.scope === 'dish' && p.targetId === id)
      .map((p) => getDb().collection(COL.promos).doc(p.id).delete())
  );
}

// --- Catégories -------------------------------------------------------------

export async function saveCategory(cat) {
  const next = { ...cat };
  if (!next.id) {
    next.id = genId('cat');
    next.order = typeof next.order === 'number' ? next.order : await collectionCount(COL.categories);
  }
  await getDb().collection(COL.categories).doc(next.id).set(next, { merge: true });
  return next;
}

export async function deleteCategory(id) {
  await getDb().collection(COL.categories).doc(id).delete();
}

// --- Promotions -------------------------------------------------------------

export async function savePromo(promo) {
  const next = { ...promo };
  if (!next.id) {
    next.id = genId('promo');
    next.active = next.active !== false;
  }
  await getDb().collection(COL.promos).doc(next.id).set(next, { merge: true });
  return next;
}

export async function deletePromo(id) {
  await getDb().collection(COL.promos).doc(id).delete();
}
