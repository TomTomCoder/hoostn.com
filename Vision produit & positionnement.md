# Vision produit & positionnement

### 🎯 Mission

**Simplifier et automatiser la gestion locative saisonnière** pour permettre aux propriétaires, conciergeries et agences d’optimiser leur rentabilité tout en offrant une expérience fluide aux voyageurs.

### 💡 Proposition de valeur

> “Un seul tableau de bord pour gérer vos réservations, vos tarifs et vos clients, sur toutes les plateformes.”

### 🧑‍💼 Cibles principales

1. **Propriétaires individuels** (1–3 biens) : besoin de centralisation et gain de temps.
2. **Conciergeries / gestionnaires multi-biens** : besoin de performance et d’automatisation.
3. **Agences premium** : besoin de contrôle de la qualité et reporting avancé.

### ⚙️ Problèmes résolus

* Doubles réservations, synchronisation lente.
* Manque de visibilité sur la performance des biens.
* Communication client fragmentée entre plateformes.
* Absence de tarification dynamique centralisée.

### 🚀 Différenciation

| Facteur                                      | Hoostn          | Lodgify      | Guesty | Beds24 |
| -------------------------------------------- | --------------- | ------------ | ------ | ------ |
| Synchronisation instantanée (Airbnb/Booking) | ✅               | ✅            | ✅      | ✅      |
| Interface moderne & mobile web               | ✅               | ⚠️ (desktop) | ✅      | ⚠️     |
| Chat IA contextualisé + HITL                 | 🟢 Unique       | ❌            | ❌      | ❌      |
| Tarification IA dynamique                    | 🔜              | ⚠️ basique   | ✅      | ⚠️     |
| SMS info-only intégrés                       | ✅               | ❌            | ⚠️     | ❌      |
| API publique                                 | ✅ Supabase REST | ⚠️ partielle | ✅      | ✅      |

### 💰 Modèle économique

* **SaaS mensuel / par lot actif** (10 €/mois/lot).
* Formule gratuite (1 lot – fonctionnalités limitées).
* Upsells futurs : tarification IA, extension OTA, assurances, outils compta.

---

## 💼 `1.2_business_model_canvas.md` — Business Model Canvas Hoostn

| Bloc                        | Description                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| **Segments clients**        | Propriétaires individuels, conciergeries, agences immobilières, gestionnaires multi-biens. |
| **Proposition de valeur**   | Plateforme tout-en-un : synchronisation, communication, automatisation, IA et analytics.   |
| **Canaux**                  | SEO (pages ville/quartier), partenariats OTA, contenu YouTube/LinkedIn, bouche-à-oreille.  |
| **Relations clients**       | Chat IA + support humain (HITL), onboarding guidé, centre d’aide interactif.               |
| **Sources de revenus**      | Abonnement mensuel (10 €/lot), commissions API, options premium (IA pricing, nettoyage).   |
| **Ressources clés**         | Stack Next-Forge (Next.js + Supabase), intégrations Airbnb/Booking, IA conversationnelle.  |
| **Activités clés**          | Développement, support client, marketing digital, partenariats OTA/conciergeries.          |
| **Partenaires clés**        | Stripe (paiements), Twilio (SMS), Booking.com & Airbnb (API), OpenRouter & Gemini (IA).    |
| **Structure de coûts**      | Hébergement (Vercel + Supabase), IA API, support, marketing, RGPD/assurance.               |
| **Indicateurs clés (KPIs)** | Taux de conversion, MRR, churn, satisfaction client (NPS), taux d’occupation agrégé.       |

---

## 🧩 `1.3_benchmark_concurrentiel.md` — Benchmark concurrentiel

