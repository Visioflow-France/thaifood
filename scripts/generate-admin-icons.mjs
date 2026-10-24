// ============================================================================
//  Génération des icônes PWA admin depuis public/admin-icon.svg (one-off).
//  Usage : node scripts/generate-admin-icons.mjs
//  Sortie : public/admin-icon-{192,512}.png, admin-icon-maskable-{192,512}.png,
//           admin-apple-touch-icon.png.
//  Utilise sharp (déjà présent via Next). Cf. scripts/generate-pwa-icons.mjs
//  pour la version site vitrine (logique identique, icône source différente).
// ============================================================================
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const svgPath = path.join(root, 'public', 'admin-icon.svg');
const svg = await readFile(svgPath);

// Icônes standard : le SVG est rendu tel quel (il contient déjà sa marge
// interne : tuile arrondie 2..98 sur un viewBox 100).
for (const size of [192, 512]) {
  await sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(path.join(root, 'public', `admin-icon-${size}.png`));
  console.log(`admin-icon-${size}.png OK`);
}

// Icônes maskables : le contenu utile doit tenir dans un cercle central de
// 80 % du côté — on agrandit le SVG à 80 % sur fond doré (pas de transparence :
// les masques Android n'en veulent pas).
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
      background: '#c9a96e',
    })
    .png()
    .toFile(path.join(root, 'public', `admin-icon-maskable-${size}.png`));
  console.log(`admin-icon-maskable-${size}.png OK`);
}

// Apple touch icon admin (raccourci iOS) : Safari ignore le SVG ET le
// manifest pour l'icône d'écran d'accueil — sans cette icône dédiée, iOS
// installe l'admin avec l'icône du site vitrine (bug historique).
// 180x180 (recommandation Apple), rendu carré PLEIN : iOS applique lui-même
// son masque arrondi.
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
    background: '#c9a96e',
  })
  .png()
  .toFile(path.join(root, 'public', 'admin-apple-touch-icon.png'));
console.log('admin-apple-touch-icon.png OK');
