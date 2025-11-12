# 1) Schéma d’architecture – Hoostn.com (Next-Forge • Supabase • Vercel)

```mermaid
flowchart LR
  subgraph Client["Clients & UIs"]
    A0[Public: /, /search, /paris/11e, /lot/[slug], /checkout]
    A1[Client App: /app/me]
    A2[Pro/Owner: /app/owner]
    A3[Employé: /app/worker]
    A4[Admin Hoostn: /app/admin]
  end

  subgraph Vercel["Frontend & API - Vercel (Edge + Node)"]
    B0[Next-Forge SSR/ISR\nEdge Runtime pour /public/*]
    B1[API Routes REST/GraphQL]
    B2[Webhooks: /api/webhooks/stripe]
    B3[Webhooks: /api/webhooks/booking]
    B4[Cron/Jobs: iCal refresh (Edge Cron)]
    B5[Workers légers (queue in-DB)]
  end

  subgraph Supabase["Supabase (UE)"]
    C0[(PostgreSQL + RLS)]
    C1[Auth (Magic Link)]
    C2[Storage (photos, PDFs)]
    C3[Realtime (notifs)]
    C4[Logs (SQL + ext.)]
  end

  subgraph Ext["Services externes"]
    D0[Stripe Connect]
    D1[Twilio/Vonage (SMS)]
    D2[Resend/Postmark (Email)]
    D3[Booking.com Connectivity API]
    D4[Airbnb iCal endpoints]
    D5[Gemini/OpenRouter (IA)]
  end

  Client -->|HTTP/HTTPS| B0
  A0 -->|Recherche/Checkout| B1
  A1 --> B1
  A2 --> B1
  A3 --> B1
  A4 --> B1

  B1 <-->|JWT (Supabase)| C1
  B1 <--> C0
  B1 <--> C2
  B1 --> D0
  B1 --> D1
  B1 --> D2
  B1 --> D5

  D0 --> B2
  D3 --> B3
  B4 --> D4
  B1 --> C3
  B1 --> C4
```

**Principes clés**

* **Public SSR** sur Vercel Edge pour SEO (pages villes/quartiers, résultats).
* **API** unique Next-Forge (routes REST) + **Webhooks** (Stripe, Booking).
* **Auth Supabase** (Magic Link + JWT) et **RLS** stricte par organisation.
* **iCal Airbnb** : job Edge Cron (30–60 min) + refresh manuel.
* **Stripe Connect** : paiements, dépôts, remboursements; **SMS** uniquement informationnels.
* **IA** (Gemini/OpenRouter) pour chat contextuel + **Human-in-the-Loop**.

---

# 2) ERD – Modèle relationnel (Mermaid)

> À placer tel quel dans `docs/tech/02_erd_hoostn.mmd`

```mermaid
erDiagram
  ORGANISATION ||--o{ UTILISATEUR : has
  ORGANISATION ||--o{ PROPRIETE : owns
  PROPRIETE ||--o{ LOT : includes
  LOT ||--o{ TARIF_REGLE : priced_by
  LOT ||--o{ DISPONIBILITE_BLOCAGE : blocked_by
  LOT ||--o{ ANNONCE_CANAL : listed_on
  LOT ||--o{ RESERVATION : booked_in
  RESERVATION ||--o{ PAYMENT_INTENT : paid_by
  RESERVATION ||--o{ MESSAGE : has
  RESERVATION ||--o{ FACTURE : invoiced_by
  RESERVATION ||--o{ TACHE : triggers
  LOT ||--o{ LOT_EQUIPEMENT : has
  EQUIPEMENT ||--o{ LOT_EQUIPEMENT : link
  UTILISATEUR ||--o{ TACHE : executes
  UTILISATEUR ||--o{ THREAD : participates
  THREAD ||--o{ MESSAGE : contains
  RESERVATION ||--o{ THREAD : opens
  ORGANISATION ||--o{ SMS_LOG : emits
  ORGANISATION ||--o{ AUDIT_LOG : produces

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
    text email
    text role  // admin|owner|manager|employee|guest
    uuid org_id FK
    timestamptz last_login
    timestamptz created_at
  }
  PROPRIETE {
    uuid id PK
    uuid org_id FK
    text titre
    text adresse
    float lat
    float lng
    text description
    text geohash
  }
  LOT {
    uuid id PK
    uuid propriete_id FK
    text nom
    int chambres
    int lits
    int sdb
    int capacite_adultes
    int capacite_enfants
    boolean pets_allowed
    float surface
    numeric caution_amount
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
    text currency
    boolean cta // closed-to-arrival
    boolean ctd // closed-to-departure
  }
  DISPONIBILITE_BLOCAGE {
    uuid id PK
    uuid lot_id FK
    text source  // user|ota|ical
    timestamptz start
    timestamptz end
    text reason
  }
  ANNONCE_CANAL {
    uuid id PK
    uuid lot_id FK
    text canal // booking|airbnb|direct
    text external_id
    text status
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
    jsonb fees_json   // frais de ménage, etc.
    jsonb taxes_json  // taxe de séjour
    text mode_paiement // full|hold-72h
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
    text canal // direct|booking|airbnb|email|sms
    timestamptz opened_at
  }
  MESSAGE {
    uuid id PK
    uuid thread_id FK
    text direction // in|out
    text body
    jsonb metadata_json // attachments, provider ids
    timestamptz created_at
  }
  TACHE {
    uuid id PK
    uuid lot_id FK
    uuid reservation_id
    text type // menage|maintenance
    uuid assigne_a // user id (employee)
    timestamptz due_at
    text statut // todo|doing|done
    jsonb checklist_json
    jsonb photos // signed URLs
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
```

