// ============================================================================
//  Génération des icônes PWA admin depuis public/icon.svg (one-off).
//  Usage : node scripts/generate-pwa-icons.mjs
//  Sortie : public/icon-192.png, icon-512.png, icon-maskable-192.png,
//           icon-maskable-512.png, apple-touch-icon.png.
//  Utilise sharp (déjà présent via Next).
// ============================================================================
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const svgPath = path.join(root, 'public', 'icon.svg');
const svg = await readFile(svgPath);

// Icônes standard : le SVG est rendu tel quel (il contient déjà sa marge
// interne : tuile arrondie 2..98 sur un viewBox 100).
for (const size of [192, 512]) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, 'public', `icon-${size}.png`));
  console.log(`icon-${size}.png OK`);
}

// Icônes maskables : le contenu utile doit tenir dans un cercle central de
// 80 % du côté — on agrandit le SVG à 80 % sur fond de la même teinte sombre
// que la tuile (pas de transparence : les masques Android n'en veulent pas).
const padRatio = 0.8;
for (const size of [192, 512]) {
  const inner = Math.round(size * padRatio);
  const offset = Math.round((size - inner) / 2);
  await sharp(svg, { density: 300 })
    .resize(inner, inner)
    .extend({
      top: offset,
      bottom: offset,
      left: offset,
      right: offset,
      background: '#0e0e0e',
    })
    .png()
    .toFile(path.join(root, 'public', `icon-maskable-${size}.png`));
  console.log(`icon-maskable-${size}.png OK`);
}

// Apple touch icon (raccourci iOS) : Safari ignore le SVG, il lui faut un PNG.
// 180x180 (recommandation Apple), rendu carré PLEIN (sans la transparence des
// coins du SVG) : iOS applique lui-même son masque arrondi — comme les
// maskables, on centre le SVG à 80 % sur le fond de la tuile.
const appleSize = 180;
const appleInner = Math.round(appleSize * padRatio);
const appleOffset = Math.round((appleSize - appleInner) / 2);
await sharp(svg, { density: 300 })
  .resize(appleInner, appleInner)
  .extend({
    top: appleOffset,
    bottom: appleOffset,
    left: appleOffset,
    right: appleOffset,
    background: '#0e0e0e',
  })
  .png()
  .toFile(path.join(root, 'public', 'apple-touch-icon.png'));
console.log('apple-touch-icon.png OK');
