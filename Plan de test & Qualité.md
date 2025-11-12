# Plan de test & Qualité

## 1) Objectifs qualité (gates)

* **Disponibilité** ≥ 99,5 % (prod)
* **Double réservation** < 1 ‰
* **Paiements** : 0 faux positifs de capture / remboursements cohérents
* **Couverture** : Unit ≥ 80 %, Intégration ≥ 70 %, E2E scénarios critiques 100 %
* **Perf Web** (Lighthouse) : PWA ≥ 90 / SEO ≥ 95 / A11y ≥ 95
* **Sécurité** : 0 vulnérabilité High/Critical (SAST/DAST)

## 2) Périmètre de tests

* **Unit** (Vitest/Jest) : utils, prix, taxes, parsing iCal, guards RLS.
* **Intégration** (Supertest) : API Next (quote, book, webhooks Stripe/Booking).
* **Contract tests** (Pact) : schémas Webhooks & API publiques.
* **E2E** (Playwright) : recherche → devis → réservation (full / hold-72h) → facture → annulation.
* **Sécurité** : SAST (CodeQL), DAST (OWASP ZAP baseline), dependency audit.
* **Accessibilité** : axe-core (CI) + Playwright a11y checks.
* **SEO/Perf** : Lighthouse CI (pages /, /search, /paris/11e, /lot/[slug]).
* **RLS Supabase** : tests SQL via `pgTAP` ou scripts Node avec JWT de rôles différents.
* **Chat temps réel** : WS/SSE, handoff HITL, dégradations.
* **Backups & restauration** : test mensuel (restore dry-run).
* **Rétention/anonymisation RGPD** : job CRON testé (30 j).

## 3) Jeux de données & fixtures

* **Seed** minimal : 1 org, 2 biens, 3 lots, tarifs, taxes, 1 calendrier iCal, 1 compte Stripe Connect (mock), 1 réservation OTA, 1 directe.
* **Mock Stripe** : Stripe CLI + `stripe-mock` pour CI.
* **Mock Booking** : simulateur webhook (payloads typiques).
* **Photos** : 3 images de test (Supabase Storage bucket `test-assets/`).

## 4) Scénarios E2E critiques (Playwright)

1. **Réservation FULL (CB immédiate)**

   * Search → Lot → Quote → Checkout → `payment_intent.succeeded` → facture PDF visible.
2. **Réservation HOLD-72h**

   * Search → Lot → Quote → Book (pending) → job capture J-3 → statut `paid`.
3. **Annulation & refund**

   * Annulation avant capture (auto-cancel) / après capture (refund partiel).
4. **Synchro OTA**

   * Webhook Booking “reservation created” → calendrier bloqué / pas de double booking.
   * iCal Airbnb import → slot bloqué, quote indisponible.
5. **HITL**

   * Confiance < 0,6 → handoff → agent répond → retour IA.
6. **RLS**

   * Un user d’une autre org ne voit pas les reservations/lots (403).
7. **SEO SSR**

   * `/paris/11e` rendu SSR, balises meta, schema.org valides.

## 5) Mesures automatiques de qualité

* **Lint/Format** : ESLint + Prettier, `--max-warnings=0`.
* **Types** : `tsc --noEmit`.
* **Bundle size budget** : `<= 250 KB` gz pour la page / (CI échoue si dépassé).
* **Lighthouse** : seuils (Perf ≥ 85, A11y ≥ 95, SEO ≥ 95).
* **Axe** : 0 violation “serious/critical”.
* **k6** (optionnel perf API) : 95e percentile < 300 ms sur `/public/search`.

## 6) Matrice environnements

| Env         | Domaine            | DB              | Stripe      | But             |
| ----------- | ------------------ | --------------- | ----------- | --------------- |
| **Local**   | localhost          | supabase local  | Stripe test | dev & debug     |
| **Preview** | *.vercel.app       | Supabase branch | Stripe test | PRs (ephemeral) |
| **Staging** | staging.hoostn.com | DB staging      | Stripe test | QA intégrée     |
| **Prod**    | app.hoostn.com     | DB prod         | Stripe live | clients         |

> **Règle** : migrations **d’abord** sur Preview → Staging → Prod (expand/contract), avec rollback.

## 7) Checklist avant mise en prod

* [ ] Migrations OK en Staging
* [ ] E2E Playwright **verts**
* [ ] Lighthouse ≥ seuils
* [ ] SAST/DAST OK (0 High/Critical)
* [ ] Backup DB récent (< 24 h)
* [ ] Plan de rollback (tag précédent) disponible

---

# 🚀 `docs/tech/06_ci_cd_deploiement_vercel.md` — CI/CD & Déploiement

## 1) Objectifs

* **Automatiser** tests et qualité à chaque PR.
* **Prévisualisations Vercel** par PR (URL unique).
* **Déploiements protégés** (Staging auto, Prod avec approbation).
* **Migrations Supabase** orchestrées et sûres.

## 2) Pipeline (GitHub Actions)

### 2.1 Vue d’ensemble

1. **CI (push/PR)** : Lint → Typecheck → Unit/Int → Build → E2E (preview) → Lighthouse → A11y → SAST.
2. **CD Staging (merge main)** : Migrations DB → Deploy Vercel Staging → Smoke tests → Notif Slack.
3. **CD Prod (tag `vX.Y.Z`)** : Approval → Migrations DB → Deploy Vercel Prod → Post-deploy tests → Notif.

### 2.2 Secrets requis

