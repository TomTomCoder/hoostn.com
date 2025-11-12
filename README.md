# 🏠 Hoostn.com

> **Gérez vos locations, pas vos complications.**

Hoostn est une plateforme SaaS moderne de gestion automatisée des locations saisonnières, conçue pour simplifier la vie des propriétaires, conciergeries et gestionnaires immobiliers.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

## 🎯 Objectif

Centraliser et automatiser la gestion complète des locations saisonnières :
- 🔄 Synchronisation temps réel avec Airbnb & Booking.com
- 💳 Réservations directes avec paiement Stripe Connect
- 🤖 Chat IA contextualisé avec HITL (Human-in-the-Loop)
- 📊 Analytics et reporting avancés
- 👥 Gestion du personnel (ménage, maintenance)
- 📱 Interface responsive et moderne

## 🏗️ Architecture

### Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Base de données**: Supabase (PostgreSQL + RLS)
- **Authentication**: Supabase Auth (Magic Link)
- **Paiements**: Stripe Connect
- **IA**: Gemini + OpenRouter
- **Styling**: Tailwind CSS
- **État**: Zustand
- **Déploiement**: Vercel

### Structure du Projet

```
hoostn.com/
├── apps/
│   └── web/                    # Application Next.js principale
│       ├── app/               # App Router (pages & layouts)
│       ├── components/        # Composants React
│       └── lib/              # Utilitaires & helpers
├── packages/
│   ├── ui/                   # Composants UI partagés
│   ├── database/             # Schémas & types DB
│   └── config/               # Configurations partagées
├── supabase/
│   ├── migrations/           # Migrations de base de données
│   └── functions/            # Edge Functions
├── docs/
│   ├── product/              # Documentation produit
│   ├── technical/            # Documentation technique
│   ├── legal/                # Documents juridiques
│   └── brand/                # Brand Kit
└── .github/
    └── workflows/            # CI/CD GitHub Actions
```

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Un compte Supabase
- Un compte Stripe

### Configuration locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/hoostn/hoostn.com.git
   cd hoostn.com
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env.local
   ```

   Éditer `.env.local` avec vos clés API :
   - Supabase (URL + clés)
   - Stripe (clés + webhook secret)
   - Services email/SMS
   - Clés API IA

4. **Démarrer Supabase local**
   ```bash
   npm run supabase:start
   ```

5. **Appliquer les migrations**
   ```bash
   npm run db:push
   ```

6. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

7. **Ouvrir l'application**
   - Application : [http://localhost:3000](http://localhost:3000)
   - Supabase Studio : [http://localhost:54323](http://localhost:54323)

## 📝 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancer le serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Démarrer le serveur de production |
| `npm run lint` | Vérification ESLint |
| `npm test` | Tests unitaires Jest |
| `npm run test:e2e` | Tests E2E Playwright |
| `npm run db:push` | Appliquer les migrations Supabase |
| `npm run db:reset` | Réinitialiser la base de données |
| `npm run supabase:start` | Démarrer Supabase local |
| `npm run type-check` | Vérification TypeScript |

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests E2E
npm run test:e2e

# Tests en watch mode
npm run test:watch
```

## 📚 Documentation

- **[Vision Produit](./docs/product/Vision%20produit%20%26%20positionnement.md)** - Stratégie et positionnement
- **[Cahier des charges](./docs/product/Cahier%20des%20charges%20fonctionnel%20%E2%80%93%20Hoostn.com.md)** - Spécifications fonctionnelles
- **[Architecture Technique](./docs/technical/)** - Documentation technique complète
- **[Brand Kit](./docs/brand/Brand%20Kit.md)** - Identité visuelle et guidelines
- **[Roadmap](./docs/product/Roadmap%20Produit.md)** - Feuille de route produit

## 🎨 Design System

Hoostn utilise un design system basé sur Tailwind CSS avec :
- **Couleurs** : Bleu primaire (#1F3A8A), Vert accent (#00C48C)
- **Typographie** : Inter (UI), Source Code Pro (code)
- **Mode sombre** : Support complet
- **Composants** : Bibliothèque UI personnalisée

## 🔒 Sécurité & RGPD

- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Multi-tenant avec isolation par organisation
- ✅ Données hébergées en UE
- ✅ Conformité RGPD
- ✅ Anonymisation automatique après 30 jours

## 🤝 Contribution

Ce projet est actuellement propriétaire. Pour toute question ou suggestion :
- Email : [support@hoostn.com](mailto:support@hoostn.com)

## 📄 Licence

Proprietary - © 2025 Hoostn SASU. Tous droits réservés.

## 🔗 Liens utiles

- **Production** : [https://hoostn.com](https://hoostn.com)
- **Documentation** : [https://docs.hoostn.com](https://docs.hoostn.com)
- **Support** : [support@hoostn.com](mailto:support@hoostn.com)

---

Construit avec ❤️ par l'équipe Hoostn
