# DPA (Data Processing Agreement)

### 🎯 Objectif

Formaliser les relations de sous-traitance entre **Hoostn SAS** (Responsable de traitement) et ses prestataires techniques (sous-traitants au sens du RGPD).

---

## 1️⃣ Parties concernées

* **Responsable de traitement :** Hoostn SAS
  19 Rue Léon Renier – 08000 Charleville-Mézières – France
  SIREN : 923 456 789
  Contact DPO : [privacy@hoostn.com](mailto:privacy@hoostn.com)

* **Sous-traitants principaux :**

| Prestataire                     | Service                         | Localisation   | Contrat / DPA                          | Clauses SCC             | Observations                        |
| ------------------------------- | ------------------------------- | -------------- | -------------------------------------- | ----------------------- | ----------------------------------- |
| **Supabase Inc.**               | Hébergement DB, Auth, Storage   | UE (Francfort) | `supabase_dpa.pdf`                     | Non requis (UE)         | Chiffrement au repos                |
| **Vercel Inc.**                 | Hébergement web (Edge + SSR)    | UE (Francfort) | `vercel_dpa.pdf`                       | Oui (SCC 2021/914)      | Données anonymisées                 |
| **Stripe Payments Europe Ltd.** | Paiements et transferts Connect | Irlande (UE)   | `stripe_dpa.pdf`                       | Non requis (UE)         | Tokenisation complète               |
| **Twilio Inc. / Vonage**        | SMS transactionnels             | USA            | `twilio_dpa.pdf`                       | Oui (SCC signées)       | Pseudonymisation                    |
| **Resend**                      | Emails transactionnels          | Irlande        | `resend_dpa.pdf`                       | Non requis              | Pas de tracking                     |
| **OpenRouter / Gemini**         | IA conversationnelle            | USA            | `openrouter_dpa.pdf`, `google_dpa.pdf` | Oui (SCC + opt-out PII) | Pas de données sensibles transmises |

---

## 2️⃣ Engagements communs

* Traitement uniquement sur instructions documentées de Hoostn.
* Confidentialité, chiffrement et suppression des données à expiration.
* Notification immédiate en cas de violation de données.
* Sous-traitance secondaire interdite sans accord préalable.

---

## 3️⃣ Durée et fin du contrat

Les obligations de confidentialité perdurent **5 ans** après la fin du contrat.
Toute restitution ou destruction des données doit être confirmée par écrit.

---

# `/docs/security/7.2_registre_traitements_rgpd.md` — Registre des traitements RGPD (CNIL)

### 🎯 Objectif

Documenter tous les traitements de données personnelles opérés par Hoostn, conformément à l’article 30 du RGPD.

---

## 📘 Tableau synthétique des traitements

| ID  | Finalité du traitement       | Catégories de données             | Base légale            | Durée conservation          | Localisation          | Sous-traitants     |
| --- | ---------------------------- | --------------------------------- | ---------------------- | --------------------------- | --------------------- | ------------------ |
| T01 | Authentification utilisateur | Email                             | Consentement           | 3 ans après inactivité      | UE (Supabase)         | Supabase           |
| T02 | Gestion des réservations     | Identité, séjour, paiement        | Contrat                | 6 ans (prescription civile) | UE (Supabase, Stripe) | Supabase, Stripe   |
| T03 | Messagerie clients           | Conversations, identifiant client | Consentement           | 30 jours (pseudonymisé)     | UE/USA                | OpenRouter         |
| T04 | Facturation et paiements     | Données de facturation, IBAN      | Obligation légale      | 10 ans (comptable)          | UE                    | Stripe             |
| T05 | Notifications SMS/email      | Téléphone, email                  | Intérêt légitime       | 1 an                        | UE/USA                | Twilio, Resend     |
| T06 | IA support client            | Texte des messages anonymisés     | Consentement explicite | 30 jours                    | USA                   | OpenRouter, Gemini |
| T07 | Statistiques d’usage         | Logs anonymes                     | Intérêt légitime       | 12 mois                     | UE                    | Vercel, Matomo     |
| T08 | Support technique            | Logs et traces API                | Intérêt légitime       | 6 mois                      | UE                    | Supabase           |

---

## 🔐 Sécurité et conformité

* Chiffrement AES-256 au repos / TLS 1.3 en transit.
* RLS Supabase (row-level security) activée sur chaque table.
* Backups journaliers (rétention 30j).
* DPA signés avec tous les prestataires listés.

---

