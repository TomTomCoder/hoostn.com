# Schéma d’architecture

```mermaid
flowchart LR
  subgraph Client["UIs (Web App)"]
    P0[Public: /, /explorer, /ville/quartier, /lot/[slug], /checkout]
    P1[App Client: /app/me]
    P2[App Pro: /app/owner]
    P3[App Employé: /app/worker]
    P4[Admin Hoostn]
  end

  subgraph Vercel["Next-Forge • Vercel (Edge+Node)"]
    N0[Next.js SSR/ISR\nEdge runtime (SEO pages localisation)]
    N1[API Routes REST (/api/*)]
    N2[Webhooks (/api/webhooks/*)\nStripe, Booking]
    N3[Cron Edge (iCal refresh, anonymisation 30j)]
    N4[WebSocket Gateway (/ws/chat)\nFallback SSE]
    N5[Workers légers (queues en DB)]
  end

  subgraph Supabase["Supabase (EU)"]
    S0[(PostgreSQL + RLS)]
    S1[Auth (Magic Link + JWT)]
    S2[Storage (photos, factures PDF)]
    S3[Realtime (channels/thread)]
    S4[Functions (policies + RPC)]
    S5[Backups/PITR]
  end

  subgraph Externes["Services externes"]
    X0[Stripe Connect\n(Paiements, Billing)]
    X1[Twilio/Vonage\n(SMS info-only)]
    X2[Resend/Postmark\n(Emails)]
    X3[Booking.com API\n(Webhooks Connectivity)]
    X4[Airbnb iCal endpoints]
    X5[Gemini/OpenRouter\n(IA chat)]
    X6[Logtail/BetterStack\n(Logs)]
  end

  Client -->|HTTPS| N0
  P0-->N1
  P1-->N1
  P2-->N1
  P3-->N1
  P4-->N1
  N1<-->S0
  N1<-->S2
  N1<-->S1
  N1-->S3
  N1-->X0
  N1-->X1
  N1-->X2
  N1-->X5
  N2<--events-->X0
  N2<--events-->X3
  N3-->X4
  N4<-->S3
  N1-->X6
```

**Principes clés**

* **SSR/ISR Edge** pour SEO (pages ville/quartier et cartes).
* **API unique** (REST) + **Webhooks** (Stripe, Booking) + **WS** (chat IA/HITL).
* **Supabase** : Auth (Magic Link), RLS stricte par `org_id`, Storage pour médias & PDF, Realtime pour chat.
* **Synchronisation OTA** : Booking via webhooks, Airbnb via iCal (CRON 30–60 min).
* **Stripe Connect** : paiement intégral ou réservation “hold-72h” (capture J-3).
* **Logs & observabilité** : Logtail/BetterStack ; anonymisation 30 j (CRON).

---

# `/docs/tech/3.2_erd_supabase.mmd` — ERD (Entity-Relationship Diagram)

```mermaid
erDiagram
  ORGANISATION ||--o{ UTILISATEUR : has
  ORGANISATION ||--o{ PROPRIETE : owns
  PROPRIETE ||--o{ LOT : groups
  LOT ||--o{ LOT_EQUIPEMENT : has
  EQUIPEMENT ||--o{ LOT_EQUIPEMENT : link
  LOT ||--o{ TARIF_REGLE : priced_by
  LOT ||--o{ DISPONIBILITE_BLOCAGE : blocked_by
  LOT ||--o{ ANNONCE_CANAL : listed_on
  LOT ||--o{ RESERVATION : books
  RESERVATION ||--o{ PAYMENT_INTENT : paid_by
  RESERVATION ||--o{ FACTURE : invoiced_by
  RESERVATION ||--o{ THREAD : opens
  THREAD ||--o{ MESSAGE : contains
  UTILISATEUR ||--o{ TACHE : executes
  LOT ||--o{ TACHE : requires
  ORGANISATION ||--o{ SMS_LOG : emits
  ORGANISATION ||--o{ EMAIL_LOG : emails
  ORGANISATION ||--o{ AUDIT_LOG : produces
  THREAD ||--o{ HANDOFF : escalates
  ORGANISATION ||--o{ TAXE_COMMUNE : applies

  ORGANISATION {
    uuid id PK
    text nom
    text devise
    text pays
    text tva
    timestamptz created_at
  }
  UTILISATEUR {
    uuid id PK
    uuid org_id FK
    text email
    text role // admin|owner|manager|employee|guest
    timestamptz last_login
    timestamptz created_at
  }
  PROPRIETE {
    uuid id PK
    uuid org_id FK
    text titre
    text adresse
    text ville
    text quartier
    float lat
    float lng
    text description
    text geohash
  }
  LOT {
    uuid id PK
    uuid propriete_id FK
    text slug
    text nom
    int chambres
    int lits
    int sdb
    int capacite_adultes
    int capacite_enfants
    boolean pets_allowed
    numeric nightly_rate
    numeric caution_amount
    text currency
    jsonb photos
  }
  EQUIPEMENT {
    uuid id PK
    text code
    text label
  }
  LOT_EQUIPEMENT {
    uuid id PK
    uuid lot_id FK
    uuid equipement_id FK
  }
  TARIF_REGLE {
    uuid id PK
    uuid lot_id FK
    date jour
    numeric price
    int min_stay
    boolean cta
    boolean ctd
    text currency
  }
  DISPONIBILITE_BLOCAGE {
    uuid id PK
    uuid lot_id FK
    timestamptz start_at
    timestamptz end_at
    text source // user|ota|ical
    text reason
  }
  ANNONCE_CANAL {
    uuid id PK
    uuid lot_id FK
    text canal // booking|airbnb|direct
    text external_id
    text status
    text ical_url
  }
  RESERVATION {
    uuid id PK
    uuid lot_id FK
    text source // direct|booking|airbnb
    date checkin
    date checkout
    int guests_adultes
    int guests_enfants
    boolean pets
    numeric montant
    text devise
    text statut // pending|paid|cancelled|refunded
    jsonb fees_json // menage, etc.
    jsonb taxes_json // taxe sejour
    text mode_paiement // full|hold-72h
    uuid customer_user_id
  }
  PAYMENT_INTENT {
    uuid id PK
    uuid reservation_id FK
    text provider // stripe
    text stripe_payment_intent_id
    text status
    numeric amount
    text currency
    timestamptz created_at
  }
  FACTURE {
    uuid id PK
    uuid reservation_id FK
    uuid org_id FK
    numeric total
    text devise
    text pdf_url
    timestamptz issued_at
  }
  THREAD {
    uuid id PK
    uuid reservation_id FK
    text canal // direct|booking|airbnb|email|inapp
    text language
    timestamptz opened_at
    text status // open|waiting_ia|escalated|assigned|resolved|closed
  }
  MESSAGE {
    uuid id PK
    uuid thread_id FK
    text author_type // in|out|ia|agent
    uuid author_id
    text body
    jsonb metadata_json
    timestamptz created_at
  }
  HANDOFF {
    uuid id PK
    uuid thread_id FK
    text reason
    jsonb snapshot_json
    uuid assigned_to
    timestamptz created_at
    timestamptz resolved_at
    text outcome
  }
  TACHE {
    uuid id PK
    uuid lot_id FK
    uuid reservation_id
    text type // menage|maintenance|reassort
    uuid assigne_a
    timestamptz due_at
    text statut // todo|doing|done
    jsonb checklist_json
    jsonb photos
  }
  SMS_LOG {
    uuid id PK
    uuid org_id FK
    text to_msisdn
    text template
    text status
    jsonb provider_meta
    timestamptz created_at
  }
  EMAIL_LOG {
    uuid id PK
    uuid org_id FK
    text to_email
    text template
    jsonb provider_meta
    timestamptz created_at
  }
  AUDIT_LOG {
    uuid id PK
    uuid org_id FK
    uuid actor_id
    text action
    text target
    jsonb meta
    inet ip
    timestamptz ts
  }
  TAXE_COMMUNE {
    uuid id PK
    uuid org_id FK
    text commune
    text insee
    numeric taux_par_nuit
    numeric plafond_par_personne
    text devise
    timestamptz updated_at
  }
```

