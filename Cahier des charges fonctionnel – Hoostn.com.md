# 🏗️ **Cahier des charges fonctionnel – Hoostn.com (V1)**

Version : 1.0
Date : novembre 2025
Produit : **hoostn.com – SaaS de gestion de locations saisonnières**
Auteur : Équipe Produit Hoostn

---

## 1. 🎯 **Objectifs du projet**

hoostn.com est une **plateforme SaaS tout-en-un** qui automatise la gestion des locations saisonnières.
Elle permet aux **propriétaires**, **gestionnaires** et **agences** de :

* Centraliser les **réservations**, paiements, messages et opérations.
* Synchroniser les calendriers avec **Booking.com** et **Airbnb** en temps réel.
* Proposer un **moteur de réservation directe** (sans commission OTA).
* Simplifier la **communication client** (chat IA + humain).
* Gérer les **opérations terrain** (ménage, maintenance, stocks).
* Suivre les **performances** commerciales (revenus, taux d’occupation, RevPAR).

---

## 2. 🧭 **Périmètre fonctionnel (V1)**

### Modules principaux :

| Module                              | Description                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| 1. Gestion des biens et lots        | Ajout, édition, suppression, équipements, adresses, photos, géolocalisation. |
| 2. Calendrier & synchronisation OTA | Disponibilités, tarifs, réservations depuis Booking/Airbnb (API ou iCal).    |
| 3. Réservations & paiements         | Réservation directe, paiement Stripe, remboursement, dépôt de garantie.      |
| 4. Moteur de recherche public       | Recherche par ville, dates, personnes, animaux, chambres, prix.              |
| 5. Communication & support          | Messagerie unifiée, chat IA (Gemini / OpenRouter), workflows automatiques.   |
| 6. Gestion du personnel             | Planification des ménages, checklists, suivi photo, notifications.           |
| 7. Reporting & facturation          | Tableau de bord, statistiques, factures PDF, export CSV/Excel.               |
| 8. Administration                   | Gestion des comptes, abonnements, logs, support, conformité RGPD.            |

---

## 3. 👥 **Rôles et permissions**

| Rôle                                | Description                                           | Accès                   |
| ----------------------------------- | ----------------------------------------------------- | ----------------------- |
| **Admin plateforme (Hoostn)**       | Supervise le système et gère les organisations        | Tous les modules        |
| **Propriétaire / Gestionnaire**     | Gère ses biens, réservations, personnel, paiements    | Back-office complet     |
| **Employé (technicien de surface)** | Consulte et exécute ses tâches, envoie photos         | Module tâches           |
| **Client (voyageur)**               | Réserve un bien, paie, communique, télécharge facture | Interface publique      |
| **Support Hoostn (modérateur)**     | Peut consulter et intervenir sur les conversations    | Messagerie IA & support |

---

## 4. 🧩 **Structure du produit**

### Interfaces

| Interface                 | Contenu                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Public**                | Page d’accueil, moteur de recherche, fiche lot, réservation, CGU, Confidentialité, Contact, Landing propriétaires |
| **Espace Client**         | Tableau de bord des réservations, messages, factures, options séjour                                              |
| **Espace Propriétaire**   | Tableau de bord, biens/lots, calendrier, réservations, tâches, messages, reporting                                |
| **Espace Employé**        | Planning des ménages, checklist, upload photos                                                                    |
| **Espace Admin (Hoostn)** | Gestion des utilisateurs, logs, incidents, support                                                                |

---

## 5. 🏠 **Fonctionnalités détaillées**

### 5.1. Gestion des biens

* Ajout/modification/suppression de biens et lots.
* Informations : titre, description, adresse, capacité, chambres, équipements, animaux acceptés.
* Import photos (Supabase Storage).
* Définition des frais de ménage et taxe de séjour par commune.
* Attribution des lots à une organisation (multi-tenant).

### 5.2. Calendrier & OTA

* Synchronisation **Booking.com API** : réservations, annulations, tarifs, disponibilités.
* Synchronisation **Airbnb iCal** : import/export automatique (cron 30–60 min).
* Détection des conflits (réservations qui se chevauchent).
* Vue calendrier unifiée (multi-lots).
* Blocages manuels possibles (vacances, maintenance).

### 5.3. Réservations & paiements

* Moteur de réservation sur hoostn.com :

  * Sélection dates, personnes, animaux, prix total calculé.
  * Mode paiement intégral immédiat **ou** réservation gratuite jusqu’à 72h.