# `/docs/security/7.3_politique_securite_interne.md` — Politique de sécurité interne Hoostn

### 🎯 Objectif

Définir les règles de gestion de la sécurité opérationnelle pour les employés, prestataires et développeurs Hoostn.

---

## 🧑‍💻 Accès & authentification

* Authentification via **OAuth (Google)** ou **Supabase Auth**.
* MFA obligatoire pour tous les comptes administrateurs.
* Rotation des clés d’API tous les 90 jours.
* Accès aux environnements de production réservé au CTO + 1 DevOps.

---

## 💾 Données & backups

* Backups automatiques Supabase (toutes les 24h, rétention 30j).
* Sauvegardes chiffrées stockées dans bucket privé S3-compatible.
* Aucune copie locale autorisée sur postes personnels.

---

## 🔒 Gestion des secrets

* Variables d’environnement gérées par **Vercel Environment Variables**.
* Interdiction de stocker des clés dans le code source.
* Journalisation des accès secrets via `vercel audit logs`.

---

## 🚨 Procédures incidents

* Journalisation centralisée (`audit_log`).
* Détection anomalies via webhook Supabase Realtime.
* Plan de réponse détaillé (cf. doc 7.5).

---

## 🧱 Tests et audits

* Audit de sécurité annuel.
* Tests d’intrusion externes tous les 12 mois.
* Conformité **OWASP Top 10** vérifiée à chaque release.

---

# `/docs/security/7.4_politique_cookies_cnill.md` — Politique cookies & bannière CNIL

### 🎯 Objectif

Assurer le respect de la directive ePrivacy (UE) et des recommandations CNIL pour le recueil du consentement.

---

## 🍪 Types de cookies utilisés

| Type                     | Finalité                          | Durée   | Consentement requis        |
| ------------------------ | --------------------------------- | ------- | -------------------------- |
| **Essentiels**           | Session, sécurité (Supabase Auth) | Session | ❌                          |
| **Mesure d’audience**    | Matomo anonymisé (hébergé UE)     | 13 mois | ⚠️ non requis si anonymisé |
| **Marketing / tracking** | Google Ads, Meta Pixel            | 13 mois | ✅                          |
| **Préférences**          | Langue, thème (dark/light)        | 12 mois | ❌                          |

---

## 🧩 Gestion du consentement

* Bannière affichée au premier accès, conforme CNIL (“Tout accepter / Refuser / Personnaliser”).
* Outil de gestion : **Cookiebot** ou module interne `cookieConsent.js`.
* Stockage du choix utilisateur (`localStorage.consent_hoostn`).
* Preuve de consentement journalisée (`consent_log`).

---

## 🪶 Exemple de texte bannière

> “Hoostn utilise des cookies pour assurer le bon fonctionnement du site, mesurer l’audience et personnaliser les publicités.
> Vous pouvez accepter, refuser ou personnaliser vos préférences à tout moment.”

---

# `/docs/security/7.5_politique_incident_breach.md` — Politique d’incident / Data Breach

### 🎯 Objectif

Garantir la gestion rapide et conforme des incidents de sécurité et violations de données.

---

## 🚨 Procédure d’alerte

1. **Détection** : Anomalie détectée (log, alerte, support client).
2. **Notification interne** : sous 4h au DPO (`privacy@hoostn.com`).
3. **Évaluation impact** : nature, volume, catégories de données touchées.
4. **Mesures immédiates** : blocage, reset mots de passe, purge éventuelle.
5. **Documentation** : rapport incident enregistré dans `security_incidents`.

---

## 🧭 Notification CNIL

* Notification à la **CNIL** dans un délai de **72 heures** si risque pour les droits des personnes.
* Information individuelle aux utilisateurs concernés (email).

---

## 📄 Rapport type incident

| Champ                | Description                               |
| -------------------- | ----------------------------------------- |
| `incident_id`        | UUID                                      |
| `date_detection`     | Timestamp                                 |
| `source`             | Application / DB / API                    |
| `nature`             | Exfiltration / accès non autorisé / perte |
| `volume_estime`      | Nb enregistrements                        |
| `donnees_concernees` | Catégories concernées                     |
| `mesures_prises`     | Actions immédiates                        |
| `notification_cnil`  | Date / référence                          |
| `notification_users` | Oui / Non                                 |
| `closed_at`          | Timestamp clôture                         |

---

## 🧰 Amélioration continue

* Revue trimestrielle des incidents.
* Test de simulation d’intrusion annuelle.
* Revue post-incident documentée (post-mortem).