---

# `/docs/tech/3.3_api_openapi.yaml` — Spécifications API (OpenAPI 3.0)

```yaml
openapi: 3.0.3
info:
  title: Hoostn API
  version: "1.0.0"
  description: |
    API REST de Hoostn.com (MVP).
    - Public: recherche, devis, réservation.
    - Auth: Supabase JWT (Magic Link), RLS par organisation.
    - Webhooks: Stripe, Booking.
servers:
  - url: https://api.hoostn.com/v1
security:
  - bearerAuth: []
tags:
  - name: Public
  - name: Reservations
  - name: Payments
  - name: Messaging
  - name: Employees
  - name: Admin
  - name: Webhooks

components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
    stripeSig: { type: apiKey, in: header, name: Stripe-Signature }
  schemas:
    Error:
      type: object
      required: [error, code]
      properties:
        error: { type: string }
        code: { type: string }
        details: { type: object, nullable: true }
    Pagination:
      type: object
      properties:
        page: { type: integer, minimum: 1, default: 1 }
        per_page: { type: integer, minimum: 1, maximum: 100, default: 20 }
        next_cursor: { type: string, nullable: true }
    SearchResult:
      type: object
      properties:
        lot_id: { type: string, format: uuid }
        titre: { type: string }
        adresse: { type: string }
        lat: { type: number }
        lng: { type: number }
        chambres: { type: integer }
        prix_par_nuit: { type: number }
        pets_allowed: { type: boolean }
        photos: { type: array, items: { type: string, format: uri } }
    QuoteRequest:
      type: object
      required: [lot_id, checkin, checkout, adults, children, pets]
      properties:
        lot_id: { type: string, format: uuid }
        checkin: { type: string, format: date }
        checkout: { type: string, format: date }
        adults: { type: integer, minimum: 1 }
        children: { type: integer, minimum: 0 }
        pets: { type: boolean }
    QuoteResponse:
      type: object
      properties:
        currency: { type: string }
        nights: { type: integer }
        breakdown:
          type: object
          properties:
            lodging: { type: number }
            cleaning_fee: { type: number }
            city_tax: { type: number }
            total: { type: number }
    BookingCreateRequest:
      type: object
      required: [mode, lot_id, checkin, checkout, guests]
      properties:
        mode: { type: string, enum: [full, hold-72h] }
        lot_id: { type: string, format: uuid }
        checkin: { type: string, format: date }
        checkout: { type: string, format: date }
        guests:
          type: object
          properties:
            adults: { type: integer, minimum: 1 }
            children: { type: integer, minimum: 0 }
            pets: { type: boolean }
        customer:
          type: object
          properties:
            email: { type: string, format: email }
            name: { type: string }
            phone: { type: string }
    BookingCreateResponse:
      type: object
      properties:
        reservation_id: { type: string, format: uuid }
        status: { type: string, enum: [pending, paid] }
        stripe_client_secret: { type: string, nullable: true }
        mode: { type: string, enum: [full, hold-72h] }
    Reservation:
      type: object
      properties:
        id: { type: string, format: uuid }
        lot_id: { type: string, format: uuid }
        source: { type: string, enum: [direct, booking, airbnb] }
        checkin: { type: string, format: date }
        checkout: { type: string, format: date }
        guests_adultes: { type: integer }
        guests_enfants: { type: integer }
        pets: { type: boolean }
        montant: { type: number }
        devise: { type: string }
        statut: { type: string, enum: [pending, paid, cancelled, refunded] }
        mode_paiement: { type: string, enum: [full, hold-72h] }
        fees_json: { type: object }
        taxes_json: { type: object }

paths:
  /public/search:
    get:
      tags: [Public]
      summary: Recherche de lots disponibles
      parameters:
        - in: query; name: city; schema: { type: string }
        - in: query; name: lat; schema: { type: number }
        - in: query; name: lng; schema: { type: number }
        - in: query; name: radius_km; schema: { type: integer, default: 10 }
        - in: query; name: checkin; schema: { type: string, format: date }
        - in: query; name: checkout; schema: { type: string, format: date }
        - in: query; name: adults; schema: { type: integer, minimum: 1 }
        - in: query; name: children; schema: { type: integer, minimum: 0 }
        - in: query; name: pets; schema: { type: boolean, default: false }
        - in: query; name: bedrooms; schema: { type: integer, minimum: 0 }
        - in: query; name: price_min; schema: { type: integer, minimum: 0 }
        - in: query; name: price_max; schema: { type: integer, minimum: 0 }
        - in: query; name: page; schema: { type: integer, default: 1 }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  results: { type: array, items: { $ref: "#/components/schemas/SearchResult" } }
                  pagination: { $ref: "#/components/schemas/Pagination" }
        "400": { description: Bad Request, content: { application/json: { schema: { $ref: "#/components/schemas/Error" } } } }

  /public/availability/quote:
    post:
      tags: [Public]
      summary: Calcule un devis (prix total) pour un lot et des dates
      requestBody:
        required: true
        content:
          application/json: { schema: { $ref: "#/components/schemas/QuoteRequest" } }
      responses:
        "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/QuoteResponse" } } } }
        "409": { description: Conflit de disponibilité }

  /public/book:
    post:
      tags: [Public, Reservations, Payments]
      summary: Crée une réservation (full ou hold-72h) + init paiement Stripe si full
      requestBody:
        required: true
        content:
          application/json: { schema: { $ref: "#/components/schemas/BookingCreateRequest" } }
      responses:
        "201": { description: Created, content: { application/json: { schema: { $ref: "#/components/schemas/BookingCreateResponse" } } } }
        "409": { description: Indisponible / conflit }

  /reservations/{id}:
    get:
      tags: [Reservations]
      summary: Détail d'une réservation (auth requise)
      parameters:
        - in: path; name: id; required: true; schema: { type: string, format: uuid }
      responses:
        "200": { description: OK, content: { application/json: { schema: { $ref: "#/components/schemas/Reservation" } } } }
        "404": { description: Not Found }

  /reservations/{id}/cancel:
    post:
      tags: [Reservations, Payments]
      summary: Annulation (et remboursement si applicable)
      parameters:
        - in: path; name: id; required: true; schema: { type: string, format: uuid }
      responses:
        "200": { description: Annulée }
        "400": { description: Non annulable }
        "404": { description: Not Found }

  /employees/invite:
    post:
      tags: [Employees]
      summary: Invite un employé (ménage/maintenance)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, role]
              properties:
                email: { type: string, format: email }
                role: { type: string, enum: [employee] }
      responses:
        "204": { description: Invitation envoyée }

  /employees/tasks:
    get:
      tags: [Employees]
      summary: Liste des tâches (filtrable)
      parameters:
        - in: query; name: from; schema: { type: string, format: date-time }
        - in: query; name: to; schema: { type: string, format: date-time }
        - in: query; name: status; schema: { type: string, enum: [todo,doing,done] }
      responses:
        "200": { description: OK }

  /employees/tasks/{id}/complete:
    post:
      tags: [Employees]
      summary: Valide une tâche (photos/checklist)
      parameters:
        - in: path; name: id; required: true; schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                checklist: { type: array, items: { type: string } }
                photos: { type: array, items: { type: string, format: uri } }
      responses:
        "200": { description: OK }

  /messages/send:
    post:
      tags: [Messaging]
      summary: Envoi (email/in-app) — SMS info only
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [channel, to, body]
              properties:
                channel: { type: string, enum: [email, inapp] }
                to: { type: string }
                body: { type: string }
                template: { type: string, nullable: true }
      responses:
        "202": { description: Accepté }

  /chat/assist:
    post:
      tags: [Messaging]
      summary: Réponse IA contextualisée (Gemini/OpenRouter)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                reservation_id: { type: string, format: uuid }
                lot_id: { type: string, format: uuid }
                prompt: { type: string }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  answer: { type: string }
                  confidence: { type: number }

  /channels/ical/import:
    post:
      tags: [Admin]
      summary: Ajoute une URL iCal Airbnb à un lot
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [lot_id, url]
              properties:
                lot_id: { type: string, format: uuid }
                url: { type: string, format: uri }
      responses:
        "204": { description: OK }

  /channels/ical/refresh:
    post:
      tags: [Admin]
      summary: Force le refresh iCal (pull immédiat)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [lot_id]
              properties:
                lot_id: { type: string, format: uuid }
      responses:
        "202": { description: Refresh lancé }

  /webhooks/stripe:
    post:
      tags: [Webhooks]
      summary: Webhook Stripe (paiements, remboursements, dispute)
      security: [{ stripeSig: [] }]
      responses:
        "200": { description: ok }
        "400": { description: signature invalide }

  /webhooks/booking:
    post:
      tags: [Webhooks]
      summary: Webhook Booking.com (création/modif/annulation)
      responses:
        "200": { description: ok }
```