| Solution             | Cible                           | Tarif moyen/mois | Synchronisation         | Tarification dynamique | API | Chat client | IA               | Interface          |
| -------------------- | ------------------------------- | ---------------- | ----------------------- | ---------------------- | --- | ----------- | ---------------- | ------------------ |
| **Hoostn (France)**  | Conciergeries / Agences         | 10 €/lot         | Instant (Supabase Sync) | IA (Gemini/OpenRouter) | ✅   | ✅           | ✅ contextualisée | Next-Forge moderne |
| **Lodgify**          | Propriétaires / petites agences | ~30 €/lot        | iCal (toutes 15 min)    | ⚠️ basique             | ❌   | ✅           | ❌                | UI moyenne         |
| **Guesty**           | Agences internationales         | 100 €/lot        | API OTA directe         | ✅                      | ✅   | ✅           | ⚠️ générique     | Très pro           |
| **Beds24**           | Gestionnaires techniques        | 8–12 €/lot       | iCal/API                | ⚠️ manuel              | ✅   | ❌           | ❌                | Interface datée    |
| **Hostaway**         | Conciergeries 50+ lots          | sur devis        | API OTA                 | ✅                      | ✅   | ✅           | ⚠️ basique       | Corporate          |
| **Booking Sync**     | Pro / PME                       | 25 €/lot         | API OTA                 | ✅                      | ✅   | ✅           | ❌                | claire             |
| **Smily (Ex-Louki)** | PME                             | 20 €/lot         | iCal                    | ❌                      | ⚠️  | ✅           | ❌                | simpliste          |

### Synthèse

**Forces de Hoostn** : modernité, IA intégrée, flexibilité pricing, stack dev récente, UX premium.
**Opportunité** : segment “conciergerie 5–50 lots”, sous-équipé mais rentable.

---

## 📈 `1.4_strategie_produit.md` — Product Strategy Brief

### Vision long terme (2026–2028)

> Devenir la solution SaaS européenne de référence pour la gestion intelligente de locations saisonnières connectées à l’IA.

### Objectifs à 12 mois

| Axe            | KPI                                               | Cible   |
| -------------- | ------------------------------------------------- | ------- |
| **Adoption**   | 500 lots actifs                                   | 2026 Q2 |
| **Rétention**  | 90 % sur 6 mois                                   |         |
| **Support IA** | 80 % des messages clients traités automatiquement |         |
| **Revenus**    | 50 k €/MRR                                        |         |
| **NPS**        | ≥ +60                                             |         |

### Roadmap macro

| Trimestre    | Objectifs clés                                                     |
| ------------ | ------------------------------------------------------------------ |
| **T1 (MVP)** | Intégrations Airbnb/Booking + Réservation directe + Stripe Connect |
| **T2**       | Chat IA + HITL + App mobile web                                    |
| **T3**       | Module nettoyage / techniciens + Analytics Pro                     |
| **T4**       | Tarification dynamique IA + Multi-langues + SEO villes/quartiers   |

### Piliers de succès

1. **Expérience utilisateur** : simplicité, vitesse, responsive.
2. **IA fiable** : contextualisée, supervisée (human-in-the-loop).
3. **Écosystème ouvert** : API publique, intégrations tierces.
4. **Confiance RGPD** : conformité, hébergement UE, sécurité.

---

## 👥 `1.5_buyer_personas.md` — Buyer Personas

### Persona 1 — *Claire*, propriétaire solo

| Élément           | Détail                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Âge / profil      | 38 ans, propriétaire d’un appartement à Biarritz                               |
| Objectif          | Louer sans dépendre totalement d’Airbnb                                        |
| Pain points       | Gestion manuelle des messages, peur des erreurs de calendrier                  |
| Ce qu’elle attend | Interface simple, notifications, SMS, IA rassurante                            |
| Argument clé      | “Hoostn gère vos réservations pendant que vous profitez de votre temps libre.” |

---

### Persona 2 — *Antoine*, conciergerie 20 lots

| Élément         | Détail                                                          |
| --------------- | --------------------------------------------------------------- |
| Âge / profil    | 32 ans, entrepreneur conciergerie à Annecy                      |
| Objectif        | Centraliser, automatiser, monitorer les équipes ménage          |
| Pain points     | Double saisie, multi-comptes OTA, complexité communication      |
| Ce qu’il attend | Planning clair, dashboards revenus, synchronisation instantanée |
| Argument clé    | “Gagnez 2 heures par jour sur la gestion de vos biens.”         |

---

### Persona 3 — *Sophie*, directrice d’agence premium

| Élément           | Détail                                                              |
| ----------------- | ------------------------------------------------------------------- |
| Âge / profil      | 45 ans, gère 50 + biens haut de gamme                               |
| Objectif          | Fiabilité, reporting, image professionnelle                         |
| Pain points       | Multiplicité d’outils, absence de reporting consolidé               |
| Ce qu’elle attend | Dashboard multi-biens, modules IA & reporting, facturation          |
| Argument clé      | “Une plateforme élégante et performante à l’image de votre marque.” |

