// ============================================================================
//  Générateur de data/menu.json à partir de scripts/menu-data.mjs
// ----------------------------------------------------------------------------
//  Convertit les données compactes (catégories + plats) vers le schéma attendu
//  par le site : { categories: [{id,name,order}], dishes: [{id,name,price,
//  img,desc,tag,tagClass,categoryId,available,order}], promos: [] }
//
//  Usage :  node scripts/build-menu.mjs
// ============================================================================

import { readdirSync, existsSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { categories as catData, dishes as dishData } from './menu-data.mjs';
import { unsplashFor } from './menu-images.mjs';
import { assignSlugs } from './menu-slug.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'data', 'menu.json');
const LOCAL_IMG_DIR = path.join(__dirname, '..', 'public', 'uploads', 'menu');

const categories = catData.map(([id, name, section], i) => ({
  id,
  name,
  order: i + 1,
  // `section` (3e élément du tuple) rattache la catégorie à une cuisine pour
  // la navigation par onglets du site (voir lib/sections.js). Optionnel.
  ...(section ? { section } : {}),
}));

// Index des photos locales téléchargées par fetch-menu-images.mjs.
// Lu une fois : Set des noms de fichiers présents dans public/uploads/menu.
const localFiles = existsSync(LOCAL_IMG_DIR)
  ? new Set(readdirSync(LOCAL_IMG_DIR))
  : new Set();

// Renvoie l'URL locale /uploads/menu/<slug>.<ext> si la photo existe, sinon null
// (auquel cas on bascule sur une photo Unsplash de fallback).
const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
function localImgFor(id) {
  for (const ext of IMG_EXTS) {
    if (localFiles.has(`${id}${ext}`)) return `/uploads/menu/${id}${ext}`;
  }
  return null;
}

// Slugs uniques alignés sur l'ordre des plats (partagés avec fetch-menu-images).
const slugs = assignSlugs(dishData.map((d) => d.n));

const dishes = dishData.map((d, i) => {
  const id = slugs[i];

  return {
    id,
    name: d.n,
    price: d.p,
    // Images : en priorité la VRAIE photo du plat téléchargée depuis
    // thaifood77340.com (360×240, voir fetch-menu-images.mjs). Fallback Unsplash
    // par catégorie + nom pour les rares plats sans photo exploitable.
    img: localImgFor(id) || unsplashFor(d.c, d.n),
    desc: d.d || '',
    tag: '',
    tagClass: 'text-gold-400',
    categoryId: d.c,
    available: true,
    order: i + 1,
  };
});

const menu = { categories, dishes, promos: [] };

writeFileSync(OUT, JSON.stringify(menu, null, 2), 'utf-8');

// --- Rapport ---------------------------------------------------------------
const byCat = {};
for (const d of dishes) byCat[d.categoryId] = (byCat[d.categoryId] || 0) + 1;

const localCount = dishes.filter((d) => d.img.startsWith('/uploads/menu/')).length;

console.log(`✓ menu.json généré : ${categories.length} catégories, ${dishes.length} plats`);
console.log(
  `  Images : ${localCount} vraies photos locales, ${dishes.length - localCount} fallback Unsplash`
);
console.log('  Répartition :');
for (const c of categories) {
  console.log(`    ${c.name.padEnd(28)} ${byCat[c.id] || 0}`);
}
