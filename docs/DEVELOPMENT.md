# 🛠️ Guide de Développement - Hoostn

## Architecture Technique

### Stack Complet

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Base de données**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (Magic Link)
- **Realtime**: Supabase Realtime (WebSocket)
- **Storage**: Supabase Storage
- **Paiements**: Stripe Connect
- **IA**: Gemini (via OpenRouter)
- **Email**: Resend / Postmark
- **SMS**: Twilio / Vonage
- **Déploiement**: Vercel
- **CI/CD**: GitHub Actions

## Conventions de Code

### TypeScript

- Utiliser des types stricts (`strict: true`)
- Préférer les interfaces aux types pour les objets
- Utiliser les types générés depuis Supabase

### React

- Composants fonctionnels uniquement
- Hooks personnalisés pour la logique réutilisable
- Server Components par défaut, Client Components si nécessaire

### Naming

- **Fichiers**: kebab-case pour les fichiers (ex: `user-profile.tsx`)
- **Composants**: PascalCase (ex: `UserProfile`)
- **Fonctions**: camelCase (ex: `getUserProfile`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `MAX_UPLOAD_SIZE`)

### Structure des Composants

```tsx
// 1. Imports
import { useState } from 'react';
import { Button } from '@/ui/button';

// 2. Types
interface UserProfileProps {
  userId: string;
}

// 3. Component
export function UserProfile({ userId }: UserProfileProps) {
  // Hooks
  const [isLoading, setIsLoading] = useState(false);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Base de Données

### Schéma Principal

- `organizations` - Multi-tenant
- `users` - Utilisateurs liés aux organisations
- `properties` - Propriétés immobilières
- `lots` - Unités locatives
- `reservations` - Réservations
- `threads` - Fils de discussion
- `messages` - Messages du chat
- `ai_traces` - Traces IA pour monitoring
- `handoffs` - Escalades HITL

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour l'isolation multi-tenant :

```sql
-- Exemple : isolation par org_id
CREATE POLICY "org_isolation" ON lots
  FOR ALL USING (org_id IN (
    SELECT org_id FROM users WHERE id = auth.uid()
  ));
```

### Migrations

```bash
# Créer une nouvelle migration
supabase migration new migration_name

# Appliquer les migrations
npm run db:push

# Réinitialiser la DB (dev uniquement)
npm run db:reset
```

## API Routes

### Structure

```
apps/web/app/api/
├── auth/
├── properties/
├── reservations/
├── chat/
└── webhooks/
```

### Exemple d'API Route

```typescript
// apps/web/app/api/properties/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('properties')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

## Chat IA & HITL

### Architecture

1. **Client** → WebSocket/SSE → **Gateway**
2. **Gateway** → **Orchestrateur IA** → **LLM + Outils**
3. Si confiance < 0.6 → **Handoff** → **Agent Humain**

### Outils IA

- `availability.quote` - Vérifier disponibilité et prix
- `calendar.check_conflict` - Détecter conflits
- `policy.get` - Récupérer politiques d'annulation
- `support.escalate` - Escalader vers humain

## Tests

### Tests Unitaires (Jest)

```bash
npm test
```

```typescript
// Example test
import { calculateTotalPrice } from './pricing';

describe('calculateTotalPrice', () => {
  it('should calculate price with cleaning fee', () => {
    const result = calculateTotalPrice({
      basePrice: 100,
      nights: 3,
      cleaningFee: 50,
    });
    expect(result).toBe(350);
  });
});
```

### Tests E2E (Playwright)

```bash
npm run test:e2e
```

```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test('user can create a reservation', async ({ page }) => {
  await page.goto('/properties/1');
  await page.fill('[name="check_in"]', '2025-12-10');
  await page.fill('[name="check_out"]', '2025-12-15');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=Réservation confirmée')).toBeVisible();
});
```

## Déploiement

### Environnements

- **Local**: `http://localhost:3000`
- **Staging**: `https://staging.hoostn.com`
- **Production**: `https://hoostn.com`

### Variables d'Environnement

Toutes les variables doivent être configurées dans :
- Vercel (pour production/staging)
- `.env.local` (pour développement local)

### Process de Déploiement

1. **PR** → Tests CI/CD → Preview Vercel
2. **Merge** sur `main` → Déploiement automatique Production
3. **Migrations DB** : Appliquées manuellement avant deploy

## Monitoring & Logs

### Supabase Studio

- Logs en temps réel
- Métriques de performance
- Requêtes SQL

### Vercel Analytics

- Performance web
- Core Web Vitals
- Erreurs runtime

## Bonnes Pratiques

### Performance

- ✅ Server Components par défaut
- ✅ Images optimisées (next/image)
- ✅ Lazy loading des composants lourds
- ✅ Mise en cache des requêtes API

### Sécurité

- ✅ Validation Zod sur tous les inputs
- ✅ Sanitization des données utilisateur
- ✅ RLS sur toutes les tables
- ✅ Rate limiting sur les API sensibles

### UX

- ✅ Loading states partout
- ✅ Error boundaries
- ✅ Messages d'erreur clairs
- ✅ Feedback utilisateur immédiat

## Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Des questions ? Contactez l'équipe dev : dev@hoostn.com
