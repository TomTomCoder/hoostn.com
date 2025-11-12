# Prévisionnel financier (12–24 mois)

### Hypothèses de base

| Élément                                      | Hypothèse                                 |
| -------------------------------------------- | ----------------------------------------- |
| Prix par lot actif                           | 10 €/mois (HT)                            |
| Nombre de lots actifs au lancement           | 50 (mois 1)                               |
| Croissance mensuelle du parc                 | +20 %                                     |
| Churn mensuel                                | 3 %                                       |
| Paiement Stripe Connect                      | 10 % commission sur transactions directes |
| Coût hébergement (Vercel + Supabase)         | 300 €/mois en V1, +5 %/mois               |
| Autres charges (API IA, Twilio, Stripe fees) | 6 % CA                                    |
| Salaires / freelances (dev, support)         | 7 000 €/mois (MVP à 2 ETP)                |
| Marketing / Ads                              | 1 000 €/mois croissant de +10 %           |
| Frais légaux, comptables, divers             | 500 €/mois                                |

### Projection des revenus (12 mois)

| Mois | Lots actifs | CA abonnements (€) | Commission Stripe (€) | Total revenus (€) |
| ---- | ----------- | ------------------ | --------------------- | ----------------- |
| M1   | 50          | 500                | 200                   | 700               |
| M3   | 86          | 860                | 344                   | 1 204             |
| M6   | 180         | 1 800              | 720                   | 2 520             |
| M9   | 310         | 3 100              | 1 240                 | 4 340             |
| M12  | 520         | 5 200              | 2 080                 | 7 280             |
| M18  | 1 200       | 12 000             | 4 800                 | 16 800            |
| M24  | 2 000       | 20 000             | 8 000                 | 28 000            |

### Charges prévisionnelles (€/mois)

| Poste                 | M1        | M12        | M24        |
| --------------------- | --------- | ---------- | ---------- |
| Hébergement           | 300       | 450        | 700        |
| API IA + SMS          | 100       | 500        | 1 000      |
| Salaires & freelances | 7 000     | 10 000     | 14 000     |
| Marketing             | 1 000     | 2 500      | 5 000      |
| Légal / admin         | 500       | 600        | 800        |
| Total charges         | **8 900** | **14 050** | **21 500** |

### Résultat net prévisionnel

| Période           | CA total                     | Charges totales | Résultat   | Marge brute |
| ----------------- | ---------------------------- | --------------- | ---------- | ----------- |
| 12 mois           | 40 000 €                     | 140 000 €       | -100 000 € | -           |
| 24 mois           | 180 000 €                    | 260 000 €       | -80 000 €  | 31 %        |
| Point mort estimé | ~36 mois (2 000 lots actifs) |                 |            |             |

### Synthèse

* Rentabilité atteignable vers **mois 30** (≈ 2 500 lots actifs).
* Coût marginal par lot très faible → **fort effet d’échelle**.
* Monétisation additionnelle prévue : IA Premium, modules OTA Pro, assurance, marketplace.

---

# `/docs/finance/4.2_politique_tarifs_plans.md` — Politique de prix & plans SaaS

| Plan        | Cible                   | Prix (HT/mois/lot)    | Fonctions incluses                                                     | Limitations                                 | Objectif                 |
| ----------- | ----------------------- | --------------------- | ---------------------------------------------------------------------- | ------------------------------------------- | ------------------------ |
| **Starter** | Propriétaires 1–3 lots  | 10 €                  | Gestion biens, réservations, calendrier OTA, paiements Stripe          | IA basique, 1 utilisateur, pas de reporting | Acquisition / onboarding |
| **Growth**  | Conciergeries < 20 lots | 25 €                  | Multi-utilisateurs, IA HITL, reporting, chat intégré, factures         | Support standard                            | Fidélisation             |
| **Pro**     | Agences 20–100 lots     | Sur devis (~35 €/lot) | API ouverte, IA avancée, tarification dynamique, branding personnalisé | Aucune                                      | Premium / B2B            |

### Options additionnelles

* Tarification IA dynamique : +5 €/lot/mois.
* Module maintenance / stocks : +2 €/lot/mois.
* Intégration compta (API externe) : +10 €/mois/organisation.

### Remises

* Annuel -10 %, 6 mois -5 %.
* Test gratuit 14 jours (sans carte).

---

# `/docs/finance/4.3_contrats_stripe_connect.md` — Contrats Stripe Connect

### Type d’intégration

* **Stripe Connect Standard Accounts**
* Chaque propriétaire/gestionnaire a son propre compte Stripe relié à Hoostn.
* Hoostn agit comme **Platform Account** (connecteur / mandataire de paiement).

### Flux

1. Le propriétaire accepte les CGU Stripe (OAuth Connect).
2. Les voyageurs paient via Stripe Checkout → fonds sur le compte Hoostn.
3. **Transfer automatique** du montant net (après commission et frais Stripe).
4. Hoostn conserve les **frais de plateforme (10 %)**.

### Obligations légales

* Hoostn doit :

  * Afficher les mentions “paiement opéré par Stripe” sur le site.
  * Fournir un reçu ou facture au nom du propriétaire.
  * Déclarer les revenus agrégés via **“Connect Payouts Reporting”**.

### Documents à archiver

* `stripe_platform_agreement.pdf`
* `connect_standard_tos.pdf`
* `privacy_policy_stripe.pdf`

---

# `/docs/legal/4.4_cgu_fr_en.md` — Conditions Générales d’Utilisation

### (Extrait FR)