* Paiement par **Stripe Connect** (multi-propriétaires).
* Dépôt de garantie optionnel.
* Remboursements automatiques via Stripe.
* Facture PDF générée automatiquement.
* Notifications e-mail et SMS (informationnel).

### 5.4. Communication & support

* Messagerie unifiée (Booking API / Airbnb / Direct).
* Chat IA (Gemini via OpenRouter) :

  * Contexte : lot + client + réservation + historique.
  * Si incertitude > reprise humaine (Human-in-the-loop).
* Templates automatiques : J-3, J0, J+1, post-départ.
* E-mails via Resend/Postmark, SMS via Twilio/Vonage.

### 5.5. Gestion du personnel

* Invitation d’employés (ménage/maintenance).
* Attribution automatique des tâches selon check-out.
* Checklist personnalisée (ménage, maintenance).
* Upload photos (avant/après).
* Validation et suivi par le propriétaire.

### 5.6. Reporting & facturation

* Tableaux de bord : taux d’occupation, ADR, RevPAR, revenus.
* Filtres : période, canal, bien.
* Exports CSV/Excel.
* Factures PDF (via Stripe + template).

### 5.7. Administration

* Gestion des comptes & abonnements SaaS (10€/lot/mois).
* Logs et audit trail.
* Support intégré (chat interne).
* Gestion RGPD : suppression / export / anonymisation.

---

## 6. 💳 **Règles métiers**

| Règle | Détail                                                                                  |
| ----- | --------------------------------------------------------------------------------------- |
| R1    | Les réservations OTA sont prioritaires sur les réservations directes.                   |
| R2    | Une réservation gratuite doit être confirmée (paiement) au plus tard 72h avant arrivée. |
| R3    | Les tâches de ménage se déclenchent automatiquement 2h après un départ.                 |
| R4    | La taxe de séjour dépend de la commune liée à la propriété.                             |
| R5    | Le dépôt de garantie est optionnel et restitué automatiquement sous 48h.                |
| R6    | Les messages IA sont stockés 30 jours (puis anonymisés).                                |
| R7    | Chaque organisation est isolée (RLS Supabase).                                          |
| R8    | Une facture doit être émise pour chaque paiement réussi.                                |

---

## 7. 📊 **KPI & succès produit**

| Domaine          | Indicateur clé                             |
| ---------------- | ------------------------------------------ |
| Acquisition      | # nouveaux utilisateurs / mois             |
| Engagement       | % de réservations gérées via Hoostn vs OTA |
| Réduction charge | -30% de temps de gestion / bien            |
| Fiabilité        | <1% de double réservations                 |
| Rétention        | >80% clients actifs à 3 mois               |
| Conversion       | >5% visiteurs → réservations               |

---

## 8. 🧠 **IA et automatisation**

| Domaine    | Automatisation                           |
| ---------- | ---------------------------------------- |
| Chat IA    | Génération de réponses contextualisées   |
| Messages   | Envoi auto avant/pendant/après séjour    |
| Paiements  | Relances automatiques avant échéance 72h |
| Opérations | Création automatique des tâches ménage   |
| Reporting  | Calcul automatique des indicateurs       |

---

## 9. 📱 **Expérience utilisateur (UX)**

* **Responsive** : desktop, mobile, tablette.
* **Dark/Light mode** intégré.
* **Multilingue** : FR V1, EN V2.
* **Accessibilité** : contrastes WCAG AA.
* **Parcours minimalistes** (moins de 3 clics pour réserver).

---

## 10. ⚙️ **Contraintes techniques**

| Élément     | Choix                                    |
| ----------- | ---------------------------------------- |
| Stack       | Next-Forge + Supabase + Zustand + Vercel |
| Auth        | Supabase Magic Link                      |
| DB          | PostgreSQL (RLS multi-tenant)            |
| Paiements   | Stripe Connect                           |
| SMS         | Twilio / Vonage                          |
| IA          | Gemini + OpenRouter                      |
| RGPD        | Données hébergées en UE uniquement       |
| Déploiement | CI/CD Vercel, migrations Supabase        |
| Backups     | Quotidiens (30 jours)                    |

---

# 📘 **User Stories – MVP Hoostn V1**

---

## 1️⃣ **Recherche & réservation**