---

# `/docs/tech/3.4_integrations_ota.md` — Plan d’intégration OTA (Booking & Airbnb)

## 1) Objectif

* Centraliser les réservations et disponibilités en **temps quasi-réel**, éviter les doubles réservations, et préparer l’évolution vers les APIs partenaires.

## 2) Booking.com — Connectivity API (webhooks)

* **Flux cible**

  1. **Push Booking → Hoostn** (webhook) : création/modif/annulation réservation.
  2. **Hoostn → DB** : upsert `RESERVATION`, blocage dates (`DISPONIBILITE_BLOCAGE`).
  3. **Hoostn → Notifs** : email/SMS info au propriétaire (optionnel).
* **Mapping**

  * `reservation_id` Booking → `RESERVATION.external_id` (dans `fees_json.meta`).
  * Status `confirmed/cancelled/modified` → `statut` + recalcul quote si besoin.
* **Conflits**

  * Si chevauchement avec résa directe : **priorité au plus ancien enregistré** ; l’autre est annulé avec message d’excuse + HITL.
* **Sécurité**

  * Signature d’événement (secret partagé) ; idempotency key = `event_id`.

## 3) Airbnb — iCal (phase 1) → Partner API (phase 2)

* **Phase 1 (MVP)** :

  * Import iCal par lot via `ANNONCE_CANAL.ical_url`.
  * CRON Edge (30–60 min) : pull iCal, parser (`VEVENT`), écrire `DISPONIBILITE_BLOCAGE` source=`ical`.
  * Export iCal Hoostn optionnel vers Airbnb/Booking pour indispos manuelles.
