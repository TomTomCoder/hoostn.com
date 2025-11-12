# Master Prompt Hoostn Chat (Gemini / OpenRouter)

### 🎯 Objectif

Créer une IA conversationnelle intégrée à Hoostn, capable de :

* Répondre automatiquement aux voyageurs selon leur réservation et contexte,
* Assister les propriétaires/gestionnaires,
* Escalader vers un humain si la confiance < 0.6.

---

## 🧠 Structure du prompt maître

```json
{
  "name": "Hoostn Support AI",
  "version": "v1.0",
  "role": "assistant",
  "language": "fr",
  "tone": "professionnel, bienveillant, réactif, informatif",
  "contextual_sources": [
    "informations du lot (nom, ville, équipements)",
    "profil client (nom, langue, historique séjour)",
    "réservation (dates, statut, montant, paiement)",
    "FAQ Hoostn (politique annulation, arrivée, check-out)",
    "modèles de messages automatisés"
  ],
  "behaviors": {
    "respond_scope": [
      "réservations, arrivées/départs, informations pratiques",
      "retards, modifications, annulations",
      "paiement et facturation",
      "questions fréquentes sur le logement"
    ],
    "fallback_to_human": true,
    "handoff_threshold": 0.6,
    "handoff_message": "Je vais transmettre votre message à notre équipe pour une réponse personnalisée sous peu."
  },
  "rules": [
    "Toujours rester factuel et poli.",
    "Ne jamais inventer d'informations (adresses, tarifs, règles).",
    "Utiliser les données de la réservation si disponibles.",
    "Toujours préciser les délais ou horaires lorsqu’ils sont connus.",
    "Signaler immédiatement tout conflit (réservation double, paiement non confirmé).",
    "Conclure chaque message avec un ton rassurant."
  ],
  "style_guide": {
    "greeting": "Bonjour {prenom} 👋",
    "closing": "Bonne journée et à bientôt sur Hoostn 🌞",
    "emoji_usage": "modéré, pas dans les messages officiels",
    "multilang_support": "auto-détection FR/EN/ES"
  },
  "memory": {
    "conversation_window": 10,
    "persist": false,
    "privacy": "strict RGPD — logs pseudonymisés sous 30 jours"
  }
}
```

---

## ⚙️ Exemples d’utilisation

**Cas voyageur :**

> “À quelle heure puis-je arriver au logement ?”
> → L’IA consulte `lot.rules_json.checkin_time` → “L’arrivée est possible à partir de 15h.”

**Cas conflit calendrier :**

> “Je veux décaler mon séjour d’un jour.”
> → IA détecte indisponibilité → confidence 0.48 → escalade humaine automatique.

**Cas propriétaire :**

> “Donne-moi le taux d’occupation du mois.”
> → L’IA agrège `reservations` et renvoie un résumé analytique.

---

# `/docs/ai/5.2_scenarios_hitl_flow.md` — Scénarios IA / Human-in-the-loop (HITL)

### 🎯 Objectif

Garantir que chaque interaction IA avec le client puisse être contrôlée, corrigée et auditée.

---

## 🔁 Diagramme de flux (BPMN simplifié)

```mermaid
flowchart TD
  A[Message client reçu] --> B[Analyse IA (Gemini)]
  B --> C{Confidence >= 0.6 ?}
  C -- Oui --> D[Réponse automatique IA envoyée]
  C -- Non --> E[Escalade Human-in-the-loop]
  E --> F[Agent humain notifié via dashboard]
  F --> G[L’agent lit le contexte (thread + réservation)]
  G --> H[Agent envoie réponse manuelle]
  H --> I[Trace dans audit_log + label "resolved_human"]
  D --> J[Trace dans audit_log + label "resolved_ai"]
```

---

## 🎬 Cas pratiques

| Scénario                                                  | Type | Seuil IA | Action                          |
| --------------------------------------------------------- | ---- | -------- | ------------------------------- |
| Question logistique simple (“à quelle heure l’arrivée ?”) | IA   | 0.95     | Réponse directe                 |
| Message émotionnel (“je suis mécontent de la propreté”)   | HITL | 0.45     | Escalade humaine                |
| Problème paiement / remboursement                         | HITL | 0.50     | Intervention obligatoire        |
| Confirmation séjour / remerciement                        | IA   | 0.90     | Réponse automatique             |
| Signalement incident (fuite, panne)                       | HITL | 0.40     | Création tâche + message humain |

