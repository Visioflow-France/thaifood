import { getDb, hasFirebaseConfig } from './firebase-admin';

// ============================================================================
//  INFOS DU SITE — téléphone (bandeau « commander par téléphone »), mentions
//  légales (page /mentions-legales) + informations légales structurées
//  (SIRET, RCS, hébergeur…). Stockés dans Firestore (collection `config`,
//  document `site`), éditables depuis le dashboard (onglet « Informations »).
// ============================================================================

const COL = 'config';
const DOC = 'site';

// ----------------------------------------------------------------------------
//  Champs structurés (modifiables depuis le dashboard). Sert à générer le
//  texte des mentions légales (modèle 2026) tout en restant entièrement
//  éditable à la main ensuite.
// ----------------------------------------------------------------------------
const DEFAULT_LEGAL_FIELDS = {
  companyName: 'Thaï Food 77',
  legalForm: '', // ex : SARL, SAS, EI (auto-entrepreneur)
  siret: '',
  rcs: '', // ex : RCS Melun B 123 456 789
  capitalSocial: '', // ex : 5 000 €
  tvaIntracom: '', // ex : FR 12 345678901
  streetAddress: '142 Avenue Charles Rouxel',
  postalCode: '77340',
  city: 'Pontault-Combault',
  email: 'pad.77thai@gmail.com',
  publicationDirector: '', // nom du responsable de publication
  hostName: 'Cloudflare, Inc.',
  hostAddress: '101 Townsend Street, San Francisco, CA 94107, États-Unis',
  hostUrl: 'https://www.cloudflare.com',
};

// Affiche la valeur ou un marqueur « à renseigner » bien visible.
const f = (v) => (String(v || '').trim() ? String(v).trim() : '[à renseigner]');

// Ligne "Libellé : valeur" uniquement si la valeur est renseignée.
const line = (label, v) => {
  const val = String(v || '').trim();
  return val ? `${label} : ${val}` : '';
};

// Génère un texte de mentions légales complet et conforme (RGPD / ePrivacy /
// LCEN), à jour pour 2026, à partir des champs structurés.
export function buildLegalMarkdown(fields = {}) {
  const g = { ...DEFAULT_LEGAL_FIELDS, ...(fields || {}) };
  const addressParts = [g.streetAddress, [g.postalCode, g.city].filter(Boolean).join(' ')].filter(Boolean);

  const editorLines = [
    f(g.companyName) !== '[à renseigner]' && g.legalForm
      ? `${g.companyName} (${g.legalForm})`
      : f(g.companyName),
    addressParts.length ? addressParts.join(', ') : '[adresse à renseigner]',
    g.phone || g.email ? line('Contact', [g.phone, g.email].filter(Boolean).join(' · ') || null) : '',
    [line('SIRET', g.siret), line('RCS', g.rcs), line('Capital social', g.capitalSocial), line('TVA intracommunautaire', g.tvaIntracom)]
      .filter(Boolean)
      .join(' · '),
  ].filter(Boolean);

  return `# Mentions légales

Année d'édition : 2026

## 1. Éditeur du site
Le présent site internet est édité par :
${editorLines.map((l) => `- ${l}`).join('\n')}

## 2. Directeur / Directrice de la publication
${f(g.publicationDirector)}

## 3. Hébergement
Le site est hébergé par : ${f(g.hostName)}
${g.hostAddress ? `Adresse : ${g.hostAddress}` : ''}
${g.hostUrl ? `Site web : ${g.hostUrl}` : ''}

## 4. Propriété intellectuelle
L'ensemble des éléments présents sur ce site (textes, visuels, photographies,
logo, charte graphique, mise en page) est, sauf mention contraire, la propriété
exclusive de ${f(g.companyName)}. Toute reproduction, représentation,
modification, publication ou adaptation, totale ou partielle, quel que soit le
procédé ou le support, est interdite sans autorisation écrite préalable.

## 5. Données personnelles & RGPD
${f(g.companyName)}, en tant que responsable de traitement, est susceptible de
collecter des données à caractère personnel via les formulaires du site
(commande en ligne, prise de contact) : nom, prénom, coordonnées
téléphoniques et postales, adresse e-mail.

Finalités : traitement et suivi des commandes, gestion de la relation client et
préparation des repas commandés (livraison ou retrait sur place). La base
légale est l'exécution du contrat et, le cas échéant, le consentement.
Destinataires : les données sont destinées aux services internes de
${f(g.companyName)} et, pour la seule exécution de la commande (ex. paiement,
livraison), à ses prestataires techniques (Stripe pour les paiements, service
de livraison). Elles ne font l'objet d'aucune cession commerciale à des tiers.

Durée de conservation : les données sont conservées le temps strictement
nécessaire au traitement de la commande, puis archivées pour la durée des
obligations légales comptables (10 ans), avant suppression définitive.

Conformément au Règlement Général sur la Protection des Données (RGPD) et à la
loi Informatique et Libertés, vous disposez d'un droit d'accès, de
rectification, d'effacement, de limitation, d'opposition et de portabilité de
vos données. Pour les exercer, écrivez à ${f(g.email)} en justifiant de votre
identité. Vous pouvez également introduire une réclamation auprès de la CNIL
(www.cnil.fr).

## 6. Cookies & traceurs
Ce site utilise des cookies strictement nécessaires à son fonctionnement
(mémorisation du panier de commande) ainsi que, le cas échéant, des traceurs
déposés par des tiers (paiement Stripe). Aucun cookie publicitaire ou de
profiling commercial n'est utilisé. Vous pouvez à tout moment configurer ou
désactiver ces traceurs depuis les réglages de votre navigateur.

## 7. Conditions de commande
Les prix sont indiqués en euros, toutes taxes comprises (TTC). Le paiement peut
être effectué en ligne, de manière sécurisée via Stripe, ou sur place / à la
livraison selon les options proposées. Les commandes sont préparées à la
demande ; le retrait s'effectue à l'adresse du restaurant et la livraison dans
la zone desservie. En validant une commande, vous reconnaissez avoir pris
connaissance des présentes conditions.

## 8. Droit applicable
Le présent site et ses mentions légales sont soumis au droit français. Tout
litige relèvera, à défaut de résolution amiable, de la compétence des
tribunaux français.

© 2026 ${f(g.companyName)}. Tous droits réservés.`;
}