* **Phase 2 (évolution)** :

  * Adoption **Airbnb Partner API** (si admissible) : webhooks bidirectionnels (rates, availability, reservations).
  * **Pré-requis** : conformité, QA sandbox Airbnb, SLA.

## 4) Tarification & taxes

* Tarifs gérés côté Hoostn (`TARIF_REGLE`) ; marge OTA appliquée localement pour affichage.
* Taxes de séjour par commune (`TAXE_COMMUNE`) injectées dans devis.

## 5) Fréquences / SLA

| Opération         | Fréquence  | SLA interne               |
| ----------------- | ---------- | ------------------------- |
| Pull iCal Airbnb  | 30–60 min  | < 3 min/lot               |
| Webhook Booking   | temps réel | ack < 2 s                 |
| Détection conflit | immédiat   | notif propriétaire + HITL |

## 6) Observabilité

* Journaliser chaque événement OTA dans `AUDIT_LOG` (`action=ota_webhook|ical_refresh`).
* Table `EMAIL_LOG/SMS_LOG` pour notifications.

---

# `/docs/tech/3.5_next_forge_migration_guide.md` — Architecture Next-Forge (migration guide)

## 1) Objectif

Mettre Hoostn sur **Next-Forge + Supabase + Vercel** avec Zustand, SSR Edge, Auth Supabase.

## 2) Environnements & variables

* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (routes serveur uniquement)
* `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
* `OPENROUTER_API_KEY` / `GEMINI_API_KEY`
* `BETTERSTACK_TOKEN`

## 3) Structure projet (extrait)

```
/app
  /(public)      -> pages publiques SSR
  /app           -> app auth (owner/worker/client)
  /api           -> routes REST (Edge-friendly)
  /ws            -> gateway temps réel
/lib
  /db            -> clients supabase, RLS helpers
  /stripe        -> helpers paiements
  /ota           -> booking/webhook + ical parser
  /ai            -> orchestrateur + prompts
/store           -> Zustand stores (UI only)
```

## 4) Auth Supabase

* **Magic Link** (email) ; session hydratée côté client.
* **Rôles** UI (guard) : `guest`, `owner/manager`, `employee`, `admin`.
* Policies RLS côté DB (jointes à `org_id`).

## 5) Datenbank & Migrations

* Utiliser **Supabase CLI** : `supabase db push` (expand) → backfill → (contract).
* PITR activé en prod ; backup quotidien.

## 6) SSR/ISR & cache

* Pages localisation SSR (Edge) + cache 5–15 min.
* ISR pour /lot/[slug] (photos, tarifs).

## 7) Zustand

* Stores UI (filtres, modales, stepper checkout, chat drawer).
* **Jamais** stocker de PII persistante dans Zustand.

## 8) Webhooks & CRON

* `/api/webhooks/stripe`, `/api/webhooks/booking` (Node runtime).
* CRON Edge : iCal refresh, anonymisation 30 j, rapports mensuels.

## 9) WebSocket Gateway

* Route `/ws/chat` (Edge runtime compatible) + fallback SSE.
* Auth via `Sec-WebSocket-Protocol: Bearer <jwt>`.

## 10) Tests & déploiements

* CI : lint, types, unit/int, E2E Playwright (preview URL), Lighthouse.
* CD : staging auto (main), prod sur tag + approbation.

---

# `/docs/tech/3.6_security_rgpd_architecture.md` — Sécurité & RGPD : architecture data

## 1) Classification & principes

* **PII** : utilisateurs, voyageurs, messages → **chiffrement au repos + RLS**.
* **Financier** : montants, factures → conservation 10 ans.
* **Techniques** : logs, traces IA → **rétention 30 j** (anonymisation).
* **Minimisation** : stocker le minimum nécessaire ; pas de données carte (Stripe only).

## 2) Contrôles techniques

* **Transport** : TLS 1.3 ; HSTS ; CSP stricte.
* **Au repos** : AES-256 (DB & Storage).
* **Accès** : RLS par `org_id` ; RBAC UI ; clés Service Role **serveur uniquement**.
* **Sauvegardes** : quotidiennes ; **PITR** activé prod.
* **Secrets** : OIDC + vault (Vercel/1Password) ; jamais en repo.

## 3) RLS (exemples de policies)

* `select on reservation where org_id() = reservation.org_id`
* `insert reservation` : seulement via RPC sécurisée qui vérifie appartenance `lot -> propriete -> org_id`.
* `thread/message` : visibilité par `thread_id` + rôle.

## 4) Journalisation & audit

* `AUDIT_LOG` : action, target, meta, ip, ts.
* `ai_trace` : tokens/latence/confiance ; **pseudonymiser** emails/téléphones.
* Filtrage PII dans logs applicatifs (middleware).

## 5) Rétention & anonymisation

| Donnée                  | Rétention | Action J+N                              |
| ----------------------- | --------- | --------------------------------------- |
| Messages/IA traces      | 30 jours  | anonymisation (remplacement emails/tél) |
| Réservations & factures | 10 ans    | archivage légal                         |
| Logs sécurité           | 12 mois   | purge                                   |
| Backups                 | 30 jours  | purge                                   |

CRON d’anonymisation quotidien ; rapport d’exécution dans `AUDIT_LOG`.

## 6) Droits RGPD & DPA

* **Export** : endpoint interne pour produire un ZIP (profil + réservations + messages).
* **Effacement** : soft-delete + anonymisation irréversible (réservations conservées sans PII).
* **Sous-traitants** : Stripe, Supabase, Vercel, Twilio, Resend, OpenRouter/Gemini (SCC si hors UE).
* **Notification incident** : sous 48 h au client (responsable de traitement) + assistance CNIL.

## 7) Sécurité applicative

* **SAST** (CodeQL) + **DAST** (OWASP ZAP baseline) en CI.
* Headers : `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy`.
* **Rate-limits** : API sensibles (paiement, booking) + WS chat (20 msg/min/thread).
* **Idempotency-Key** pour POST critiques (book, refund).

## 8) Plan de réponse aux incidents (résumé)

* Détection → triage (P1/P2) → containment → éradiquer → post-mortem (72 h).
* Communication aux clients affectés + registre incident interne.

---

**lot complet de migrations SQL Supabase (DDL + RLS)** correspondant à l’ERD.
Tu peux déposer ces fichiers tels quels dans `supabase/migrations/` (en les préfixant d’un horodatage si besoin).
Ils couvrent : extensions, types, tables, contraintes, fonctions d’extraction JWT, RLS activée + policies, index, buckets Storage.

> Hypothèses : les JWT incluent `org_id` et `role` dans les claims (Next-Forge/Supabase Auth). Le rôle `service_role` bypass RLS nativement.

---

# `supabase/migrations/01_init_extensions.sql`

```sql
-- Extensions utiles
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "postgis";
create extension if not exists "btree_gin";
create extension if not exists "pg_trgm";
```

---

# `supabase/migrations/02_types_enums.sql`

```sql
-- Rôles UI (référence app)
do $$ begin
  create type app_role as enum ('admin','owner','manager','employee','guest');
