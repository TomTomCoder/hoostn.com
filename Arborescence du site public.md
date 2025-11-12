# Arborescence du site public Hoostn.com

### 🎯 Objectif

Définir la structure des pages publiques pour le référencement (SEO) et la conversion (acquisition propriétaires & conciergeries).

---

## 🌐 Structure globale

```
/
├── Accueil
│   ├── Hero (réservation + CTA inscription Propriétaire)
│   ├── Avantages ("Gérez tous vos logements depuis un seul tableau de bord")
│   ├── Démo interface / capture produit
│   ├── Témoignages
│   ├── Call-to-action : "Essai gratuit 14 jours"
│   └── Footer (CGU, Confidentialité, Contact)
│
├── Explorer
│   ├── /explorer
│   ├── /ville/[slug] → pages SSR : Paris, Lyon, Marseille…
│   ├── /ville/[slug]/[quartier] → SEO quartier (ex : /paris/11e)
│   └── /lot/[slug] → Fiche logement
│
├── Propriétaires / Gestionnaires
│   ├── /proprietaires
│   ├── /agences
│   ├── /conciergeries
│   ├── /tarifs
│   └── /demo (page d’inscription + vidéo démo)
│
├── À propos
│   ├── /a-propos
│   ├── /contact
│   ├── /carriere
│   └── /presse
│
├── Ressources
│   ├── /blog
│   ├── /guides (SEO & formation propriétaires)
│   ├── /faq
│   └── /support
│
└── Légal
    ├── /cgu
    ├── /confidentialite
    ├── /mentions-legales
    ├── /cookies
    └── /cgv
```

---

## ⚙️ Pages dynamiques SEO

* `/ville/[slug]` : pages SSR (Paris, Lyon, Annecy, Biarritz…) avec carte, filtre et liens vers les lots.
* `/ville/[slug]/[quartier]` : ciblage long tail SEO.
* `/lot/[slug]` : fiche logement, balises `LodgingBusiness` + `Offer`.
* `/proprietaires` : landing page optimisée conversion B2B.
* `/tarifs` : structure SaaS claire + comparaison plans.

---

# `/docs/marketing/6.2_textes_seo.md` — Textes SEO (Titres, Meta, CTA)

### 🏠 Accueil

* **Title :** Hoostn – Gérer vos locations saisonnières, simplement.
* **Meta description :** Centralisez vos réservations Airbnb et Booking, gérez vos paiements, vos calendriers et vos équipes depuis une seule interface.
* **CTA principal :** “Essai gratuit 14 jours – Sans carte de crédit.”

### 🧭 Explorer

* **Title :** Réservez votre prochain séjour avec Hoostn.
* **Meta description :** Découvrez les meilleurs logements vérifiés sur Hoostn, avec des calendriers mis à jour en temps réel et un support 24/7.

### 🏢 Propriétaires

* **Title :** Solution SaaS pour propriétaires et conciergeries – Hoostn.
* **Meta description :** Simplifiez la gestion de vos biens, automatisez vos réservations et communiquez efficacement avec vos voyageurs.
* **CTA :** “Essayer gratuitement” / “Voir la démo”.

### 🧑‍💼 À propos

* **Title :** L’équipe Hoostn – Simplifier la gestion locative.
* **Meta description :** Hoostn, une startup française dédiée à la modernisation de la gestion locative courte durée avec l’IA et l’automatisation.

### 📰 Blog

* **Title :** Blog Hoostn – Conseils, tendances et outils pour les hôtes.
* **Meta description :** Suivez les dernières actualités du marché de la location saisonnière et nos tutoriels pour maximiser vos revenus.

---

### 🔗 Call-to-actions types

| Contexte          | CTA principal                             |
| ----------------- | ----------------------------------------- |
| Page accueil      | “Essai gratuit 14 jours”                  |
| Page propriétaire | “Planifiez une démo personnalisée”        |
| Blog / guide      | “Essayez Hoostn gratuitement”             |
| Confirmation      | “Invitez votre première équipe de ménage” |

---

# `/docs/marketing/6.3_strategie_seo_sea.md` — Stratégie SEO / SEA

### 🎯 Objectif

Positionner **Hoostn** comme solution SaaS de référence en **gestion locative saisonnière** sur le marché francophone et européen.

---

## 🧩 SEO – Pilier 1 : Contenu & structure

| Axe                      | Détail                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Pages ville/quartier** | SSR avec cartes, photos et descriptions locales.                                                |
| **Contenu evergreen**    | Guides propriétaires, fiscalité Airbnb, checklists ménage, automatisation.                      |
| **Articles blog**        | “Top 10 outils de conciergerie”, “Tarification dynamique : comment l’IA optimise vos revenus ?” |
| **Backlinks**            | Partenariats OTA, comparateurs SaaS, blogs immobiliers.                                         |
| **Schema.org**           | `LodgingBusiness`, `SoftwareApplication`, `Offer`.                                              |
| **Core Web Vitals**      | <1,5 s LCP – optimisation Vercel Edge.                                                          |

---

## 💰 SEA – Pilier 2 : Acquisition payante

