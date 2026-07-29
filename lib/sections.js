// ============================================================================
//  Sections de la carte — niveau 1 de la navigation « Commander ».
// ----------------------------------------------------------------------------
//  Les ~30 catégories sont regroupées en grandes sections (cuisine Thaï,
//  Japonais, Desserts, Boissons) pour ne plus afficher toutes les pastilles de
//  filtre d'un coup. L'utilisateur choisit d'abord la cuisine (onglet), puis
//  affine par sous-catégorie.
//
//  RÉSILIENCE : une catégorie peut porter un champ `section` (menu.json embarqué
//  ou Firestore). S'il est absent, on retombe sur SECTION_BY_ID — qui couvre
//  toutes les catégories actuelles — puis sur 'autres'. Le rangement fonctionne
//  donc même si la source de données n'a pas (encore) le champ `section`
//  (ex: Firestore non re-seedé, menu.json régénéré, catégorie créée à la volée).
//
//  Sans dépendance serveur : importable côté client (Commander) et admin.
// ============================================================================

export const SECTIONS = [
  { id: 'thai', label: 'Thaï & Vietnamien', emoji: '🍜' },
  { id: 'japonais', label: 'Japonais', emoji: '🍣' },
  { id: 'desserts', label: 'Desserts', emoji: '🍰' },
  { id: 'boissons', label: 'Boissons', emoji: '🥤' },
];

// Section « filet de sécurité » : n'apparaît que si une catégorie n'est
// rattachée à aucune section connue (afin qu'aucun plat ne disparaisse).
export const OTHER_SECTION = { id: 'autres', label: 'Autres', emoji: '🍽️' };

// Toutes les sections proposées dans le sélecteur admin (ordre d'affichage).
export const ALL_SECTIONS = [...SECTIONS, OTHER_SECTION];

// Fallback id de catégorie → section (couvre les 32 catégories actuelles).
// Utilisé quand le champ `section` manque sur la catégorie.
export const SECTION_BY_ID = {
  // Thaï & Vietnamien
  entrees: 'thai',
  salades: 'thai',
  soupes: 'thai',
  menus: 'thai',
  bobun: 'thai',
  'pad-thai': 'thai',
  'pad-see-yui': 'thai',
  'nouilles-sautees': 'thai',
  'khao-prat': 'thai',
  'loc-lac': 'thai',
  riz: 'thai',
  crevettes: 'thai',
  'specialites-boeuf': 'thai',
  'specialites-poulet': 'thai',
  'specialites-thai': 'thai',
  // Japonais
  maki: 'japonais',
  'saumon-roll': 'japonais',
  'eggs-roll': 'japonais',
  'crispy-roll': 'japonais',
  'california-frits': 'japonais',
  'ice-rolls': 'japonais',
  'maki-printemps': 'japonais',
  california: 'japonais',
  'avocats-roll': 'japonais',
  sushi: 'japonais',
  sashimi: 'japonais',
  chirashi: 'japonais',
  poke: 'japonais',
  'specialite-japonaise': 'japonais',
  'menu-japonais': 'japonais',
  // Divers
  desserts: 'desserts',
  boissons: 'boissons',
};

// Résout la section d'une catégorie : `section` explicite prioritaire, sinon
// fallback par id, sinon 'autres'.
export function sectionOf(cat) {
  if (!cat) return OTHER_SECTION.id;
  return cat.section || SECTION_BY_ID[cat.id] || OTHER_SECTION.id;
}

// Liste ordonnée des sections réellement présentes dans la carte.
// 'autres' n'est incluse que si au moins une catégorie s'y rattache.
export function sectionsInUse(categories) {
  const present = new Set((categories || []).map(sectionOf));
  const list = SECTIONS.filter((s) => present.has(s.id));
  if (present.has(OTHER_SECTION.id)) list.push(OTHER_SECTION);
  return list;
}