exception when duplicate_object then null end $$;

create type reservation_statut as enum ('pending','paid','cancelled','refunded');
create type thread_status as enum ('open','waiting_ia','escalated','assigned','resolved','closed');
create type task_status as enum ('todo','doing','done');
create type task_type as enum ('menage','maintenance','reassort');
create type canal_type as enum ('direct','booking','airbnb','email','inapp');
create type paiement_mode as enum ('full','hold-72h');
```

---

# `supabase/migrations/03_functions_security.sql`

```sql
-- Helpers pour RLS : extraction org_id et app_role depuis le JWT
create or replace function auth_org_id() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'org_id'
  ::uuid
$$;

create or replace function auth_app_role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role','guest')
$$;

-- Timestamps automatiques
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;
```

---

# `supabase/migrations/04_tables.sql`

```sql
-- ORGANISATION & UTILISATEUR
create table if not exists organisation (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  devise text default 'EUR',
  pays text default 'FR',
  tva text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists utilisateur (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  email text not null,
  role app_role not null default 'guest',
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, email)
);

-- PROPRIETE / LOT / EQUIPEMENTS
create table if not exists propriete (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  titre text not null,
  adresse text,
  ville text,
  quartier text,
  lat double precision,
  lng double precision,
  geohash text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lot (
  id uuid primary key default uuid_generate_v4(),
  propriete_id uuid not null references propriete(id) on delete cascade,
  slug text not null,
  nom text not null,
  chambres int default 0 check (chambres >= 0),
  lits int default 0 check (lits >= 0),
  sdb int default 0 check (sdb >= 0),
  capacite_adultes int not null default 1 check (capacite_adultes > 0),
  capacite_enfants int not null default 0 check (capacite_enfants >= 0),
  pets_allowed boolean not null default false,
  nightly_rate numeric(12,2) not null default 0,
  caution_amount numeric(12,2) default 0,
  currency text not null default 'EUR',
  photos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create table if not exists equipement (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  label text not null
);

create table if not exists lot_equipement (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  equipement_id uuid not null references equipement(id) on delete restrict,
  unique (lot_id, equipement_id)
);

-- Tarifs & disponibilités
create table if not exists tarif_regle (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  jour date not null,
  price numeric(12,2) not null check (price >= 0),
  min_stay int default 1 check (min_stay >= 1),
  cta boolean default true,  -- close-to-arrival autorisé
  ctd boolean default true,  -- close-to-departure autorisé
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  unique (lot_id, jour)
);

create table if not exists disponibilite_blocage (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  source text not null check (source in ('user','ota','ical')),
  reason text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

-- Canaux (OTA / direct)
create table if not exists annonce_canal (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  canal canal_type not null,
  external_id text,
  status text,
  ical_url text,
  created_at timestamptz not null default now(),
  unique (lot_id, canal)
);

-- Réservations / Paiement / Factures
create table if not exists reservation (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  source canal_type not null default 'direct',
  checkin date not null,
  checkout date not null,
  guests_adultes int not null default 1 check (guests_adultes > 0),
  guests_enfants int not null default 0 check (guests_enfants >= 0),
  pets boolean not null default false,
  montant numeric(12,2) not null default 0,
  devise text not null default 'EUR',
  statut reservation_statut not null default 'pending',
  fees_json jsonb not null default '{}'::jsonb,
  taxes_json jsonb not null default '{}'::jsonb,
  mode_paiement paiement_mode not null default 'full',
  customer_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (checkout > checkin)
);

create table if not exists payment_intent (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null references reservation(id) on delete cascade,
  provider text not null default 'stripe',
  stripe_payment_intent_id text not null,
  status text not null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  unique (stripe_payment_intent_id)
);

create table if not exists facture (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null references reservation(id) on delete cascade,
  org_id uuid not null references organisation(id) on delete cascade,
  total numeric(12,2) not null,
  devise text not null default 'EUR',
  pdf_url text,
  issued_at timestamptz not null default now()
);

-- Messagerie & HITL
create table if not exists thread (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid references reservation(id) on delete cascade,
  canal canal_type not null default 'inapp',
  language text default 'fr',
  status thread_status not null default 'open',
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists message (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references thread(id) on delete cascade,
  author_type text not null check (author_type in ('in','out','ia','agent')),
  author_id uuid,
  body text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists handoff (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references thread(id) on delete cascade,
  reason text not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  assigned_to uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  outcome text
);

-- Tâches employé
create table if not exists tache (
  id uuid primary key default uuid_generate_v4(),
  lot_id uuid not null references lot(id) on delete cascade,
  reservation_id uuid references reservation(id) on delete set null,
  type task_type not null,
  assigne_a uuid references utilisateur(id) on delete set null,
  due_at timestamptz not null,
  statut task_status not null default 'todo',
  checklist_json jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Logs & taxes
create table if not exists sms_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  to_msisdn text not null,
  template text,
  status text,
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists email_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  to_email text not null,
  template text,
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  actor_id uuid,
  action text not null,
  target text,
  meta jsonb not null default '{}'::jsonb,
  ip inet,
  ts timestamptz not null default now()
);

create table if not exists taxe_commune (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organisation(id) on delete cascade,
  commune text not null,
  insee text,
  taux_par_nuit numeric(10,2) not null default 0,
  plafond_par_personne numeric(10,2),
  devise text not null default 'EUR',
  updated_at timestamptz not null default now(),
  unique (org_id, commune)
);

-- Triggers updated_at
create trigger trg_utilisateur_updated before update on utilisateur
for each row execute function set_updated_at();
create trigger trg_propriete_updated before update on propriete
for each row execute function set_updated_at();
create trigger trg_lot_updated before update on lot
for each row execute function set_updated_at();
create trigger trg_reservation_updated before update on reservation
for each row execute function set_updated_at();
create trigger trg_tache_updated before update on tache
for each row execute function set_updated_at();
create trigger trg_thread_updated before update on thread
for each row execute function set_updated_at();
```

---

# `supabase/migrations/05_indexes.sql`

```sql
-- Recherche / perfs
create index if not exists idx_propriete_org on propriete(org_id);
create index if not exists idx_propriete_city on propriete(ville);
create index if not exists idx_lot_prop on lot(propriete_id);
create index if not exists idx_lot_slug on lot(slug);
create index if not exists idx_tarif_regle_lot_day on tarif_regle(lot_id, jour);
create index if not exists idx_dispo_lot_timerange on disponibilite_blocage(lot_id, start_at, end_at);
create index if not exists idx_resa_lot_dates on reservation(lot_id, checkin, checkout);
create index if not exists idx_resa_statut on reservation(statut);
create index if not exists idx_thread_resa on thread(reservation_id);
create index if not exists idx_message_thread on message(thread_id, created_at);
create index if not exists idx_tache_lot_due on tache(lot_id, due_at);
create index if not exists idx_email_log_org on email_log(org_id, created_at);
create index if not exists idx_sms_log_org on sms_log(org_id, created_at);
create index if not exists idx_audit_org_ts on audit_log(org_id, ts);
create index if not exists idx_taxe_org_commune on taxe_commune(org_id, commune);

-- Accélérer recherche texte
create index if not exists idx_propriete_ville_trgm on propriete using gin (ville gin_trgm_ops);
create index if not exists idx_propriete_quartier_trgm on propriete using gin (quartier gin_trgm_ops);
```

---

# `supabase/migrations/06_rls_enable.sql`

```sql
-- Activer RLS sur toutes les tables concernées
alter table organisation enable row level security;
alter table utilisateur enable row level security;
alter table propriete enable row level security;
alter table lot enable row level security;
alter table equipement enable row level security;
alter table lot_equipement enable row level security;
alter table tarif_regle enable row level security;
alter table disponibilite_blocage enable row level security;
alter table annonce_canal enable row level security;
alter table reservation enable row level security;
alter table payment_intent enable row level security;
alter table facture enable row level security;
alter table thread enable row level security;
alter table message enable row level security;
alter table handoff enable row level security;
alter table tache enable row level security;
alter table sms_log enable row level security;
alter table email_log enable row level security;
alter table audit_log enable row level security;
alter table taxe_commune enable row level security;
```

---

# `supabase/migrations/07_policies.sql`

```sql
-- Règle générale : visibilité par organisation via org_id() ou via jointure vers lot->propriete->org

-- ORGANISATION
create policy org_select_self on organisation
for select using (id = auth_org_id());

create policy org_update_admin on organisation
for update using (id = auth_org_id() and auth_app_role() in ('admin','owner','manager'));

-- UTILISATEUR
create policy user_select_same_org on utilisateur
for select using (org_id = auth_org_id());

create policy user_ins_same_org on utilisateur
for insert with check (org_id = auth_org_id() and auth_app_role() in ('admin','owner','manager'));

create policy user_upd_same_org on utilisateur
for update using (org_id = auth_org_id() and auth_app_role() in ('admin','owner','manager'));

-- PROPRIETE
create policy prop_select on propriete
for select using (org_id = auth_org_id());

create policy prop_mutate on propriete
for all using (org_id = auth_org_id() and auth_app_role() in ('admin','owner','manager'))
with check (org_id = auth_org_id());

-- LOT
create policy lot_select on lot
for select using (
  exists (select 1 from propriete p where p.id = lot.propriete_id and p.org_id = auth_org_id())
);

create policy lot_mutate on lot
for all using (
  auth_app_role() in ('admin','owner','manager')
  and exists (select 1 from propriete p where p.id = lot.propriete_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from propriete p where p.id = lot.propriete_id and p.org_id = auth_org_id())
);

-- EQUIPEMENTS (lecture globale OK), liaison lot_equipement restreinte par lot
create policy equip_select_all on equipement for select using (true);
create policy le_select on lot_equipement
for select using (
  exists (select 1 from propriete p join lot l on l.propriete_id=p.id
          where l.id = lot_equipement.lot_id and p.org_id = auth_org_id())
);
create policy le_mutate on lot_equipement
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from propriete p join lot l on l.propriete_id=p.id
          where l.id = lot_equipement.lot_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from propriete p join lot l on l.propriete_id=p.id
          where l.id = lot_equipement.lot_id and p.org_id = auth_org_id())
);

-- TARIFS
create policy tarif_select on tarif_regle
for select using (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = tarif_regle.lot_id and p.org_id = auth_org_id())
);
create policy tarif_mutate on tarif_regle
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = tarif_regle.lot_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = tarif_regle.lot_id and p.org_id = auth_org_id())
);

