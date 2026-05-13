# Au fil des semis

> Un carnet vivant, partagé, où l'on suit ses semis saison après saison.

Site web et web app autour du potager : bibliothèque de fiches plantes, journal de semis personnel, et communauté de jardiniers (francophone, focus Belgique).

Voir [`BRAINSTORM.md`](./BRAINSTORM.md) pour le cadrage complet (audience, modèle de données, DA, RGPD, périmètre MVP).

## Stack

- **Next.js 16** App Router en mode `standalone`
- **Payload CMS 3** (intégré dans la même app)
- **PostgreSQL** (container)
- **Resend** (email transactionnel + newsletter Broadcasts)
- **nginx + certbot** (reverse proxy global du VPS, mutualisé avec d'autres projets) + Cloudflare en edge
- **Docker + docker-compose** (déploiement VPS OVH)
- **Vitest** (tests intégration) + **Playwright** (e2e)

## Démarrage local

```bash
pnpm install
cp .env.example .env       # puis renseigner les valeurs
docker compose up postgres -d
pnpm dev
```

App : http://localhost:3000 — Admin Payload : http://localhost:3000/admin

## Scripts

| Commande | Effet |
|---|---|
| `pnpm dev` | Démarre Next + Payload en mode dev |
| `pnpm build` | Build de production (standalone) |
| `pnpm start` | Démarre le build de prod |
| `pnpm seed` | Insère les 6 fiches plantes initiales |
| `pnpm generate:types` | Régénère `payload-types.ts` après changement de collection |
| `pnpm generate:importmap` | Régénère l'import map du panneau admin |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest + Playwright |
