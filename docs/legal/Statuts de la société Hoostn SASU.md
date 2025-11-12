# Statuts de la société Hoostn SASU

### 🏛️ Dénomination sociale

**Hoostn SASU**, société par actions simplifiée au capital de **10 000 €**, dont le siège social est situé :
**19 Rue Léon Renier, 08000 Charleville-Mézières, France**
Durée : **99 ans** à compter de l’immatriculation au RCS.

---

## 📘 Objet social

> “La conception, le développement, l’édition et la commercialisation de logiciels SaaS et plateformes web dans le domaine de la gestion locative saisonnière, ainsi que toute activité connexe ou complémentaire (formation, conseil, intégrations, services numériques).”

---

## 🧑‍💼 Président

**Tommy Lambert**, né le 21/10/1989 à Luçon, demeurant 7 bd valbenoite, 75020 Paris.
Peut déléguer temporairement tout ou partie de ses pouvoirs à un Directeur Général ou Directeur Technique.

---

## 💶 Capital social

* 1 000 actions de 10 € chacune.
* Apports en numéraire : 10 000 € (libération 50 % à la constitution).
* Actions entièrement nominatives.

---

## ⚙️ Modalités de fonctionnement

| Élément                 | Règle                                                        |
| ----------------------- | ------------------------------------------------------------ |
| Décisions collectives   | Consultation électronique possible                           |
| Transmission actions    | Agrément préalable de l’assemblée                            |
| Exercice social         | 1er janvier – 31 décembre                                    |
| Comptes                 | Arrêtés par le Président, certifiés par CAC si seuil atteint |
| Affectation du résultat | Réserve légale, puis dividendes ou report à nouveau          |

---

## 📄 Annexes

* Déclaration de non-condamnation du Président.
* Liste des souscripteurs et répartition des actions.
* Attestation de dépôt de capital.
* Publication dans un JAL (Journal d’Annonces Légales).

📌 *Signature notaire ou Legalstart possible avant dépôt RCS.*

---

# `/docs/admin/9.2_registre_beneficiaires_effectifs.md` — Registre des bénéficiaires effectifs

### 🎯 Objectif

Formalité obligatoire dans les 15 jours suivant l’immatriculation (art. R. 561-55 C. monétaire et financier).

---

| Dénomination                                                   | Hoostn SAS                                               |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| SIREN                                                          | (à obtenir lors du dépôt)                                |
| Siège social                                                   | 19 Rue Léon Renier, 08000 Charleville-Mézières           |
| Bénéficiaire effectif                                          | **Tommy Lambert**, détenteur direct de 100 % des actions |
| Nature du contrôle                                             | Détention directe du capital et des droits de vote       |
| Pourcentage                                                    | 100 %                                                    |
| Date de naissance                                              | …                                                        |
| Adresse                                                        | …                                                        |
| Déclaration déposée au greffe du tribunal de commerce de Sedan |                                                          |

📎 À joindre au dossier RCS (formulaire **M’BE** + pièce d’identité signée).

---

# `/docs/admin/9.3_depot_marque_inpi_euipo.md` — Dépôt de marque “Hoostn.com”

### 🎯 Objectif

Protéger le nom de domaine, la marque et le logo “Hoostn” en France et dans l’Union européenne.

---

## 🇫🇷 Dépôt INPI (France)

* **Type :** Marque verbale “Hoostn.com”
* **Classes :**

  * 9 : logiciels SaaS, applications web
  * 35 : gestion immobilière, conciergerie numérique
  * 42 : hébergement et développement de logiciels
* **Frais :** ~190 € (3 classes incluses).
* **Durée de protection :** 10 ans renouvelables.

📍 Site dépôt : [https://procedures.inpi.fr/](https://procedures.inpi.fr/)

---

## 🇪🇺 Extension EUIPO

* Protection communautaire pour l’UE : [https://euipo.europa.eu/](https://euipo.europa.eu/)
* Frais : 850 €
* Délai : 4 à 6 mois
* Option : représentation via conseil en PI (Cabinet Marchais ou Legalstart).

---

## 🔒 Marque & domaine

| Élément           | Statut                                                          |
| ----------------- | --------------------------------------------------------------- |
| Nom de domaine    | hoostn.com (à réserver OVH / Google Domains)                    |
| DNS & hébergement | Vercel                                                          |
| Logo & design     | Déposés via fichier `logo-hoostn.svg` (preuve création interne) |

---

# `/docs/admin/9.4_assurance_rcpro_cyber.md` — Assurance RC Pro & Cyber

### 🎯 Objectif

Protéger Hoostn SAS contre les risques liés à l’exploitation de la plateforme SaaS.

---

## 🛡️ RC Professionnelle

| Élément                | Détail                                                |
| ---------------------- | ----------------------------------------------------- |
| Garanties              | Responsabilité civile exploitation et après livraison |
| Montant couvert        | 1 000 000 € par sinistre                              |
| Franchise              | 500 €                                                 |
| Fournisseur recommandé | Hiscox, Axa Pro, WTW ou Alan Entreprise               |
| Documents requis       | Extrait Kbis + attestation annuelle                   |

---

## 💻 Assurance Cyber

| Élément                | Détail                                                      |
| ---------------------- | ----------------------------------------------------------- |
| Garanties              | Cyberattaque, ransomware, fuite de données, indisponibilité |
| Couverture             | Jusqu’à 500 000 €                                           |
| Assistance             | 24/7 – cellule incident & récupération                      |
| Obligations            | Notification CNIL, communication clients                    |
| Fournisseurs possibles | **Hiscox / Beazley / QBE Cyber**                            |

📎 Attestation PDF à archiver dans `/admin/assurance/hoostn_cyber_2025.pdf`.

---

# `/docs/admin/9.5_contrat_hebergement_donnees.md` — Contrat d’hébergement et de données

### 🎯 Objectif

Formaliser les engagements contractuels entre Hoostn et ses prestataires techniques.

---

## 🧩 Prestataires couverts

* **Supabase Inc.** : hébergement des bases de données et authentification.
* **Vercel Inc.** : hébergement web SSR/Edge.
* **Stripe Payments Europe Ltd.** : paiement et transfert d’argent.
* **Twilio / Resend** : communications transactionnelles (SMS, e-mails).

---

## 📜 Clauses principales

| Clause                        | Contenu                                                |
| ----------------------------- | ------------------------------------------------------ |
| **Disponibilité**             | 99,9 % uptime garanti (SLA Supabase/Vercel)            |
| **Sécurité**                  | Chiffrement AES-256, TLS 1.3, backup journalier        |
| **Propriété des données**     | Les données clients restent la propriété de Hoostn SAS |
| **Rétention**                 | 30 jours après résiliation                             |
| **Audit**                     | Accès aux journaux d’activité sur demande CNIL         |
| **Notification incident**     | Délai max 72h après découverte                         |
| **Transferts internationaux** | SCC signées pour tout traitement hors UE               |

---

📎 À archiver :

* `supabase_sla_2025.pdf`
* `vercel_sla_2025.pdf`
* `stripe_connect_agreement.pdf`
* `twilio_dpa.pdf`