| Canal        | Campagne                                                        | Ciblage                        | Budget initial |
| ------------ | --------------------------------------------------------------- | ------------------------------ | -------------- |
| Google Ads   | Mots-clés “logiciel gestion Airbnb”, “conciergerie automatisée” | FR / BE / CH / CA              | 1 000 €/mois   |
| Meta Ads     | Vidéos démo + témoignages                                       | Hôtes Airbnb / Booking         | 500 €/mois     |
| LinkedIn Ads | Conciergeries et agences                                        | Ciblage entreprises 2–100 lots | 500 €/mois     |

### KPIs SEO/SEA

* CTR ≥ 5 %
* CAC cible : < 15 €
* Taux de conversion landing : > 10 %
* Domain Authority : +30 en 6 mois

---

## 📈 Blog strategy

1. Publication hebdo (optimisée pour mots-clés longue traîne).
2. Ton : expert mais accessible, aligné avec IA et automatisation.
3. Signature : “Rédaction Hoostn • Powered by Data & Hospitality”.
4. CTA en fin d’article : “Testez Hoostn gratuitement”.

---

# `/docs/branding/6.4_identite_visuelle.md` — Identité visuelle

### 🎯 Objectif

Donner à Hoostn une identité cohérente, moderne, inspirée de la confiance, de la technologie et de la simplicité.

---

## 🔵 Palette principale

| Couleur             | Code HEX  | Usage                             |
| ------------------- | --------- | --------------------------------- |
| **Bleu Hoostn**     | `#1F3A8A` | Couleur principale (CTA, boutons) |
| **Bleu clair**      | `#3B82F6` | Liens et hover                    |
| **Gris clair**      | `#F3F4F6` | Arrière-plans neutres             |
| **Gris texte**      | `#374151` | Texte secondaire                  |
| **Blanc pur**       | `#FFFFFF` | Fond principal                    |
| **Vert validation** | `#22C55E` | Succès / paiements                |
| **Rouge alerte**    | `#DC2626` | Erreurs / annulations             |

---

## ✍️ Typographies

* **Titres :** Inter / Bold 700
* **Texte :** Inter / Regular 400
* **Accent / chiffres :** Space Grotesk (facultatif)
* **Fallback :** system-ui, sans-serif

---

## 🔤 Logo & symbolique

* Logo texte : `hoostn` (minuscule, police sans-serif arrondie).
* Icône : forme de maison stylisée + point central (symbole de “connexion”).
* Favicon : `H` stylisé bleu.
* Usage : fond blanc ou bleu uniquement.

---

## 💡 Ton & style visuel

* Minimaliste, sans surcharge graphique.
* Beaucoup d’espace blanc, tons doux.
* Illustrations vectorielles (type undraw / 3D light).
* Accent sur la **clarté et la fluidité**.
* Animations Framer Motion discrètes (fade/slide).

---

# `/docs/branding/6.5_kit_media_pitchdeck.md` — Kit média & Pitch Deck

### 🎯 Objectif

Proposer un **kit de communication** pour partenaires, investisseurs et OTA (Airbnb, Booking).

---

## 📂 Contenu du Kit Média

| Type              | Fichier                                       | Description                            |
| ----------------- | --------------------------------------------- | -------------------------------------- |
| Logo principal    | `logo-hoostn.svg`                             | Version couleur et monochrome          |
| Favicon           | `favicon-hoostn.ico`                          | Adapté PWA                             |
| Palette           | `hoostn-colors.json`                          | Fichier variables Tailwind             |
| Mockups           | `hoostn-app-dashboard.png`, `hoostn-chat.png` | Captures haute résolution              |
| Typographie       | `Inter.zip`, `SpaceGrotesk.zip`               | Polices libres de droits               |
| Communiqué presse | `press_release_hoostn_2025.pdf`               | Positionnement produit                 |
| Pitch Deck        | `hoostn_pitchdeck_2025.pdf`                   | Présentation investisseurs (10 slides) |

---

## 📊 Contenu du pitch deck

| Slide | Titre          | Contenu clé                                                                               |
| ----- | -------------- | ----------------------------------------------------------------------------------------- |
| 1     | Vision         | Simplifier et automatiser la location saisonnière.                                        |
| 2     | Problème       | Propriétaires perdent du temps avec Airbnb/Booking multiples.                             |
| 3     | Solution       | Hoostn : un tableau de bord unique + IA + automatisation.                                 |
| 4     | Marché         | +6M hôtes Airbnb / Booking dans l’UE.                                                     |
| 5     | Produit        | Capture UI + workflows automatisés.                                                       |
| 6     | Business model | SaaS à 10€/lot/mois + options IA.                                                         |
| 7     | Traction       | Objectif : 2 000 lots actifs à 24 mois.                                                   |
| 8     | Équipe         | Fondateurs (Tommy Lambert & associés).                                                    |
| 9     | Roadmap        | V1 (2025), IA Pricing & Mobile Web (2026).                                                |
| 10    | Contact        | [contact@hoostn.com](mailto:contact@hoostn.com) – [www.hoostn.com](http://www.hoostn.com) |