-- DISPONIBILITES
create policy dispo_select on disponibilite_blocage
for select using (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = disponibilite_blocage.lot_id and p.org_id = auth_org_id())
);
create policy dispo_mutate on disponibilite_blocage
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = disponibilite_blocage.lot_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = disponibilite_blocage.lot_id and p.org_id = auth_org_id())
);

-- ANNONCES CANAL
create policy canal_select on annonce_canal
for select using (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = annonce_canal.lot_id and p.org_id = auth_org_id())
);
create policy canal_mutate on annonce_canal
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = annonce_canal.lot_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = annonce_canal.lot_id and p.org_id = auth_org_id())
);

-- RESERVATION
create policy resa_select on reservation
for select using (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = reservation.lot_id and p.org_id = auth_org_id())
);
create policy resa_mutate on reservation
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = reservation.lot_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = reservation.lot_id and p.org_id = auth_org_id())
);

-- PAYMENT_INTENT (via reservation)
create policy pi_select on payment_intent
for select using (
  exists (select 1 from reservation r join lot l on l.id=r.lot_id
          join propriete p on p.id=l.propriete_id
          where r.id = payment_intent.reservation_id and p.org_id = auth_org_id())
);
create policy pi_mutate on payment_intent
for all using (
  auth_app_role() in ('admin','owner','manager') and
  exists (select 1 from reservation r join lot l on l.id=r.lot_id
          join propriete p on p.id=l.propriete_id
          where r.id = payment_intent.reservation_id and p.org_id = auth_org_id())
) with check (
  exists (select 1 from reservation r join lot l on l.id=r.lot_id
          join propriete p on p.id=l.propriete_id
          where r.id = payment_intent.reservation_id and p.org_id = auth_org_id())
);

