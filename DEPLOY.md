# Déploiement — Au fil des semis

Setup actuel en production : **Docker + docker-compose** pour app + Postgres + cron, **nginx global du serveur** en reverse proxy (avec certbot Let's Encrypt), **Cloudflare** devant en proxy edge. Hébergement VPS OVH (mutualisé avec d'autres projets).

Le profil `standalone` du docker-compose (Caddy embarqué) reste disponible pour un déploiement plus autonome, mais n'est pas celui qu'on utilise.

## Prérequis serveur

- Docker + docker-compose v2 (user dans le groupe `docker`)
- nginx + certbot installés en global (`certbot --nginx`)
- Domaine `aufildessemis.be` :
  - DNS pointé sur l'IP du VPS (A + AAAA)
  - Cloudflare en proxy (orange) — réplique le pattern de `cozy-page` (voir les `set_real_ip_from` CF dans la conf nginx)
- Ports 80 et 443 ouverts
- Comptes Resend configurés (domaine vérifié SPF/DKIM/DMARC)

## Première mise en route

```bash
# 1. Cloner le projet
git clone git@github.com:renaud-exaly/aufildessemis.git ~/projects/au-fil-des-semis
cd ~/projects/au-fil-des-semis

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env :
#   - PAYLOAD_SECRET (openssl rand -base64 32)
#   - POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
#   - DATABASE_URI (cohérent avec les 3 ci-dessus)
#   - PAYLOAD_PUBLIC_SERVER_URL = https://aufildessemis.be
#   - APP_PORT = 3011 (loopback, proxied par nginx)
#   - RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_AUDIENCE_ID
#   - CRON_SECRET (openssl rand -base64 32)
chmod 600 .env

# 3. Émettre le cert Let's Encrypt — d'abord une conf nginx HTTP-only
#    (CF doit être en "DNS only" / gray cloud le temps du challenge, sinon
#    "Always use HTTPS" intercepte avant le backend)
sudo cp deploy/nginx-aufildessemis.conf /etc/nginx/sites-enabled/aufildessemis.be
# ⚠ Avant la 1re exec : commenter temporairement les directives ssl_*
#   ou pointer sur un cert factice ; sinon nginx -t échoue.
sudo nginx -t && sudo systemctl reload nginx
sudo certbot certonly --nginx -d aufildessemis.be --non-interactive --agree-tos -m admin@aufildessemis.be
# Décommenter SSL puis :
sudo nginx -t && sudo systemctl reload nginx
# (CF peut repasser en proxy orange une fois le cert émis)

# 4. Build + up
docker compose --env-file .env build
docker compose --env-file .env up -d
```

## Premier admin

`https://aufildessemis.be/admin` → Payload détecte qu'il n'y a pas encore d'utilisateur et propose de créer le premier compte (role admin par défaut).

## Push initial du schéma + seed

Payload `push: true` ne fonctionne pas avec NODE_ENV=production. On utilise le profil `migrate` (dev-deps temporaires) qui exécute Payload en mode dev pour pousser le schéma + seeder :

```bash
docker compose --env-file .env --profile migrate run --rm migrate sh -c "
  set -e
  apk add --no-cache libc6-compat python3 make g++ > /dev/null
  corepack enable && corepack prepare pnpm@10.32.1 --activate
  pnpm install --frozen-lockfile --prod=false > /dev/null
  pnpm seed
"
```

Pour seeder les ~40 plantes supplémentaires (depuis local, via API key prod) :

```bash
PROD_API_KEY=<ta-clé> node scripts/seed-prod-plants.mjs
```

## Migrations Payload (à terme)

Quand le schéma se stabilise, on désactive `push` et on génère des migrations :

```bash
# dans .env du serveur
PAYLOAD_DB_PUSH=false
```

```bash
# en local
pnpm payload migrate:create -- <nom-de-la-migration>
# commit src/migrations/*
# sur le serveur après git pull :
docker compose --env-file .env --profile migrate run --rm migrate
```

## Cron / rappels

Le container `cron` lance `/api/cron/reminders` chaque jour à 8h00 (Europe/Brussels). Pour tester :

```bash
docker compose --env-file .env exec cron sh -c \
  "curl -sf -H \"Authorization: Bearer \$CRON_SECRET\" http://app:3000/api/cron/reminders"
```

## Backups

Volumes à sauvegarder :
- `pg_data` — la base Postgres
- `media` — les photos uploadées par les membres

Dump :

```bash
docker compose --env-file .env exec -T postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > /backups/aufds-$(date +%F).sql.gz
```

## Mise à jour

```bash
git pull
docker compose --env-file .env build app
docker compose --env-file .env up -d app
```

## Pièges connus

Documentés ici pour la prochaine fois.

- **`proxy_set_header Connection "upgrade"` casse Next.js 16 standalone.** Le serveur ferme la connexion sans répondre → nginx remonte 502. Mettre `Connection ""` à la place (cf. `deploy/nginx-aufildessemis.conf`).
- **Cloudflare "Always use HTTPS" empêche le challenge Let's Encrypt HTTP-01.** Passer la zone en "DNS only" (gray cloud) le temps du certbot, repasser en proxied après.
- **`push: true` de Payload ne pousse pas en NODE_ENV=production.** Utiliser le profil `migrate` ou générer des migrations.
- **Hook `afterRead` sur Users qui strip `_verified` (ou autres champs auth-critique) casse `payload.auth()`.** Toujours skipper le strip pour `req.payloadAPI === 'local'`.
- **`x-nextjs-cache: HIT` sur des pages qui devraient être dynamiques** = Next a pré-rendu en static. Si la lecture de cookies vit dans un composant profond (Header dans le layout), Next ne le détecte pas et il faut un `export const dynamic = 'force-dynamic'` explicite sur le layout.

## Checklist santé

- `https://aufildessemis.be/` répond 200
- `https://aufildessemis.be/admin` charge le panneau Payload
- `https://aufildessemis.be/api/whoami` répond 401 si pas connecté, sinon le JSON du user
- `https://aufildessemis.be/api/cron/reminders` répond 401 sans Bearer
- Email de test : créer un compte, vérifier l'email reçu (dashboard Resend)