---

## 🔔 Notifications

* Escalades : Slack ou mail instantané pour les gestionnaires.
* L’IA doit **jamais clôturer un ticket escaladé sans validation humaine.**

---

# `/docs/ai/5.3_journalisation_audit_ia.md` — Journalisation & Audit IA

### 🎯 Objectif

Assurer traçabilité, conformité RGPD et transparence sur les interactions IA.

---

## 🗂 Table `ai_trace`

| Champ             | Type         | Description                                   |
| ----------------- | ------------ | --------------------------------------------- |
| `id`              | uuid         | Identifiant unique                            |
| `thread_id`       | uuid FK      | Conversation liée                             |
| `message_id`      | uuid FK      | Message analysé                               |
| `model_name`      | text         | Nom du modèle IA utilisé (Gemini, OpenRouter) |
| `prompt_tokens`   | int          | Nombre de tokens input                        |
| `response_tokens` | int          | Nombre de tokens output                       |
| `latency_ms`      | int          | Temps de réponse                              |
| `confidence`      | numeric(3,2) | Score de confiance                            |
| `handoff`         | boolean      | Escalade humaine effectuée                    |
| `created_at`      | timestamptz  | Date d’exécution                              |
| `trace_hash`      | text         | Hash pseudonymisé du contenu                  |
| `deleted_at`      | timestamptz  | Anonymisation (J+30)                          |

---

## 🔐 RGPD

* Les logs IA **ne contiennent pas de PII** : emails, noms et téléphones sont hachés (`SHA-256`).
* Les logs sont purgés ou anonymisés **sous 30 jours** via une tâche CRON Supabase Edge.
* Accès réservé au rôle `admin` Hoostn uniquement.
* Toute extraction pour audit CNIL est chiffrée et datée.

---

## ⚙️ Exemples d’événements tracés

| Action            | Exemple                         | Handoff | Confidence |
| ----------------- | ------------------------------- | ------- | ---------- |
| Réponse check-in  | “L’arrivée est prévue à 15h.”   | ❌       | 0.94       |
| Question tarif    | “Pourquoi le prix a augmenté ?” | ✅       | 0.53       |
| Signalement panne | “La clim ne fonctionne plus”    | ✅       | 0.47       |

---

# `/docs/ai/5.4_politique_ethique_ia.md` — Politique éthique IA

### 🎯 Objectif

Assurer transparence, fiabilité et respect des données personnelles dans l’usage de l’IA Hoostn.

---

## 🔍 Principes directeurs

1. **Transparence**

   * L’utilisateur est informé lorsqu’il interagit avec l’IA.
   * Mention explicite dans le chat : “Ce message a été généré par notre assistant Hoostn IA.”

2. **Supervision humaine**

   * Toute décision critique (remboursement, litige, évaluation) requiert une validation humaine.
   * L’IA n’a jamais d’accès direct aux paiements Stripe.

3. **Confidentialité & sécurité**

   * Aucune donnée sensible (identité complète, carte bancaire) n’est transmise à l’IA.
   * Les prompts et réponses sont anonymisés avant envoi à OpenRouter / Gemini.

4. **Traçabilité**

   * Chaque échange IA est journalisé (`ai_trace`) pour audit RGPD.
   * Les utilisateurs peuvent demander suppression ou export de ces traces.

5. **Amélioration continue**

   * Les logs anonymisés servent à entraîner des modèles internes, jamais à des fins commerciales.
   * Évaluation mensuelle : taux de satisfaction IA / taux d’escalade / latence moyenne.

---

## 🧾 Mentions légales à insérer dans les CGU

> **Traitement automatisé :**
> Certains messages peuvent être générés par une intelligence artificielle supervisée.
> Les utilisateurs sont informés qu’un agent humain peut reprendre la conversation à tout moment.
> Aucune décision financière ou contractuelle n’est prise exclusivement par l’IA.
