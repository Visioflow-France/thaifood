// ============================================================================
//  Données de la carte — source : thaifood77340.com
// ----------------------------------------------------------------------------
//  Prix repris EXACTEMENT du site source. Noms conservés (coquilles évidentes
//  corrigées : Pouelt→Poulet, Mayp→Mayo, Lce→Ice, Crevetes→Crevettes, etc.).
//  Images : URLs exactes du site source (thumbnails 60x40, servies telles quelles).
//
//  Helpers d'URL pour éviter les fautes de frappe :
//    img(n)      -> photo standard (customer/.../images/pN-60x40.png)
//    design(n)   -> photo "0design"
//    fond(n,sub) -> photo "_Fond-blanc-japonais/<sub>/pN-60x40.jpg"
//    emoji(n)    -> icône "emoji_category/pN-60x40.png"
//    gif(n)      -> "gif_success/pN-60x40.gif"
// ============================================================================

const B = 'https://thaifood77340.com/image/cache/catalog';
const img = (n) => `${B}/customer/thaifood77340_com/images/p${n}-60x40.png`;
const design = (n) => `${B}/customer/thaifood77340_com/0design/p${n}-60x40.png`;
const fond = (n, sub, ext = 'jpg') => `${B}/_Fond-blanc-japonais/${sub}/p${n}-60x40.${ext}`;
// NB : p266 (Ravioli Aux Crevettes) est servi en .JPG majuscule côté source.
const emoji = (n) => `${B}/emoji_category/p${n}-60x40.png`;
const gif = (n) => `${B}/gif_success/p${n}-60x40.gif`;

export const categories = [
  ['entrees', 'Entrées', 'thai'],
  ['salades', 'Salades', 'thai'],
  ['soupes', 'Soupes', 'thai'],
  ['menus', 'Menus', 'thai'],
  ['bobun', 'Bobun', 'thai'],
  ['pad-thai', 'Pad Thaï', 'thai'],
  ['pad-see-yui', 'Pad See Yui', 'thai'],
  ['nouilles-sautees', 'Nouilles Sautées', 'thai'],
  ['khao-prat', 'Khao Prat', 'thai'],
  ['loc-lac', 'Loc Lac', 'thai'],
  ['riz', 'Riz', 'thai'],
  ['crevettes', 'Crevettes', 'thai'],
  ['specialites-boeuf', 'Spécialités Bœuf', 'thai'],
  ['specialites-poulet', 'Spécialités Poulet', 'thai'],
  ['specialites-thai', 'Spécialités Thaï Food', 'thai'],
  ['maki', 'Maki', 'japonais'],
  ['saumon-roll', 'Saumon Roll', 'japonais'],
  ['eggs-roll', 'Eggs Roll', 'japonais'],
  ['crispy-roll', 'Crispy Roll', 'japonais'],
  ['california-frits', 'California Frits', 'japonais'],
  ['ice-rolls', 'Ice Rolls', 'japonais'],
  ['maki-printemps', 'Maki Printemps', 'japonais'],
  ['california', 'California', 'japonais'],
  ['avocats-roll', 'Avocats Roll', 'japonais'],
  ['sushi', 'Sushi', 'japonais'],
  ['sashimi', 'Sashimi', 'japonais'],
  ['chirashi', 'Chirashi', 'japonais'],
  ['poke', 'Poké', 'japonais'],
  ['specialite-japonaise', 'Spécialité Japonaise', 'japonais'],
  ['menu-japonais', 'Menu Japonais', 'japonais'],
  ['desserts', 'Desserts', 'desserts'],
  ['boissons', 'Boissons', 'boissons'],
];