-- FACTURE (via org)
create policy facture_select on facture
for select using (org_id = auth_org_id());
create policy facture_mutate on facture
for all using (auth_app_role() in ('admin','owner','manager') and org_id = auth_org_id())
with check (org_id = auth_org_id());

-- THREAD / MESSAGE / HANDOFF (via reservation -> lot -> propriete -> org)
create policy thread_select on thread
for select using (
  thread.reservation_id is null
  or exists (select 1 from reservation r join lot l on l.id=r.lot_id
             join propriete p on p.id=l.propriete_id
             where r.id = thread.reservation_id and p.org_id = auth_org_id())
);
create policy thread_mutate on thread
for all using (
  auth_app_role() in ('admin','owner','manager','employee')
  and (
    thread.reservation_id is null
    or exists (select 1 from reservation r join lot l on l.id=r.lot_id
               join propriete p on p.id=l.propriete_id
               where r.id = thread.reservation_id and p.org_id = auth_org_id())
  )
) with check (true);

create policy message_select on message
for select using (
  exists (select 1 from thread t join reservation r on r.id=t.reservation_id
          join lot l on l.id=r.lot_id join propriete p on p.id=l.propriete_id
          where t.id = message.thread_id and p.org_id = auth_org_id())
);
create policy message_insert on message
for insert with check (
  exists (select 1 from thread t join reservation r on r.id=t.reservation_id
          join lot l on l.id=r.lot_id join propriete p on p.id=l.propriete_id
          where t.id = message.thread_id and p.org_id = auth_org_id())
);

create policy handoff_select on handoff
for select using (
  exists (select 1 from thread t join reservation r on r.id=t.reservation_id
          join lot l on l.id=r.lot_id join propriete p on p.id=l.propriete_id
          where t.id = handoff.thread_id and p.org_id = auth_org_id())
);
create policy handoff_mutate on handoff
for all using (
  auth_app_role() in ('admin','owner','manager','employee') and
  exists (select 1 from thread t join reservation r on r.id=t.reservation_id
          join lot l on l.id=r.lot_id join propriete p on p.id=l.propriete_id
          where t.id = handoff.thread_id and p.org_id = auth_org_id())
) with check (true);

-- TACHE
create policy tache_select on tache
for select using (
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = tache.lot_id and p.org_id = auth_org_id())
);
create policy tache_mutate on tache
for all using (
  auth_app_role() in ('admin','owner','manager','employee') and
  exists (select 1 from lot l join propriete p on p.id=l.propriete_id
          where l.id = tache.lot_id and p.org_id = auth_org_id())
) with check (true);

-- LOGS (+ taxes)
create policy sms_select on sms_log for select using (org_id = auth_org_id());
create policy sms_insert on sms_log for insert with check (org_id = auth_org_id());

create policy email_select on email_log for select using (org_id = auth_org_id());
create policy email_insert on email_log for insert with check (org_id = auth_org_id());

create policy audit_select on audit_log for select using (org_id = auth_org_id());
create policy audit_insert on audit_log for insert with check (org_id = auth_org_id());

create policy taxe_select on taxe_commune for select using (org_id = auth_org_id());
create policy taxe_mutate on taxe_commune
for all using (auth_app_role() in ('admin','owner','manager') and org_id = auth_org_id())
with check (org_id = auth_org_id());
```

---

# `supabase/migrations/08_storage_buckets.sql`

```sql
-- Buckets pour médias & documents
-- (À créer via Supabase Storage UI ou SQL RPC si activé)
-- Recommandés :
--  - assets/lots (photos)
--  - documents/factures (PDF)
--  - tasks/photos (ménage)
```

---

# `supabase/migrations/09_grants.sql`

```sql
-- Droits de base : anon = accès public minimal (recherche), authenticated = app users
grant usage on schema public to anon, authenticated;