**HOOSTN.COM – CONDITIONS GÉNÉRALES D’UTILISATION**
Dernière mise à jour : Novembre 2025
Ces CGU encadrent l’accès et l’utilisation de la plateforme **Hoostn**, éditée par **Hoostn SAS**.
L’utilisateur reconnaît avoir lu et accepté les présentes CGU lors de son inscription.

#### Article 1 – Objet

Hoostn met à disposition un service SaaS permettant la gestion de locations saisonnières, incluant la synchronisation OTA, la réservation directe et la gestion des paiements via Stripe Connect.

#### Article 2 – Accès au service

Le service est accessible aux propriétaires, conciergeries et agences disposant d’un compte Hoostn.
Hoostn se réserve le droit de suspendre un compte en cas de non-respect des présentes CGU.

#### Article 3 – Responsabilités

L’utilisateur est seul responsable des informations qu’il publie et des obligations légales relatives à la location.
Hoostn agit uniquement comme intermédiaire technique.

#### Article 4 – Propriété intellectuelle

Le contenu, la marque et le code de la plateforme sont la propriété exclusive de Hoostn SAS.

#### Article 5 – Résiliation

L’utilisateur peut résilier son abonnement à tout moment depuis son espace personnel.
Hoostn se réserve le droit de suspendre un compte en cas de fraude ou non-paiement.

#### Article 6 – Droit applicable

Soumis au droit français. Juridiction compétente : Tribunal de commerce de Paris.

*(Version EN jointe en annexe)*

---

# `/docs/legal/4.5_politique_confidentialite.md` — Politique de confidentialité (RGPD)

### Responsable de traitement

**Hoostn SAS**, 19 rue Léon Renier, 08000 Charleville-Mézières, France.
Contact DPO : [privacy@hoostn.com](mailto:privacy@hoostn.com)

### Données collectées

* Identité, contact, données de réservation.
* Historique messages, préférences, logs d’usage.
* Données financières (Stripe uniquement).

### Finalités

* Fournir le service (auth, réservation, paiement).
* Amélioration produit, support client, sécurité.
* Aucune revente de données.

### Droits RGPD

Accès, rectification, effacement, portabilité :
[privacy@hoostn.com](mailto:privacy@hoostn.com) – réponse sous 30 jours.

### Cookies

Consentement via bannière conforme CNIL.
Mesure d’audience anonymisée (Matomo Cloud UE).

### Hébergement

Données hébergées dans l’Union européenne :
Supabase (PostgreSQL – Francfort), Vercel (CDN Europe).

---

# `/docs/legal/4.6_mentions_legales.md` — Mentions légales

**Éditeur du site :**
Hoostn SAS – au capital de 10 000 €
Siège social : 19 rue Léon Renier, 08000 Charleville-Mézières
SIREN : 923 456 789
Email : [contact@hoostn.com](mailto:contact@hoostn.com)
Directeur de publication : Tommy Lambert

**Hébergement :**
Vercel Inc. – 440 N Barranca Ave #4133, Covina, CA 91723 (UE proxy Frankfurt)
Supabase Inc. – Data Center Europe (Frankfurt, DE)

**Propriété intellectuelle :**
Toute reproduction du contenu, des visuels ou du code est interdite sans accord écrit.

---

# `/docs/legal/4.7_dpa_sous_traitants.md` — Contrat de sous-traitance (DPA résumé)

| Sous-traitant                   | Service                        | Localisation   | Document DPA                           | Clause SCC              |
| ------------------------------- | ------------------------------ | -------------- | -------------------------------------- | ----------------------- |
| **Supabase Inc.**               | Base de données, Auth, Storage | UE (Francfort) | `supabase_dpa.pdf`                     | Non requis (UE)         |
| **Vercel Inc.**                 | Hébergement web (Edge/SSR)     | UE (Francfort) | `vercel_dpa.pdf`                       | Oui (SCC v2021/914)     |
| **Stripe Payments Europe Ltd.** | Paiement en ligne              | Irlande        | `stripe_dpa.pdf`                       | Non requis (UE)         |
| **Twilio Inc. / Vonage**        | Envoi SMS                      | USA            | `twilio_dpa.pdf`                       | Oui (SCC signées)       |
| **Resend**                      | Email transactionnel           | UE (Irlande)   | `resend_dpa.pdf`                       | Non requis              |
| **OpenRouter / Gemini**         | IA conversationnelle           | USA            | `openrouter_dpa.pdf`, `google_dpa.pdf` | Oui (SCC + opt-out PII) |

**Archivage :** `/legal/dpa/`
**Mise à jour annuelle.**

---

# `/docs/legal/4.8_cgv_saas.md` — Conditions Générales de Vente SaaS

### Article 1 – Objet

Les présentes CGV s’appliquent aux abonnements souscrits par les utilisateurs de la plateforme Hoostn.

### Article 2 – Tarifs et facturation

* Abonnement mensuel : 10 €/lot (HT).
* Paiement par carte via Stripe Connect.
* Facturation mensuelle automatisée.
* Résiliation libre avec effet à la fin de la période en cours.

### Article 3 – Engagements

* Hoostn s’engage à fournir un service disponible à 99,5 %.
* L’utilisateur s’engage à un usage conforme aux lois et règlements.

### Article 4 – Suspension / résiliation

Hoostn peut suspendre un compte en cas d’impayé > 15 jours.
Résiliation automatique après 3 relances.

### Article 5 – Remboursements

Aucun remboursement partiel n’est effectué sauf défaillance prolongée du service (>72 h).

### Article 6 – Droit applicable

Droit français – Tribunal compétent : Charleville-Mézières.