* `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
* `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL_*` (per env)
* `STRIPE_SECRET_KEY_*`, `STRIPE_WEBHOOK_SECRET_*`
* `NEXT_PUBLIC_*` publics
* `SLACK_WEBHOOK_URL` (optionnel)

### 2.3 Exemple CI (GitHub Actions)

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: corepack enable
      - run: pnpm i --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit
      - run: pnpm test:int
      - run: pnpm build

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i --frozen-lockfile
      - name: Deploy Preview to Vercel
        run: |
          npx vercel pull --yes --environment=preview --token ${{ secrets.VERCEL_TOKEN }}
          npx vercel build --token ${{ secrets.VERCEL_TOKEN }}
          URL=$(npx vercel deploy --prebuilt --token ${{ secrets.VERCEL_TOKEN }})
          echo "PREVIEW_URL=$URL" >> $GITHUB_ENV
      - name: Run Playwright on Preview
        run: |
          npx playwright install --with-deps
          PREVIEW_URL="${{ env.PREVIEW_URL }}" pnpm test:e2e
      - name: Lighthouse CI
        run: |
          npm i -g @lhci/cli
          LHCI_BUILD_CONTEXT__CURRENT_BRANCH=$GITHUB_HEAD_REF \
          lhci autorun --collect.url="$PREVIEW_URL"
```

### 2.4 Déploiement Staging

```yaml
name: cd-staging
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm i --frozen-lockfile
      - name: Apply Supabase migrations (expand)
        run: pnpm db:migrate:staging
      - name: Deploy to Vercel Staging
        run: |
          npx vercel pull --yes --environment=preview --token ${{ secrets.VERCEL_TOKEN }}
          npx vercel build --token ${{ secrets.VERCEL_TOKEN }}
          npx vercel deploy --prebuilt --token ${{ secrets.VERCEL_TOKEN }} --prod --yes --scope ${{ secrets.VERCEL_ORG_ID }}
      - name: Smoke tests
        run: pnpm test:smoke:staging
```

### 2.5 Déploiement Prod (avec approbation)

```yaml
name: cd-prod
on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.hoostn.com
    steps:
      - uses: actions/checkout@v4
      - run: pnpm i --frozen-lockfile
      - name: Manual approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: tommy, david
          minimum-approvals: 1
      - name: Supabase migrations (expand)
        run: pnpm db:migrate:prod
      - name: Vercel deploy
        run: |
          npx vercel pull --yes --environment=production --token ${{ secrets.VERCEL_TOKEN }}
          npx vercel build --prod --token ${{ secrets.VERCEL_TOKEN }}
          npx vercel deploy --prebuilt --prod --token ${{ secrets.VERCEL_TOKEN }}
      - name: Post-deploy checks
        run: pnpm test:smoke:prod
```

## 3) Stratégie migrations DB (expand/contract)

* **Expand** : ajouter colonnes/tables sans casser l’existant → déployer app.
* **Backfill** : tâches SQL/cron pour peupler nouvelles colonnes.
* **Contract** : supprimer anciens champs **après** vérification logs.
* **Rollback** : script `db:rollback --to <timestamp>` + restauration snapshot.

## 4) Scripts NPM recommandés

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:int": "vitest run -c vitest.int.config.ts",
    "test:e2e": "playwright test",
    "test:smoke:staging": "playwright test --config=playwright.staging.ts --grep @smoke",
    "test:smoke:prod": "playwright test --config=playwright.prod.ts --grep @smoke",
    "lhci": "lhci autorun",
    "db:migrate:staging": "supabase db push --db-url $SUPABASE_DB_URL_STAGING",
    "db:migrate:prod": "supabase db push --db-url $SUPABASE_DB_URL_PROD",
    "db:rollback": "supabase db reset --db-url $SUPABASE_DB_URL_TARGET"
  }
}
```

## 5) Exemples de tests critiques

### 5.1 Prix & taxes (unit)

```ts
it("calcule total = nuits + ménage + taxe", () => {
  const total = computeTotal({ nights: 5, price: 120, cleaning: 40, cityTax: 10 });
  expect(total).toBe(650);
});
```

### 5.2 Webhook Stripe (intégration)

```ts
it("marque la réservation payée à payment_intent.succeeded", async () => {
  // mock event → call route → expect DB reservation.statut = 'paid'
});
```

### 5.3 Double booking (E2E)

* Créer résa Booking (webhook).
* Tenter réservation directe mêmes dates → attendre `409`.

## 6) Sécurité (SAST/DAST & policies)

* **SAST** : CodeQL Action (JS/TS).
* **DAST** : OWASP ZAP baseline sur Staging (CRON quotidien).
* **Dependabot** : maj automatiques weekly.
* **Secrets** : GitHub OIDC + Vercel/1Password, jamais en clair.
* **Headers** : CSP stricte, HSTS, sameSite cookies, no-referrer.

## 7) Observabilité & alerting

* **Logs** : BetterStack/Logtail (Edge & API).
* **Metrics** : Vercel Analytics + custom (95e resp time, error rate).
* **Alertes** : Slack webhook (déploiement, échec CI, erreurs 5xx > seuil).

## 8) Stratégie de rollback

* **App** : redeploy tag précédent (`vercel rollback` ou redeploy commit-1).
* **DB** : rollback migration + restore snapshot (Supabase PITR si activé).
* **Données Stripe** : idempotency keys → pas de double capture.

## 9) Checklist RGPD en CI

* [ ] Tests d’anonymisation J+30 passent.
* [ ] Exports “droit d’accès” génèrent un ZIP complet.
* [ ] Aucune PII dans logs (`filters` actifs).

---

### 🔚 Résumé exécutable

* CI rigoureuse (lint, types, tests, perf, a11y, SAST).
* E2E couvrant **paiement**, **hold-72h**, **OTA**, **HITL**, **RLS**.
* CD sécurisé : **Staging auto**, **Prod sur approbation**, **migrations contrôlées**.
