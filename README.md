# Thaï Food 77 — Site Next.js

Site du restaurant thaïlandais **Thaï Food 77**, construit avec **Next.js 14** (App Router) + **Tailwind CSS**.
Inclut un **dashboard administrateur** pour gérer la carte en temps réel.

## 🚀 Lancer le site (le plus simple)

Double-cliquez sur **`lancer.bat`**.

- Au premier lancement, il installe automatiquement les dépendances (quelques minutes).
- Il démarre ensuite le serveur et ouvre le site dans votre navigateur à **http://localhost:2000**.
- Pour arrêter : fermez la fenêtre noire ou appuyez sur `Ctrl + C`.

> Pré-requis : [Node.js](https://nodejs.org) doit être installé (version LTS).

```bash
npm install      # la première fois seulement
npm run dev      # démarre le serveur de développement
```

## 🔐 Dashboard administrateur

Adresse : **http://localhost:2000/admin**

| | |
|---|---|
| Identifiant | `adminthaifood` |
| Mot de passe | `meilleurthai77` |

Depuis le dashboard, vous pouvez :

- **Plats** : créer, modifier (nom, prix, image, description, badge, catégorie, ordre), masquer/afficher ou supprimer un plat. L'image peut être **une URL** ou **un fichier uploadé** depuis l'ordinateur.
- **Catégories** : créer, renommer, réordonner ou supprimer des catégories (par défaut : Entrées, Plats principaux, Desserts, Boissons).
- **Promotions** : créer une promo **en pourcentage** (ex. -20 %) ou **à prix fixe** (ex. 12 €), applicable à **tous les plats**, à **une catégorie**, ou à **un plat précis**. L'ancien prix est barré sur le site et la remise est appliquée dans le panier.
- **Paiement** : connecter le compte Stripe du restaurateur (Stripe Connect Express) et suivre son état (actif / à finaliser). *(La commission plateforme, elle, est réglée par la plateforme dans `.env.local` — voir la section « Paiement en ligne » ci-dessous.)*

> ⏱ **Temps réel** : toute modification apparaît sur le site sans rechargement (le menu se rafraîchit automatiquement toutes les 15 s et au retour sur l'onglet).

### Changer les identifiants (optionnel)

Par défaut les identifiants sont `adminthaifood` / `meilleurthai77`.
Pour les modifier, créez un fichier **`.env.local`** à la racine (voir `.env.example`) :

```
ADMIN_USERNAME=mon-nouveau-identifiant
ADMIN_PASSWORD=mon-nouveau-mot-de-passe
```

## 🏗️ Production

```bash
npm run build    # génère la version optimisée
npm run start    # démarre le serveur de production
```

## 💳 Paiement en ligne (Stripe)

Le site accepte le **paiement par carte** via **Stripe Connect Express** : le restaurateur connecte *son* compte Stripe (l'argent lui arrive directement), et une **commission plateforme** peut être prélevée automatiquement à chaque commande.

> Sans Stripe configuré, le site reste en mode **« paiement sur place / à la livraison »** : rien ne casse. Le paiement en ligne s'active dès que les clés sont en place et le compte connecté.

### 1. Clés Stripe (compte plateforme)

Il vous faut un **compte Stripe plateforme** (le vôtre) avec **Stripe Connect activé**. Dans un fichier **`.env.local`** à la racine (voir `.env.example`) :

```
STRIPE_SECRET_KEY=sk_test_...              # clé secrète (test d'abord, live ensuite)
STRIPE_WEBHOOK_SECRET=whsec_...            # secret du webhook (étape 3)
PLATFORM_COMMISSION_PERCENT=5             # votre commission plateforme (%) — 0 = aucune
```

Relancez ensuite le serveur.

### 2. Connecter le compte restaurateur

Onglet **Paiement** du dashboard (`/admin`) → **« Connecter mon compte Stripe »**. Le restaurateur est guidé par Stripe (coordonnées bancaires, KYC). Une fois validé, le statut passe à **Actif**.

> 💡 **Commission plateforme** : elle se règle dans `.env.local` (`PLATFORM_COMMISSION_PERCENT`, ex. `5` pour 5 %, `0` pour ne rien prendre), car c'est votre réglage à vous (la plateforme) — pas celui du restaurateur. Le dashboard ne l'affiche donc pas.

### 3. Webhook (indispensable)

Le webhook Stripe confirme les paiements (sinon la page de commande reste « en cours »).

- **En local** : installez le [Stripe CLI](https://stripe.com/docs/stripe-cli), puis dans un terminal :
  ```bash
  stripe listen --forward-to localhost:2000/api/stripe/webhook
  ```
  Recopiez le `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET` (`.env.local`) et relancez le serveur.
- **En production** : créez un endpoint de webhook dans le dashboard Stripe (URL `https://votre-domaine/api/stripe/webhook`, événements au moins `checkout.session.completed`, `payment_intent.payment_failed`, `account.updated`) et reportez son secret dans `STRIPE_WEBHOOK_SECRET`.

### 4. Tester puis passer en production

- **Test** : avec les clés `sk_test_…`, payez sur le site avec la carte `4242 4242 4242 4242` (date future, CVC quelconque). Vérifiez dans le dashboard Stripe : la commission est prélevée par la plateforme, le reste au restaurateur.
- **Production** : remplacez les clés `sk_test_…` / `whsec_…` par les clés **live**, et reconnectez/validez le compte restaurateur si nécessaire.

> ⚠️ **Modèle plateforme** : avec Stripe Connect, c'est **votre compte plateforme** qui déclenche chaque paiement. Si vous arrêtez d'héberger le site, le restaurateur doit reconnecter son compte (Stripe le détache de votre plateforme). Son argent déjà versé reste à lui.

## 📁 Structure du projet

```
thai food/
├── app/
│   ├── layout.js            # Structure HTML, polices, script Iconify
│   ├── page.js              # Page publique (assemble les sections)
│   ├── commande/page.js     # 🟠 Confirmation après paiement Stripe
│   ├── globals.css          # Styles
│   ├── admin/page.js        # 🟠 Page du dashboard admin (/admin)
│   └── api/                 # 🟠 Routes API (auth, menu, CRUD admin, upload, stripe)
├── components/
│   ├── Navbar / Hero / Histoire / Commander / Reserver / Avis / Footer / Cart
│   ├── Checkout.js / OrderSuccess.js
│   ├── CartContext.js       # État du panier + tunnel de commande
│   ├── useMenu.js           # 🟠 Récupération du menu (temps réel, Firebase-ready)
│   ├── useReveal.js / Img.js
│   └── admin/               # 🟠 Interface du dashboard (AdminApp, managers, StripeManager, UI)
├── lib/                     # 🟠 Cœur métier
│   ├── store.js             # 🟠 Accès aux données (Firebase-ready)
│   ├── orders.js            # 🟠 Commandes + statuts paiement Stripe
│   ├── stripe.js            # 🟠 Client Stripe (compte plateforme)
│   ├── settings.js          # 🟠 Réglages paiement (compte connecté, commission)
│   ├── auth.js              # 🟠 Authentification admin
│   └── pricing.js           # 🟠 Calcul des prix / promos
├── data/menu.json           # 🟠 Données de la carte (plats, catégories, promos)
├── data/orders.json         # 🟠 Commandes (généré à la 1ʳᵉ commande)
├── data/settings.json       # 🟠 Réglages paiement Stripe (généré à la connexion)
├── public/uploads/          # 🟠 Images uploadées depuis le dashboard
├── lancer.bat               # Lance le site sur localhost
└── package.json
```

## 🔥 Firebase (Firestore + Storage)

Les données (plats, catégories, promos, commandes, réglages Stripe) sont stockées dans **Firestore**, et les photos des plats dans **Cloud Storage**. C'est **obligatoire en production** sur Vercel (serverless = pas de disque persistant, les fichiers locaux seraient perdus).

### 1. Configurer le projet Firebase
- Créez un projet (ex. `thaifood77`). Activez **Firestore Database** et **Storage** (Storage nécessite le plan **Blaze**).
- ⚙️ *Paramètres du projet → Comptes de service → SDK Admin Firebase → Générer une nouvelle clé privée* → fichier `.json`.
- Dans `.env.local` (et sur Vercel) : `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (collez la valeur `private_key` du `.json` **en gardant les `\n`**).

### 2. Règle Storage (lecture publique)
Pour que les photos s'affichent sur le site, mettez les **règles Storage** en lecture publique :
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    allow read: if true;       // lecture publique (images du menu)
    allow write: if false;     // écritures par le serveur uniquement (le SDK Admin contourne les règles)
  }
}
```

### 3. Importer le menu existant (une fois)
Depuis le dossier `thaifood/` :
```
node --env-file=.env.local scripts/seed-firebase.mjs
```
(Nécessite Node 20.6+ pour `--env-file`. Importe `data/menu.json` dans Firestore. Fallback : tant que Firestore est vide, le site affiche le menu embarqué.)

### 4. Production (Vercel)
Ajoutez les **mêmes** variables d'environnement Firebase dans les **paramètres Vercel** (Settings → Environment Variables). Le déploiement lit Firestore/Storage automatiquement.

## ✨ Fonctionnalités

- 🛒 Panier complet (ajout, quantités, suppression, total, confirmation)
- 💳 Paiement en ligne par carte (Stripe Connect Express, commission plateforme optionnelle)
- 📅 Formulaire de réservation avec confirmation
- 📱 Menu mobile + design responsive
- 🎬 Animations au défilement
- ⭐ Carrousel d'avis clients
- 🟠 Dashboard admin temps réel (plats, catégories, promos)
