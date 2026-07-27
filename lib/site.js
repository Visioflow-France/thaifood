import { getDb } from './firebase-admin';

// ============================================================================
//  INFOS DU SITE — téléphone (bandeau « commander par téléphone ») + mentions
//  légales. Stockés dans Firestore (collection `config`, document `site`),
//  éditables depuis le dashboard (onglet « Informations »).
// ============================================================================

const COL = 'config';
const DOC = 'site';

// Mentions légales complètes par défaut (millésimées 2026). Le restaurateur
// peut tout personnaliser depuis le dashboard (SIRET, directrice de publication,
// hébergeur réel, etc.).
const DEFAULT_LEGAL = `# Mentions légales

Dernière mise à jour : 2026

## 1. Éditeur du site
Le présent site est édité par : Thaï Food 77
Adresse : 12 Avenue de la République, 77340 Pontault-Combault
Téléphone : à renseigner
E-mail : contact@thaifood77.fr
Forme juridique : [à préciser] — SIRET : [à renseigner]

## 2. Responsable de publication
[Nom du responsable de la publication]

## 3. Hébergement
Le site est hébergé par : Vercel Inc.
Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
Site : https://vercel.com

## 4. Propriété intellectuelle
L'ensemble des contenus présents sur ce site (textes, images, logo, charte
graphique) est la propriété de Thaï Food 77, sauf mention contraire. Toute
reproduction, représentation ou diffusion, totale ou partielle, sans
autorisation écrite préalable est interdite.

## 5. Données personnelles (RGPD)
Les informations collectées via les formulaires (commande, contact) servent
uniquement au traitement des demandes et à la gestion client. Elles ne sont
jamais cédées à des tiers. Conformément au RGPD, vous disposez d'un droit
d'accès, de rectification et de suppression de vos données. Pour l'exercer,
contactez-nous à l'e-mail ci-dessus.

## 6. Cookies
Ce site peut utiliser des cookies techniques nécessaires à son fonctionnement.
Aucun cookie publicitaire ni de tracking commercial n'est utilisé.

## 7. Crédits
Site développé et maintenu par la plateforme d'hébergement.
Photos à but illustratif.

## 8. Droit applicable
Le présent site et ses mentions légales sont soumis au droit français. Tout
litige relèvera de la compétence des tribunaux français.

© 2026 Thaï Food 77. Tous droits réservés.`;

const DEFAULTS = {
  phone: '',
  legal: DEFAULT_LEGAL,
};

export async function getSiteInfo() {
  const snap = await getDb().collection(COL).doc(DOC).get();
  if (!snap.exists) return { ...DEFAULTS };
  return { ...DEFAULTS, ...snap.data() };
}

export async function saveSiteInfo(patch = {}) {
  const ref = getDb().collection(COL).doc(DOC);
  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  return { ...DEFAULTS, ...snap.data() };
}