-- Les SELECT publics directs sont généralement évités (passer par RPC si nécessaire).
-- Ici, on ne donne pas d'accès explicite hors RLS ; ajuster au besoin via PostgREST.
```

---

## ✅ Notes d’implémentation

* **JWT claims** : s’assurer à la connexion que tu ajoutes `org_id` et `role` dans le token (Edge middleware).
* **Service Role** : les routes backend critiques (webhooks Stripe/Booking, CRON anonymisation) utiliseront la clé `service_role` et **bypassent RLS** (OK pour tâches système).
* **Vues / RPC** : si tu veux exposer une recherche publique `/public/search` sans auth, crée une **fonction SQL sécurisée** qui vérifie les paramètres et renvoie uniquement des champs non sensibles (je peux te la fournir).
* **Tests RLS** : ajoute un script `supabase/tests/rls.sql` pour simuler des JWT de différentes orgs et vérifier 403/OK (je peux te le générer).

Parfait ✅ Voici le **diagramme de séquence “OTA End-to-End”** pour **Hoostn.com**, illustrant le flux complet de réservation, synchronisation et paiement entre **Booking / Airbnb**, **Hoostn**, et **Stripe**.
Ce diagramme correspond à l’architecture décrite dans le cahier technique (v3.1 à v3.4).

---

# `/docs/tech/3.7_sequence_ota_end_to_end.mmd`

```mermaid
sequenceDiagram
    autonumber
    participant U as Voyageur (Booking / Airbnb / Direct)
    participant OTA as Plateforme OTA<br>(Booking.com / Airbnb)
    participant H as Hoostn.com<br>(Next-Forge + Supabase)
    participant DB as Supabase DB<br>(Reservations / Lots / Dispo)
    participant ST as Stripe Connect
    participant P as Propriétaire / Gestionnaire

    Note over U,H: 🔹 Cas 1 – Réservation via OTA (Booking / Airbnb)

    U->>OTA: Sélectionne un logement<br/>et confirme la réservation
    OTA-->>H: [Webhook] `booking.reservation.created`
    H->>DB: INSERT INTO reservation (source='booking', statut='pending')
    H->>DB: INSERT INTO disponibilite_blocage (source='ota')
    DB-->>H: OK
    H->>P: 📧 Email / SMS : “Nouvelle réservation OTA reçue”
    OTA-->>U: Confirmation OTA (numéro de réservation)
    Note over H,P: Les réservations OTA ne passent pas par Stripe<br/>le paiement est géré côté OTA.

    ...

    Note over U,H: 🔹 Cas 2 – Réservation directe via Hoostn.com

    U->>H: Recherche / Sélection du lot
    H->>DB: SELECT * FROM lots WHERE disponible(...)
    DB-->>H: Disponibilités OK
    U->>H: POST /public/book<br/>{lot_id, dates, mode: full ou hold-72h}
    H->>DB: Vérification conflits OTA<br/>(disponibilite_blocage)
    alt Mode = full
        H->>ST: Create PaymentIntent (capture immédiate)
    else Mode = hold-72h
        H->>ST: Create PaymentIntent (authorization only)
        H-->>ST: schedule capture 72h avant check-in
    end
    ST-->>H: payment_intent.succeeded
    H->>DB: INSERT INTO reservation (source='direct', statut='paid')
    H->>DB: UPDATE disponibilite_blocage (source='user')
    DB-->>H: OK
    H->>P: 📧 / SMS confirmation
    H->>U: Page confirmation + facture PDF (via Supabase Storage)
    H->>ST: Create Transfer to connected_account (Propriétaire)
    ST-->>H: ✅ transfert effectué (moins commission)
    H->>DB: INSERT INTO facture, payment_intent
    Note over H,ST: Stripe Connect gère la répartition (Hoostn / Propriétaire)

    ...

    Note over OTA,H: 🔹 Synchronisation inverse (OTA → Hoostn)

    OTA-->>H: [Webhook] Réservation annulée / modifiée
    H->>DB: UPDATE reservation statut='cancelled'
    H->>DB: DELETE disponibilite_blocage correspondant
    DB-->>H: OK
    H->>P: 📧 Notification “Annulation OTA détectée”

    ...

    Note over H,ST: 🔹 Synchronisation inverse (Hoostn → OTA)

    H->>DB: Nouvelle réservation directe (dates bloquées)
    H->>OTA: [iCal push] Export calendrier mis à jour
    OTA-->>U: Dates marquées “indisponibles”
    Note over H: CRON Edge 30–60min : Pull iCal / Push iCal

    ...

    Note over H,P: 🔹 Check-out client / automatisation

    DB->>H: Event “checkout reached”
    H->>DB: CREATE tache (type='menage', due_at=now+2h)
    H->>P: Notif employé (mobile web)
    P->>H: POST /employees/tasks/{id}/complete
    H->>DB: UPDATE tache statut='done'

    Note over H: 💡 Tous les événements clés sont journalisés dans<br/>`audit_log` (type=ota_webhook, stripe_event, task_done)
```

---

## 🧩 Explication fonctionnelle

### 1️⃣ Cas OTA → Hoostn (Booking/Airbnb)

* L’OTA notifie Hoostn via **Webhook** (`reservation.created` ou `ical`).
* Hoostn insère la réservation et bloque les dates correspondantes.
* Le **paiement** reste géré côté OTA (pas de Stripe Connect).
* Les données sont synchronisées en base (`RESERVATION`, `DISPONIBILITE_BLOCAGE`).

### 2️⃣ Cas Direct → Stripe → Propriétaire

* Le voyageur réserve sur Hoostn.com.
* Paiement via **Stripe Connect** :

  * Mode `full` = capture immédiate.
  * Mode `hold-72h` = capture différée.
* Après succès, Hoostn :

  * Crée la **réservation**, **blocage**, **facture**, **transfer**.
  * Envoie notifications mail/SMS.
* Le propriétaire reçoit son paiement via compte connecté.

### 3️⃣ Cas inverse : annulation ou modification OTA

* Booking/Airbnb envoie un webhook `cancelled/modified`.
* Hoostn met à jour la réservation, débloque les dates, notifie le propriétaire.
* Synchronisation inverse (Hoostn → OTA) via iCal export toutes les 30–60 min.

### 4️⃣ Post-séjour

* Hoostn crée automatiquement une tâche “ménage”.
* Employé notifié par SMS ou via interface `/app/worker`.
* Les statuts et photos de validation sont mis à jour dans `TACHE` + `AUDIT_LOG`.

---

## 🧠 Points techniques à noter

| Fonction                    | Détails techniques                                            |
| --------------------------- | ------------------------------------------------------------- |
| **Webhooks OTA**            | Signés avec secret partagé, idempotence par `event_id`.       |
| **Capture différée Stripe** | `capture_method=manual`, cron 72h avant check-in.             |
| **iCal sync**               | Pull cron (Edge) + push lors de mise à jour directe.          |
| **RLS Supabase**            | Chaque `lot` lié à `propriete.org_id` → cloisonnement strict. |
| **Logging**                 | `audit_log` + `email_log` + `sms_log` pour traçabilité RGPD.  |
| **Anonymisation post-30j**  | CRON Edge qui pseudonymise `message`, `customer` après délai. |