// Format : { c: categoryId, n: nom, p: prix, i: urlImage, d: description }
export const dishes = [
  // ---------------- ENTRÉES ----------------
  { c: 'entrees', n: 'Nêms Au Poulet', p: 5.80, i: img(1), d: '(4 pièces)' },
  { c: 'entrees', n: 'Nêms Aux Crevettes', p: 6.80, i: img(2), d: '(4 pièces)' },
  { c: 'entrees', n: 'Nêms 2 Poulets Avec 2 Crevettes', p: 6.50, i: img(3), d: '(4 pièces)' },
  { c: 'entrees', n: 'Nêms Végétariens', p: 6.20, i: img(4), d: '(4 pièces)' },
  { c: 'entrees', n: 'Croquettes Frites Aux Crevettes', p: 5.90, i: img(5), d: '(3 pièces)' },
  { c: 'entrees', n: 'Tempuras Aux Crevettes', p: 6.20, i: img(6), d: '(4 pièces)' },
  { c: 'entrees', n: 'Beignets', p: 6.80, i: img(7), d: '(4 pièces)' },
  { c: 'entrees', n: 'Samoussa Au Bœuf', p: 6.80, i: img(8), d: '(3 pièces)' },
  { c: 'entrees', n: 'Rouleau De Printemps Au Poulet Pané', p: 7.50, i: img(9), d: '(2 pièces)' },
  { c: 'entrees', n: 'Rouleau De Printemps Aux Crevettes Décortiquées', p: 8.50, i: img(10), d: '(2 pièces)' },
  { c: 'entrees', n: 'Gyoza Au Poulet', p: 7.60, i: img(11), d: '(6 pièces)' },
  { c: 'entrees', n: 'Yakitori Bœuf Au Fromage', p: 6.20, i: img(12), d: '(2 pièces)' },
  { c: 'entrees', n: 'Yakitori Poulet', p: 6.50, i: img(13), d: '(2 pièces)' },
  { c: 'entrees', n: 'Yakitori Boulettes De Poulet', p: 7.80, i: img(14), d: '(2 pièces)' },
  { c: 'entrees', n: 'Yakitori Saumon', p: 7.80, i: img(15), d: '(2 pièces)' },
  { c: 'entrees', n: 'Tartare De Riz, Saumon, Avocat Et Fromage', p: 11.90, i: img(16), d: '' },
  { c: 'entrees', n: 'Tartare De Riz, Crevettes, Avocat Et Mayonnaise Du Chef', p: 10.90, i: design(17), d: '' },
  { c: 'entrees', n: 'Tartare De Riz, Poulet, Avocat Et Mayonnaise Du Chef', p: 10.50, i: img(18), d: '' },
  { c: 'entrees', n: 'Tartare De Saumon Et Avocat', p: 11.90, i: img(19), d: '' },
  { c: 'entrees', n: 'Tartare De Saumon, Avocat Et Œuf', p: 12.90, i: img(20), d: '' },
  { c: 'entrees', n: 'Bouchée Aux Crevettes', p: 6.50, i: img(267), d: '(4 pièces)' },
  { c: 'entrees', n: 'Ravioli Aux Crevettes', p: 6.50, i: fond(266, 'entrees'), d: '(4 pièces)' },

  // ---------------- SALADES ----------------
  { c: 'salades', n: 'Salade Au Brocolis Sauté', p: 9.80, i: img(21), d: '' },
  { c: 'salades', n: 'Salade De Choux', p: 3.00, i: img(22), d: '' },
  { c: 'salades', n: 'Salade Thaï Aux Légumes Sautés', p: 8.00, i: img(23), d: '' },
  { c: 'salades', n: 'Salade Thaï Aux Nems Poulet', p: 8.90, i: img(24), d: '' },
  { c: 'salades', n: 'Salade Thaï Au Poulet', p: 8.90, i: img(25), d: '' },
  { c: 'salades', n: 'Salade Thaï Au Bœuf', p: 9.50, i: img(26), d: '' },
  { c: 'salades', n: 'Salade Thaï Aux Crevettes', p: 9.60, i: img(27), d: '' },
  { c: 'salades', n: 'Salade Thaï Au Saumon', p: 9.90, i: img(28), d: '' },
  { c: 'salades', n: 'Salade Thaï De Mangue Verte Et Crevettes', p: 11.90, i: design(29), d: '' },
  { c: 'salades', n: 'Salade Thaï Au Bœuf Cru', p: 12.80, i: img(30), d: '' },
  { c: 'salades', n: 'Salade Thaï Nems Crevettes', p: 9.60, i: design(31), d: '' },
  { c: 'salades', n: "Salade D'algues", p: 4.20, i: img(32), d: '' },
  { c: 'salades', n: 'Salade De Papaye Verte', p: 11.80, i: img(33), d: '' },

  // ---------------- SOUPES ----------------
  { c: 'soupes', n: 'Soupe Miso', p: 3.00, i: img(34), d: '' },
  { c: 'soupes', n: 'Soupe Tofu à La Citronnelle', p: 8.00, i: img(35), d: '' },
  { c: 'soupes', n: 'Soupe Poulet à La Citronnelle', p: 8.90, i: img(36), d: '' },
  { c: 'soupes', n: 'Soupe Crevettes à La Citronnelle', p: 9.80, i: img(37), d: '' },
  { c: 'soupes', n: 'Soupe Poulet Au Lait De Coco', p: 9.80, i: img(38), d: '' },
  { c: 'soupes', n: 'Soupe Crevettes Au Lait De Coco', p: 10.80, i: img(39), d: '' },

  // ---------------- MENUS ----------------
  { c: 'menus', n: 'Menu Enfant (Midi Et Soir)', p: 7.00, i: emoji(40), d: '1 Brochette Aux Boulettes De Poulet ou 1 Brochette Au Bœuf Fromage, tous servis avec riz cantonnais et jus de fruit.' },
  { c: 'menus', n: 'Menu Midi Poulet', p: 13.90, i: emoji(41), d: '3 Nêms au poulet ou salade thaï au poulet, servis avec Pad Thaï au poulet ou Khao Prat au poulet.' },
  { c: 'menus', n: 'Menu Yakitori Bœuf', p: 13.90, i: emoji(42), d: '5 Yakitoris bœuf au fromage servis avec riz et dessert.' },
  { c: 'menus', n: 'Menu Yakitori Poulet', p: 15.80, i: emoji(43), d: '3 Yakitoris poulet, 3 yakitoris boulettes de poulet servis avec riz et dessert.' },
  { c: 'menus', n: 'Menu Soir Poulet', p: 16.90, i: emoji(44), d: '3 Nems au poulet ou une salade thaï au poulet, accompagnés de Pad Thaï ou Khao Pad au poulet, avec un dessert.' },
  { c: 'menus', n: 'Menu Yakitori Mix', p: 17.00, i: emoji(45), d: '2 Brochettes saumon, 2 brochettes poulet, 2 brochettes boulettes de poulet, 2 brochettes bœuf au fromage, accompagné du riz avec un dessert.' },

  // ---------------- BOBUN ----------------
  { c: 'bobun', n: 'Bobun Végétarien', p: 12.50, i: img(46), d: '' },
  { c: 'bobun', n: 'Bobun Poulet', p: 10.80, i: img(47), d: '' },
  { c: 'bobun', n: 'Bobun Bœuf', p: 11.80, i: img(48), d: '' },
  { c: 'bobun', n: 'Bobun Crevettes', p: 12.50, i: img(49), d: '' },
  { c: 'bobun', n: 'Bobun Saumon', p: 13.50, i: design(50), d: '' },

  // ---------------- PAD THAÏ (faits maison) ----------------
  { c: 'pad-thai', n: 'Pad Thaï Végétarien', p: 12.50, i: img(51), d: 'Fait maison' },
  { c: 'pad-thai', n: 'Pad Thaï Poulet', p: 10.80, i: img(52), d: 'Fait maison' },
  { c: 'pad-thai', n: 'Pad Thaï Poulet Pané', p: 11.50, i: img(53), d: 'Fait maison' },
  { c: 'pad-thai', n: 'Pad Thaï Bœuf', p: 11.80, i: img(54), d: 'Fait maison' },
  { c: 'pad-thai', n: 'Pad Thaï Crevettes', p: 12.50, i: img(55), d: 'Fait maison' },
  { c: 'pad-thai', n: 'Pad Thaï Saumon', p: 13.50, i: img(56), d: 'Fait maison' },

  // ---------------- PAD SEE YUI ----------------
  { c: 'pad-see-yui', n: 'Pad See Yui Végétarien', p: 12.50, i: img(57), d: '' },
  { c: 'pad-see-yui', n: 'Pad See Yui Poulet', p: 10.80, i: img(58), d: '' },
  { c: 'pad-see-yui', n: 'Pad See Yui Poulet Pané', p: 11.50, i: img(59), d: '' },
  { c: 'pad-see-yui', n: 'Pad See Yui Bœuf', p: 11.80, i: img(60), d: '' },
  { c: 'pad-see-yui', n: 'Pad See Yui Crevettes', p: 12.50, i: img(61), d: '' },
  { c: 'pad-see-yui', n: 'Pad See Yui Saumon', p: 13.50, i: img(62), d: '' },

  // ---------------- NOUILLES SAUTÉES ----------------
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Aux Légumes', p: 8.80, i: img(63), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Au Poulet', p: 10.80, i: img(64), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Au Poulet Pané', p: 12.80, i: img(65), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Au Bœuf', p: 12.80, i: img(66), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Aux Crevettes', p: 12.80, i: img(67), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Végétarien', p: 12.50, i: img(68), d: '' },
  { c: 'nouilles-sautees', n: 'Nouilles Sautées Saumon', p: 13.50, i: img(69), d: '' },

  // ---------------- KHAO PRAT ----------------
  { c: 'khao-prat', n: 'Khao Prat Végétarien', p: 12.50, i: img(70), d: '' },
  { c: 'khao-prat', n: 'Khao Prat Poulet', p: 10.80, i: img(71), d: '' },
  { c: 'khao-prat', n: 'Khao Prat Poulet Pané', p: 11.50, i: img(72), d: '' },
  { c: 'khao-prat', n: 'Khao Prat Bœuf', p: 11.80, i: img(73), d: '' },
  { c: 'khao-prat', n: 'Khao Prat Crevettes', p: 12.50, i: img(74), d: '' },
  { c: 'khao-prat', n: 'Khao Prat Saumon', p: 13.50, i: img(75), d: '' },

  // ---------------- LOC LAC ----------------
  { c: 'loc-lac', n: 'Loc Lac Poulet', p: 13.50, i: img(76), d: '' },
  { c: 'loc-lac', n: 'Loc Lac Bœuf', p: 14.50, i: img(77), d: '' },
  { c: 'loc-lac', n: 'Supplément Œuf', p: 1.00, i: emoji(78), d: '' },

  // ---------------- RIZ ----------------
  { c: 'riz', n: 'Riz Cantonnais', p: 8.00, i: img(79), d: '' },
  { c: 'riz', n: 'Riz Nature', p: 3.00, i: img(80), d: '' },
  { c: 'riz', n: 'Riz Rouge', p: 3.80, i: gif(81), d: '' },
  { c: 'riz', n: 'Riz Gluant', p: 4.80, i: img(82), d: '' },

  // ---------------- CREVETTES ----------------
  { c: 'crevettes', n: 'Crevettes Curry Vert', p: 14.90, i: img(83), d: '' },
  { c: 'crevettes', n: 'Crevettes Curry Rouge', p: 14.90, i: img(84), d: '' },
  { c: 'crevettes', n: 'Crevettes Sauce Piquante', p: 14.90, i: img(85), d: '' },
  { c: 'crevettes', n: 'Crevettes Sel Et Poivre', p: 14.90, i: img(86), d: '' },
  { c: 'crevettes', n: 'Crevettes Basilic', p: 14.90, i: img(87), d: '' },
  { c: 'crevettes', n: 'Crevettes Aux Champignons Noirs', p: 14.90, i: img(88), d: '' },

  // ---------------- SPÉCIALITÉS BŒUF (avec riz nature) ----------------
  { c: 'specialites-boeuf', n: 'Bœuf Curry Vert', p: 13.50, i: img(89), d: 'Avec riz nature' },
  { c: 'specialites-boeuf', n: 'Bœuf Curry Rouge', p: 13.50, i: img(90), d: 'Avec riz nature' },
  { c: 'specialites-boeuf', n: 'Bœuf Oignons', p: 13.50, i: img(91), d: 'Avec riz nature' },
  { c: 'specialites-boeuf', n: 'Bœuf Aux Champignons Noirs Sauce Satée', p: 14.80, i: img(92), d: 'Avec riz nature' },
  { c: 'specialites-boeuf', n: 'Bœuf Basilic', p: 13.50, i: img(93), d: 'Avec riz nature' },
  { c: 'specialites-boeuf', n: 'Filet De Bœuf', p: 19.90, i: img(94), d: 'Avec riz nature. Remplacement riz par frites sur demande.' },
  { c: 'specialites-boeuf', n: 'Tigre Qui Pleure', p: 19.90, i: img(95), d: 'Avec riz nature' },

  // ---------------- SPÉCIALITÉS POULET (avec riz nature) ----------------
  { c: 'specialites-poulet', n: 'Poulet Curry Vert', p: 12.80, i: img(96), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Curry Rouge', p: 12.50, i: img(97), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Caramel', p: 12.80, i: img(98), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Aux Champignons Noirs', p: 12.80, i: img(99), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Pané', p: 13.80, i: img(100), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Croustillant', p: 13.80, i: img(101), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Sel Et Poivre', p: 12.80, i: img(102), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Basilic', p: 12.80, i: img(103), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Sauce Aigre Douce', p: 12.80, i: img(104), d: 'Avec riz nature' },
  { c: 'specialites-poulet', n: 'Poulet Noix De Cajou', p: 12.80, i: img(105), d: 'Avec riz nature' },

  // ---------------- SPÉCIALITÉS THAÏ FOOD ----------------
  { c: 'specialites-thai', n: 'Saumon Sel Et Poivre', p: 15.90, i: img(106), d: 'Avec riz nature ou riz cantonnais en supplément +3,50 €' },
  { c: 'specialites-thai', n: 'Pavé De Saumon', p: 20.90, i: img(107), d: 'Sauce maison. Avec riz nature ou riz cantonnais en supplément +3,50 €' },
  { c: 'specialites-thai', n: 'Dorade Royale Grillée', p: 18.80, i: emoji(108), d: 'À la sauce aigre douce ou pimentée. Avec riz nature ou riz cantonnais en supplément +3,50 €' },

  // ---------------- MAKI ----------------
  { c: 'maki', n: 'M1 · Concombre', p: 5.00, i: img(109), d: '' },
  { c: 'maki', n: 'M2 · Cheese', p: 5.00, i: img(110), d: '' },
  { c: 'maki', n: 'M3 · Avocat Saumon', p: 5.50, i: img(111), d: '' },
  { c: 'maki', n: 'M4 · Avocat Saumon Cheese', p: 6.00, i: img(112), d: '' },
  { c: 'maki', n: 'M5 · Thon Cuit Mayo', p: 6.00, i: img(113), d: '' },
  { c: 'maki', n: 'M6 · Poulet Spicy', p: 6.00, i: fond(114, 'maki'), d: '' },
  { c: 'maki', n: 'M7 · Saumon Cheese', p: 6.00, i: fond(115, 'maki'), d: '' },
  { c: 'maki', n: 'M8 · Saumon', p: 6.00, i: fond(116, 'maki'), d: '' },

  // ---------------- SAUMON ROLL ----------------
  { c: 'saumon-roll', n: 'SR1 · Concombre', p: 6.50, i: img(117), d: '' },
  { c: 'saumon-roll', n: 'SR2 · Cheese', p: 7.00, i: img(118), d: '' },
  { c: 'saumon-roll', n: 'SR3 · Avocat', p: 7.00, i: img(119), d: '' },
  { c: 'saumon-roll', n: 'SR4 · Avocat Cheese', p: 7.50, i: img(120), d: '' },
  { c: 'saumon-roll', n: 'SR5 · Poulet Spicy', p: 7.50, i: fond(121, 'saumon_roll'), d: '' },
  { c: 'saumon-roll', n: 'SR6 · Thon Cuit Mayo', p: 8.00, i: fond(122, 'saumon_roll'), d: '' },
  { c: 'saumon-roll', n: 'SR7 · Tempura Cheese', p: 8.50, i: fond(123, 'saumon_roll'), d: '' },
  { c: 'saumon-roll', n: 'SR8 · Foie Gras Halal', p: 8.00, i: gif(124), d: '' },

  // ---------------- EGGS ROLL ----------------
  { c: 'eggs-roll', n: 'E1 · Concombre', p: 5.50, i: fond(125, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E2 · Avocat Saumon', p: 6.50, i: fond(126, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E3 · Cheese', p: 6.50, i: fond(127, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E4 · Poulet Spicy', p: 6.50, i: fond(128, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E5 · Avocat Saumon Cheese', p: 7.00, i: fond(129, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E6 · Thon Cuit Mayo', p: 7.00, i: fond(130, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E7 · Tempura Cheese', p: 7.00, i: fond(131, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E8 · Avocat Cheese', p: 8.00, i: fond(132, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E9 · Thon Cuit Mayo Avocat', p: 7.00, i: fond(133, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E10 · Poulet Spicy Avocat', p: 6.50, i: fond(134, 'egg_roll'), d: '' },
  { c: 'eggs-roll', n: 'E11 · Avocat Cheese', p: 7.50, i: fond(135, 'egg_roll'), d: '' },

  // ---------------- CRISPY ROLL ----------------
  { c: 'crispy-roll', n: 'CR1 · Concombre', p: 5.50, i: img(136), d: '' },
  { c: 'crispy-roll', n: 'CR2 · Avocat Saumon', p: 6.50, i: img(137), d: '' },
  { c: 'crispy-roll', n: 'CR3 · Cheese', p: 6.50, i: fond(138, 'california_frit'), d: '' },
  { c: 'crispy-roll', n: 'CR4 · Poulet Crispy', p: 6.50, i: fond(138, 'california_frit'), d: '' },
  { c: 'crispy-roll', n: 'CR5 · Avocat Saumon Cheese', p: 7.00, i: img(140), d: '' },
  { c: 'crispy-roll', n: 'CR6 · Tempura Cheese', p: 7.00, i: img(141), d: '' },
  { c: 'crispy-roll', n: 'CR7 · Thon Cuit Mayo', p: 7.00, i: img(142), d: '' },
  { c: 'crispy-roll', n: 'CR8 · Foie Gras Halal', p: 8.00, i: gif(143), d: '' },
  { c: 'crispy-roll', n: 'CR9 · Thon Cuit Mayo Avocat', p: 7.00, i: fond(144, 'california_frit'), d: '' },
  { c: 'crispy-roll', n: 'CR10 · Avocat Cheese', p: 7.00, i: fond(145, 'california_frit'), d: '' },

  // ---------------- CALIFORNIA FRITS ----------------
  { c: 'california-frits', n: 'CF1 · Avocat Saumon', p: 8.50, i: img(146), d: '' },
  { c: 'california-frits', n: 'CF2 · Thon Cuit', p: 8.50, i: img(147), d: '' },
  { c: 'california-frits', n: 'CF3 · Crevettes', p: 8.50, i: img(148), d: '' },
  { c: 'california-frits', n: 'CF4 · Poulet Spicy', p: 8.50, i: img(149), d: '' },
  { c: 'california-frits', n: 'CF5 · Tempura', p: 8.50, i: fond(150, 'california_frit'), d: '' },
  { c: 'california-frits', n: 'CF6 · Saumon Cheese', p: 8.50, i: fond(151, 'california_frit'), d: '' },

  // ---------------- ICE ROLLS ----------------
  { c: 'ice-rolls', n: 'I1 · Concombre', p: 5.50, i: fond(152, 'maki_neige'), d: '' },
  { c: 'ice-rolls', n: 'I2 · Avocat Saumon', p: 6.50, i: img(153), d: '' },
  { c: 'ice-rolls', n: 'I3 · Avocat Saumon Cheese', p: 7.00, i: img(154), d: '' },
  { c: 'ice-rolls', n: 'I4 · Cheese', p: 6.50, i: fond(155, 'maki_neige'), d: '' },
  { c: 'ice-rolls', n: 'I5 · Thon Cuit Mayo', p: 7.00, i: img(156), d: '' },
  { c: 'ice-rolls', n: 'I6 · Poulet Spicy', p: 7.00, i: img(158), d: '' },
  { c: 'ice-rolls', n: 'I7 · Avocat Cheese', p: 7.00, i: img(159), d: '' },
  { c: 'ice-rolls', n: 'I8 · Tempura Cheese', p: 7.50, i: img(160), d: '' },

  // ---------------- MAKI PRINTEMPS ----------------
  { c: 'maki-printemps', n: 'MP1 · Concombre', p: 6.50, i: img(160), d: '' },
  { c: 'maki-printemps', n: 'MP2 · Cheese', p: 6.50, i: fond(161, 'printemps_roll'), d: '' },
  { c: 'maki-printemps', n: 'MP3 · Poulet', p: 7.00, i: fond(162, 'printemps_roll'), d: '' },
  { c: 'maki-printemps', n: 'MP4 · Avocat Saumon', p: 7.50, i: img(163), d: '' },
  { c: 'maki-printemps', n: 'MP5 · Avocat Saumon Cheese', p: 8.00, i: fond(164, 'printemps_roll'), d: '' },
  { c: 'maki-printemps', n: 'MP6 · Avocat Saumon Menthe Coriandre', p: 8.00, i: img(165), d: '' },
  { c: 'maki-printemps', n: 'MP7 · Thon Cuit Mayo', p: 8.00, i: fond(166, 'printemps_roll'), d: '' },
  { c: 'maki-printemps', n: 'MP8 · Tempura Cheese', p: 8.50, i: img(167), d: '' },
  { c: 'maki-printemps', n: 'MP9 · Avocat Thon Cuit Mayo', p: 8.50, i: fond(168, 'printemps_roll'), d: '' },
  { c: 'maki-printemps', n: 'MP10 · Avocat Cheese', p: 7.50, i: fond(169, 'printemps_roll'), d: '' },

  // ---------------- CALIFORNIA ----------------
  { c: 'california', n: 'C1 · Avocat Concombre', p: 6.00, i: fond(170, 'california'), d: '' },
  { c: 'california', n: 'C2 · Avocat Saumon', p: 6.50, i: fond(171, 'california'), d: '' },
  { c: 'california', n: 'C3 · Avocat Saumon Cheese', p: 7.00, i: fond(172, 'california'), d: '' },
  { c: 'california', n: 'C4 · Avocat Cheese', p: 6.50, i: fond(173, 'california'), d: '' },
  { c: 'california', n: 'C7 · Avocat Thon Cuit Mayo', p: 7.50, i: fond(174, 'california'), d: '' },
  { c: 'california', n: 'C8 · Avocat Poulet Spicy', p: 7.00, i: img(175), d: '' },
  { c: 'california', n: 'C9 · Avocat Tempura Cheese', p: 7.50, i: fond(176, 'california'), d: '' },
  { c: 'california', n: 'C10 · Thon Cuit Mayo', p: 7.50, i: fond(177, 'california'), d: '' },

  // ---------------- AVOCATS ROLL ----------------
  { c: 'avocats-roll', n: 'A1 · Concombre', p: 8.00, i: img(178), d: '' },
  { c: 'avocats-roll', n: 'A2 · Saumon', p: 8.50, i: img(179), d: '' },
  { c: 'avocats-roll', n: 'A3 · Saumon Cheese', p: 9.00, i: fond(180, 'printemps_roll'), d: '' },
  { c: 'avocats-roll', n: 'A4 · Thon Cuit Mayo', p: 8.50, i: fond(181, 'printemps_roll'), d: '' },
  { c: 'avocats-roll', n: 'A5 · Poulet Spicy', p: 8.00, i: fond(182, 'printemps_roll'), d: '' },
  { c: 'avocats-roll', n: 'A6 · Tempura Cheese', p: 9.00, i: img(183), d: '' },
  { c: 'avocats-roll', n: 'A7 · Crevettes Cheese', p: 8.50, i: img(184), d: '' },
  { c: 'avocats-roll', n: 'A8 · Foie Gras Halal', p: 9.00, i: gif(185), d: '' },
  { c: 'avocats-roll', n: 'A9 · Cheese', p: 8.00, i: fond(186, 'printemps_roll'), d: '' },

  // ---------------- SUSHI (servis par paire) ----------------
  { c: 'sushi', n: 'S1 · Saumon', p: 4.00, i: img(187), d: 'Servis par paire' },
  { c: 'sushi', n: 'S2 · Crevettes', p: 4.00, i: img(188), d: 'Servis par paire' },
  { c: 'sushi', n: 'S3 · Saumon Avocat', p: 4.50, i: img(189), d: 'Servis par paire' },
  { c: 'sushi', n: 'S4 · Saumon Cheese', p: 4.50, i: img(190), d: 'Servis par paire' },

  // ---------------- SASHIMI ----------------
  { c: 'sashimi', n: 'SH1 · Saumon', p: 11.50, i: img(191), d: '8 pièces' },
  { c: 'sashimi', n: 'SH2 · Saumon', p: 15.00, i: img(192), d: '12 pièces' },

  // ---------------- CHIRASHI ----------------
  { c: 'chirashi', n: 'CH1 · Saumon', p: 13.00, i: img(193), d: 'Riz, avocat, ananas, edamame, salade algues.' },
  { c: 'chirashi', n: 'CH2 · Saumon Avocat', p: 14.00, i: img(194), d: 'Riz, avocat, edamame, ananas, oignons frits, concombre.' },
  { c: 'chirashi', n: 'CH3 · Saumon Avocat Cheese', p: 14.50, i: img(195), d: 'Riz, concombre, avocat, carottes, algues, pomme.' },

  // ---------------- POKÉ ----------------
  { c: 'poke', n: 'Poké Poulet', p: 12.90, i: img(196), d: 'Riz, avocat, concombre, edamame, oignons frits, pomme.' },
  { c: 'poke', n: 'Poké Tofu', p: 12.90, i: img(197), d: 'Riz, edamame, radis, avocat, mangue, concombre.' },
  { c: 'poke', n: 'Poké Thon Cuit', p: 13.90, i: img(198), d: '' },
  { c: 'poke', n: 'Poké Crevettes', p: 13.90, i: img(199), d: '' },
  { c: 'poke', n: 'Poké Bœuf', p: 14.50, i: img(200), d: '' },
  { c: 'poke', n: 'Poké Saumon', p: 14.90, i: img(201), d: '' },

  // ---------------- SPÉCIALITÉ JAPONAISE ----------------
  { c: 'specialite-japonaise', n: 'SP1 · California Frits Cheddar', p: 8.50, i: img(202), d: '' },
  { c: 'specialite-japonaise', n: 'SP2 · Saumon Rolls Braisés Avocat Cheese', p: 9.00, i: img(203), d: '' },
  { c: 'specialite-japonaise', n: 'SP3 · Saumon Rolls Braisés Tempura Cheese', p: 9.00, i: img(204), d: '' },
  { c: 'specialite-japonaise', n: 'SP4 · Saumon Rolls Braisés Poulet Spicy', p: 8.00, i: img(205), d: '' },
  { c: 'specialite-japonaise', n: 'SP5 · Saumon Rolls Braisés Thon Cuit Mayo', p: 8.50, i: img(206), d: '' },
  { c: 'specialite-japonaise', n: 'SP6 · Rolls Mango Foie Gras', p: 9.50, i: img(207), d: '' },
  { c: 'specialite-japonaise', n: 'SP7 · Rolls Mango Tempura', p: 9.50, i: img(208), d: '' },
  { c: 'specialite-japonaise', n: 'SP8 · Tiger Thon Cuit Mayo', p: 9.50, i: img(209), d: '' },
  { c: 'specialite-japonaise', n: 'SP9 · Tiger Saumon Avocat Cheese', p: 10.00, i: img(210), d: '' },
  { c: 'specialite-japonaise', n: 'SP10 · Tiger Tempura Avocat Cheese', p: 10.00, i: gif(211), d: '' },

  // ---------------- MENU JAPONAIS (servi avec soupe ou salade de chou) ----------------
  { c: 'menu-japonais', n: 'Menu Saumon', p: 14.90, i: img(212), d: '6 Sushi saumon, 6 California saumon avocat. Servi avec soupe ou salade de chou.' },
  { c: 'menu-japonais', n: 'Menu Complet Midi', p: 15.90, i: emoji(213), d: '6 California thon cuit avocat mayo, 2 sushi saumon, 1 yakitori bœuf fromage, 1 yakitori boulette de poulet, 1 yakitori poulet.' },
  { c: 'menu-japonais', n: 'Menu Saumon Thon', p: 18.90, i: emoji(214), d: '4 Sushi saumon, 6 California thon cuit mayo avocat, 6 sashimi saumon.' },
  { c: 'menu-japonais', n: 'Menu Crispy', p: 19.90, i: emoji(215), d: '6 Crispy avocat saumon cheese, 6 crispy poulet spicy, 6 crispy tempura cheese.' },
  { c: 'menu-japonais', n: 'Menu Sushi Yakitori', p: 19.90, i: emoji(216), d: '6 California saumon avocat, 4 sushi saumon, 2 yakitori bœuf fromage, 1 yakitori boulette de poulet, 1 yakitori poulet.' },
  { c: 'menu-japonais', n: 'Menu Saumon Rolls', p: 20.00, i: emoji(217), d: '6 Saumon rolls cheese, 6 saumon rolls poulet spicy, 6 saumon rolls thon cuit mayo.' },
  { c: 'menu-japonais', n: 'Menu Green', p: 20.80, i: img(218), d: '4 Sushi saumon, 6 maki printemps saumon avocat, 6 sashimi saumon.' },
  { c: 'menu-japonais', n: 'Menu Japon 40 (2 pers.)', p: 43.00, i: emoji(219), d: '8 Sushi saumon, 6 maki printemps saumon avocat, 6 california saumon avocat, 6 california thon mayo, 6 egg avocat saumon, 6 ice rolls poulet spicy, 2 big roll tempura avocat cheese.' },
  { c: 'menu-japonais', n: 'Plateau Mix (2-3 pers.)', p: 54.00, i: emoji(220), d: "5 accompagnements au choix : salade de choux, soupe miso, riz. 6 Saumon roll cheese avocat, 6 avocat roll cheese, 6 california frits saumon cheese, 6 california tempura, 6 maki crispy, 6 sashimis saumon, 3 brochettes bœuf fromage, 3 brochettes boulettes de poulet, 3 brochettes de saumon." },
  { c: 'menu-japonais', n: 'Menu 1', p: 9.80, i: emoji(221), d: '6 California saumon avocat, 2 sushi saumon.' },
  { c: 'menu-japonais', n: 'Menu 2', p: 16.50, i: emoji(222), d: '5 Sushi saumon, ice rolls thon cuit mayo.' },
  { c: 'menu-japonais', n: 'Menu 3', p: 18.80, i: emoji(223), d: '6 Saumon roll cheese, 6 ice rolls poulet spicy, 6 california saumon avocat.' },
  { c: 'menu-japonais', n: 'Menu 4', p: 22.00, i: emoji(224), d: '6 Maki printemps thon cuit mayo avocat, 6 maki printemps tempura cheese, 6 maki printemps avocat saumon.' },
  { c: 'menu-japonais', n: 'Menu 5', p: 23.80, i: emoji(225), d: '6 California avocat saumon, 6 california avocat thon mayo, 6 california avocat poulet spicy, 6 california tempura cheese.' },

  // ---------------- DESSERTS (faits maison) ----------------
  { c: 'desserts', n: 'Tiramisu', p: 4.50, i: img(226), d: 'Fait maison' },
  { c: 'desserts', n: '3 Perles De Coco', p: 4.80, i: img(227), d: '' },
  { c: 'desserts', n: 'Litchis Au Sirop', p: 4.80, i: img(228), d: '' },
  { c: 'desserts', n: 'Fondant Chocolat', p: 4.80, i: img(229), d: '' },
  { c: 'desserts', n: 'Flan Thaï Coco', p: 5.80, i: img(230), d: '' },
  { c: 'desserts', n: 'Tapioca Mangue', p: 5.20, i: img(232), d: '' },
  { c: 'desserts', n: '2 Nêms Nutella Banane', p: 5.80, i: img(233), d: '' },
  { c: 'desserts', n: '3 Mochis Glacés', p: 6.80, i: img(234), d: 'Différents parfums selon arrivage.' },
  { c: 'desserts', n: 'Gateaux Maison', p: 6.80, i: img(235), d: '' },
  { c: 'desserts', n: 'Mangue Kent Fraiche', p: 8.00, i: img(236), d: '' },
  { c: 'desserts', n: 'Riz Gluant Mangue Coco', p: 9.80, i: img(237), d: '' },
  { c: 'desserts', n: '5 Boules Aux Sésames', p: 4.50, i: img(238), d: '' },

  // ---------------- BOISSONS ----------------
  { c: 'boissons', n: 'Eau Cristalline', p: 1.00, i: img(239), d: '50 cl' },
  { c: 'boissons', n: 'Cristalline Pêche Et Fraise', p: 2.50, i: fond(251, 'boisson/boisson_sans_alcool'), d: '50 cl' },
  { c: 'boissons', n: 'Jus De Fruit Asiatique', p: 2.90, i: emoji(252), d: '25 cl' },
  { c: 'boissons', n: 'Jus De Fruit Asiatique', p: 4.90, i: emoji(253), d: '50 cl' },
  { c: 'boissons', n: 'San Pellegrino', p: 3.00, i: fond(254, 'boisson/boisson_sans_alcool'), d: '50 cl' },
  { c: 'boissons', n: 'Aloe Vera', p: 3.20, i: img(255), d: '50 cl' },
  { c: 'boissons', n: 'Red Bull', p: 4.20, i: fond(256, 'boisson/boisson_sans_alcool'), d: '25 cl' },
  { c: 'boissons', n: 'Bubble Tea', p: 4.80, i: emoji(257), d: '34 cl' },
  { c: 'boissons', n: 'Ice Tea Chinois', p: 4.00, i: img(261), d: '1,25 L' },
  { c: 'boissons', n: 'Café', p: 2.00, i: fond(263, 'boisson/photo_sur_place'), d: '' },
  { c: 'boissons', n: 'Thé', p: 2.50, i: fond(264, 'boisson/photo_sur_place'), d: '' },
  { c: 'boissons', n: 'Coca', p: 2.00, i: img(240), d: '33 cl' },
  { c: 'boissons', n: 'Coca Zéro', p: 2.00, i: img(247), d: '33 cl' },
  { c: 'boissons', n: 'Coca Cerise', p: 2.00, i: img(241), d: '33 cl' },
  { c: 'boissons', n: 'Fanta', p: 2.00, i: img(246), d: '33 cl' },
  { c: 'boissons', n: 'Sprite', p: 2.00, i: img(250), d: '33 cl' },
  { c: 'boissons', n: '7up', p: 2.00, i: img(249), d: '33 cl' },
  { c: 'boissons', n: 'Orangina', p: 2.00, i: img(245), d: '33 cl' },
  { c: 'boissons', n: 'Oasis', p: 2.00, i: img(244), d: '33 cl' },
  { c: 'boissons', n: 'Tropico', p: 2.00, i: img(248), d: '33 cl' },
  { c: 'boissons', n: 'Dada', p: 2.00, i: emoji(242), d: '33 cl' },
  { c: 'boissons', n: 'Fuze Tea', p: 2.00, i: img(243), d: '33 cl' },
  { c: 'boissons', n: 'Coca (bouteille)', p: 4.50, i: fond(258, 'boisson/boisson_sans_alcool'), d: '1,25 L' },
  { c: 'boissons', n: 'Fanta (bouteille)', p: 4.50, i: fond(259, 'boisson/boisson_sans_alcool'), d: '1,25 L' },
  { c: 'boissons', n: 'Ice Tea (bouteille)', p: 4.50, i: fond(260, 'boisson/boisson_sans_alcool'), d: '1,25 L' },
  { c: 'boissons', n: 'Oasis (bouteille)', p: 5.00, i: img(262), d: '2 L' },
];