// Texte par défaut affiché tant que rien n'a été personnalisé.
const DEFAULT_LEGAL = buildLegalMarkdown(DEFAULT_LEGAL_FIELDS);

// Horaires d'ouverture par défaut — clés = getDay() (0=dim, 1=lun, … 6=sam).
// Tableau vide / absent = fermé ce jour-là.
const DEFAULT_HOURS = {
  1: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:00' }], // lundi
  2: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:00' }], // mardi
  3: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:00' }], // mercredi
  4: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:00' }], // jeudi
  5: [{ open: '11:30', close: '14:00' }, { open: '18:30', close: '22:30' }], // vendredi
  6: [{ open: '18:30', close: '22:30' }], // samedi
  0: [{ open: '12:00', close: '22:00' }], // dimanche
};

// Réseaux sociaux principaux (URL complètes). Vide = non affiché.
const DEFAULT_SOCIALS = {
  instagram: '',
  facebook: '',
  tiktok: '',
  tripadvisor: '',
};

// Contenu éditable de la page d'accueil (photos + chef). Vide = valeur codée.
const DEFAULT_CONTENT = {
  heroImage: '',
  chefName: '',
  chefRole: '',
  chefPhoto: '',
  storyTitle: '',
  storyText1: '',
  storyText2: '',
  sinceYear: '',
  histoireImages: ['', '', '', ''],
};

const DEFAULTS = {
  phone: '',
  legal: DEFAULT_LEGAL,
  legalFields: { ...DEFAULT_LEGAL_FIELDS },
  hours: DEFAULT_HOURS,
  socials: { ...DEFAULT_SOCIALS },
  content: { ...DEFAULT_CONTENT },
};

export async function getSiteInfo() {
  // Résilient : sans Firebase (dev sans .env, clé invalide, quota…), on sert
  // les valeurs par défaut plutôt que de faire planter la page / le dashboard.
  try {
    const snap = await getDb().collection(COL).doc(DOC).get();
    if (!snap.exists) return { ...DEFAULTS };
    return { ...DEFAULTS, ...snap.data() };
  } catch (e) {
    console.error('[site] lecture impossible, valeurs par défaut :', e?.details || e?.message);
    return { ...DEFAULTS };
  }
}

export async function saveSiteInfo(patch = {}) {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase n'est pas configuré (FIREBASE_PRIVATE_KEY manquant ou invalide) : enregistrement impossible.");
  }
  const ref = getDb().collection(COL).doc(DOC);
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return { ...DEFAULTS, ...snap.data() };
}