| ID     | En tant que | Je veux                                                            | Afin de                                  | Priorité |
| ------ | ----------- | ------------------------------------------------------------------ | ---------------------------------------- | -------- |
| US-001 | Voyageur    | rechercher un logement par ville et dates                          | trouver un logement disponible           | 🟢       |
| US-002 | Voyageur    | filtrer les résultats par nb de personnes, chambres, prix, animaux | affiner ma recherche                     | 🟢       |
| US-003 | Voyageur    | voir la fiche complète d’un logement                               | connaître ses caractéristiques et photos | 🟢       |
| US-004 | Voyageur    | réserver en ligne et payer                                         | confirmer mon séjour                     | 🟢       |
| US-005 | Voyageur    | recevoir un e-mail et un SMS de confirmation                       | être sûr que ma réservation est validée  | 🟢       |
| US-006 | Voyageur    | pouvoir annuler gratuitement jusqu’à 72h avant                     | garder de la flexibilité                 | 🟢       |

---

## 2️⃣ **Gestion des biens**

| ID     | En tant que  | Je veux                              | Afin de                         | Priorité |
| ------ | ------------ | ------------------------------------ | ------------------------------- | -------- |
| US-010 | Gestionnaire | ajouter un bien et ses lots          | les proposer à la location      | 🟢       |
| US-011 | Gestionnaire | définir des tarifs par date          | ajuster mes revenus             | 🟢       |
| US-012 | Gestionnaire | bloquer des périodes                 | éviter les doubles réservations | 🟢       |
| US-013 | Gestionnaire | définir des frais de ménage et taxes | facturer correctement           | 🟢       |
| US-014 | Gestionnaire | visualiser un calendrier unifié      | planifier mes locations         | 🟢       |

---

## 3️⃣ **Synchronisation OTA**

| ID     | En tant que  | Je veux                                 | Afin de                           | Priorité |
| ------ | ------------ | --------------------------------------- | --------------------------------- | -------- |
| US-020 | Gestionnaire | synchroniser Booking.com en temps réel  | éviter les doublons               | 🟢       |
| US-021 | Gestionnaire | importer mon calendrier Airbnb via iCal | maintenir mes dispos à jour       | 🟢       |
| US-022 | Système      | détecter les conflits de réservation    | garantir la fiabilité des données | 🟢       |

---

## 4️⃣ **Communication & IA**

| ID     | En tant que    | Je veux                                    | Afin de                        | Priorité |
| ------ | -------------- | ------------------------------------------ | ------------------------------ | -------- |
| US-030 | Voyageur       | échanger avec le support via chat          | poser mes questions            | 🟢       |
| US-031 | Gestionnaire   | voir les messages regroupés                | répondre plus vite aux clients | 🟢       |
| US-032 | IA Hoostn      | répondre automatiquement selon le contexte | réduire le temps de réponse    | 🟢       |
| US-033 | Support Hoostn | reprendre la main (Human-in-the-loop)      | traiter les cas complexes      | 🟢       |

---

## 5️⃣ **Gestion du personnel**

| ID     | En tant que  | Je veux                        | Afin de                     | Priorité |
| ------ | ------------ | ------------------------------ | --------------------------- | -------- |
| US-040 | Gestionnaire | inviter un employé (ménage)    | planifier les interventions | 🟢       |
| US-041 | Employé      | voir mes tâches sur mobile     | organiser mon planning      | 🟢       |
| US-042 | Employé      | cocher et illustrer mes tâches | prouver le travail effectué | 🟢       |

---

## 6️⃣ **Reporting & facturation**

| ID     | En tant que  | Je veux                                      | Afin de                       | Priorité |
| ------ | ------------ | -------------------------------------------- | ----------------------------- | -------- |
| US-050 | Gestionnaire | voir mes revenus et taux d’occupation        | piloter mes performances      | 🟢       |
| US-051 | Gestionnaire | exporter mes données                         | faire ma comptabilité         | 🟢       |
| US-052 | Système      | générer une facture PDF pour chaque paiement | assurer la conformité fiscale | 🟢       |

---

## 7️⃣ **Administration**

| ID     | En tant que  | Je veux                         | Afin de                      | Priorité |
| ------ | ------------ | ------------------------------- | ---------------------------- | -------- |
| US-060 | Admin Hoostn | voir la liste des organisations | gérer la base utilisateurs   | 🟢       |
| US-061 | Admin Hoostn | consulter les logs et incidents | suivre la qualité du service | 🟢       |
| US-062 | Admin Hoostn | gérer les abonnements SaaS      | facturer les clients         | 🟢       |

---

# ✅ **Livrables**

* ✅ Cahier des charges fonctionnel (présent document)
* ✅ Backlog MVP complet (user stories ci-dessus)
* 🔜 Maquettes UX (Figma)
* 🔜 Spécifications techniques (ERD + API OpenAPI.yaml)
* 🔜 Scénarios de test QA

---