---

# 3) Spécification API (OpenAPI 3.0 – extrait complet MVP)

> À placer dans `docs/tech/03_api_openapi.yaml`
> (Tu peux l’étendre tel quel dans Swagger/Stoplight)

```yaml
openapi: 3.0.3
info:
  title: Hoostn API
  version: "1.0.0"
  description: >
    API publique et privée de Hoostn.com (MVP).
    - Public: recherche, quote, réservation.
    - Auth: Supabase JWT (Magic Link), RLS par organisation.
    - Webhooks: Stripe, Booking.com.
servers:
  - url: https://api.hoostn.com/v1

tags:
  - name: Public
  - name: Booking
  - name: Reservations
  - name: Payments
  - name: Messaging
  - name: Employees
  - name: Webhooks
  - name: Admin

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    stripeSig:
      type: apiKey
      in: header
      name: Stripe-Signature
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
        page: { type: integer, minimum: 1 }
        per_page: { type: integer, minimum: 1, maximum: 100 }
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
        mode:
          type: string
          enum: [full, hold-72h]   # paiement intégral ou résa gratuite 72h
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

security:
  - bearerAuth: []

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
                  results:
                    type: array
                    items: { $ref: "#/components/schemas/SearchResult" }
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
        "200":
          description: OK
          content:
            application/json: { schema: { $ref: "#/components/schemas/QuoteResponse" } }
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
        "201":
          description: Réservation créée
          content:
            application/json: { schema: { $ref: "#/components/schemas/BookingCreateResponse" } }
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
      security: [{ bearerAuth: [] }]
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
      security: [{ bearerAuth: [] }]
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
      security: [{ bearerAuth: [] }]
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
      summary: Envoi de message (email/sms/in-app) — SMS info only
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [channel, to, body]
              properties:
                channel: { type: string, enum: [email, sms, inapp] }
                to: { type: string }
                body: { type: string }
                template: { type: string, nullable: true }
      responses:
        "202": { description: Accepté }

  /chat/assist:
    post:
      tags: [Messaging]
      summary: Réponse IA contextualisée (Gemini/OpenRouter)
      security: [{ bearerAuth: [] }]
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
      tags: [Booking]
      summary: Ajoute une URL iCal Airbnb à un lot
      security: [{ bearerAuth: [] }]
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
        "204": { description: Import configuré }

  /channels/ical/refresh:
    post:
      tags: [Booking]
      summary: Force le refresh iCal (pull immédiat)
      security: [{ bearerAuth: [] }]
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
      tags: [Webhooks, Payments]
      summary: Webhook Stripe (paiements, remboursements, dispute)
      security: [{ stripeSig: [] }]
      responses:
        "200": { description: ok }
        "400": { description: signature invalide }

  /webhooks/booking:
    post:
      tags: [Webhooks, Booking]
      summary: Webhook Booking.com (réservation/modif/annulation)
      responses:
        "200": { description: ok }

```

**Conventions d’API**

* **Auth**: `Authorization: Bearer <supabase-jwt>` (sauf /public/* et webhooks).
* **Idempotency**: header `Idempotency-Key` recommandé pour POST sensibles (/public/book).
* **Pagination**: `page`, `per_page`, `next_cursor`.
* **Erreurs**: `{ error, code, details }`.
* **RLS**: toute requête non publique est restreinte à `org_id` de l’utilisateur.
