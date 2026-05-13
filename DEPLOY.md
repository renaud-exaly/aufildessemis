# Déploiement — Au fil des semis

Stack identique à cocon-detre : **Docker + docker-compose**, **Postgres**, **Caddy** (TLS auto Let's Encrypt), cron pour les rappels. Hébergement VPS OVH.

## Prérequis serveur

- Docker + docker-compose v2
- Domaine `aufildessemis.be` pointant (A/AAAA) vers l'IP du VPS
- Ports 80 et 443 ouverts (firewall + groupe de sécurité OVH)
- Comptes Resend configurés (domaine vérifié SPF/DKIM/DMARC)

## Première mise en route (profil `standalone` avec Caddy embarqué)

```bash
# 1. Cloner le projet sur le serveur
git clone <repo> /opt/au-fil-des-semis
cd /opt/au-fil-des-semis

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env :
#   - PAYLOAD_SECRET (openssl rand -base64 32)
#   - POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
#   - DATABASE_URI (cohérent avec les 3 ci-dessus)
#   - PAYLOAD_PUBLIC_SERVER_URL = https://aufildessemis.be
#   - DOMAIN = aufildessemis.be
#   - CADDY_EMAIL = admin@aufildessemis.be
#   - RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_AUDIENCE_ID
#   - CRON_SECRET (openssl rand -base64 32)

# 3. Copier le Caddyfile
cp Caddyfile.example Caddyfile

# 4. Build + up
docker compose --profile standalone --env-file .env build
docker compose --profile standalone --env-file .env up -d

# 5. Vérifier
docker compose --env-file .env logs -f app
```

Le site est accessible en HTTPS sur `https://aufildessemis.be` (Caddy obtient le cert tout seul).

## Profil `default` (derrière un reverse proxy externe)

Si tu as déjà nginx, Traefik ou Cloudflare Tunnel en place :

```bash
docker compose --env-file .env up -d
# L'app écoute sur 127.0.0.1:3011 ; redirige ton proxy vers ce port.
```

## Premier admin

Une fois l'app up, ouvre `https://aufildessemis.be/admin` et crée le premier compte — Payload détecte qu'il n'y a pas encore d'utilisateur et te le propose. Ce compte aura role=admin par défaut.

## Seed des fiches plantes initiales

```bash
docker compose --env-file .env exec app sh -c "node /app/server.js & sleep 5 && curl -X POST http://localhost:3000/api/seed-plants"
```

…ou plus simplement : exécute `pnpm seed` dans un container temporaire qui partage le réseau :

```bash
docker compose --env-file .env run --rm --no-deps app sh -c \
  "cd /app && node -e 'require(\"./scripts/seed.cjs\")'"
```

Le plus simple en pratique : depuis ta machine de dev, avec `.env` pointant sur la prod, lancer `pnpm seed`.

## Migrations Payload (quand on quitte `push`)

Quand le schéma se stabilise, on désactive `push` :

```bash
# dans .env du serveur
PAYLOAD_DB_PUSH=false
```

Et on génère / applique des migrations :

```bash
# en local
pnpm payload migrate:create -- <nom-de-la-migration>
# commit src/migrations/*
# sur le serveur, après git pull :
docker compose --env-file .env --profile migrate run --rm migrate
```

## Cron / rappels

Le container `cron` lance `/api/cron/reminders` chaque jour à 8h00 (Europe/Brussels). Pour tester manuellement :

```bash
docker compose --env-file .env exec cron sh -c \
  "curl -sf -H \"Authorization: Bearer \$CRON_SECRET\" http://app:3000/api/cron/reminders"
```

## Backups

Volumes à sauvegarder :
- `pg_data` — la base Postgres
- `media` — les photos uploadées par les membres

Exemple de dump nocturne :

```bash
docker compose --env-file .env exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > /backups/aufds-$(date +%F).sql.gz
```

## Mise à jour

```bash
git pull
docker compose --profile standalone --env-file .env build app
docker compose --profile standalone --env-file .env up -d app
# pour les changements de cron / caddy : restart les services concernés
```

## Rollback

Toutes les images sont taggées via le registry. Pour revenir en arrière :

```bash
docker compose --env-file .env pull app  # récupère la version taggée précédente
docker compose --env-file .env up -d app
```

## Checklist santé

- `https://aufildessemis.be/` répond 200
- `https://aufildessemis.be/admin` charge le panneau Payload
- `https://aufildessemis.be/api/cron/reminders` répond 401 sans Bearer
- Email de test : créer un compte, vérifier l'email reçu (Resend dashboard)
