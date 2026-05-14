# au-fil-des-semis-mcp

Serveur MCP local qui te permet de **piloter ton site depuis Claude Code** : créer un lot de semis, ajouter une mise à jour avec photo, consulter la bibliothèque, publier un tip…

> *"Aujourd'hui j'ai semé mes courgettes, voici la photo /Users/renaud/Desktop/courgettes.jpg"* — Claude appelle les bons tools, et c'est en ligne.

## Tools disponibles

### Lecture
| Tool | Effet |
|---|---|
| `whoami` | Vérifie quel compte est branché |
| `list_plants` | Liste les fiches plantes (slug, nom, étapes) |
| `get_plant` | Détail d'une plante (étapes + conseils + fenêtre semis) |
| `list_my_sowings` | Tes lots de semis avec leur stade courant |
| `list_sowing_updates` | Mises à jour d'un lot (texte + photos) |

### Écriture
| Tool | Effet |
|---|---|
| `create_sowing` | Crée un nouveau lot (Sowing) |
| `add_sowing_update` | Ajoute une update (note + étape + **photos locales uploadées**) |
| `update_sowing` | Modifie nom / visibilité / rappels d'un lot |
| `delete_sowing_update` | Supprime une update (faute de frappe) |
| `create_plant` | Ajoute une fiche dans la bibliothèque (admin/mod) — slug auto-généré, photo de couverture optionnelle |
| `set_plant_cover` | Upload une image locale et la met en cover d'une fiche existante (admin/mod) |
| `create_tip` | Publie un tip (admin/mod) — **markdown**, slug auto, cover image uploadée auto |
| `update_tip` | Modifie un tip existant (par slug) — patch partiel, cover image remplaçable ou retirable |

> **Markdown** : les champs richText (`create_tip.body`, `create_plant.description`, `add_sowing_update.note`) acceptent du markdown : titres `#`, listes `-`/`1.`, **gras**, *italique*, `code inline`, [liens](url), `> citations`, `---` (hr). Du texte brut reste valide — c'est du markdown trivial.

## Setup

### 1. Génère ta clé API

Lance ton site en local (ou prod), ouvre l'admin Payload, va sur **ton compte user** : tu y trouveras un bouton **"Generate API Key"**. Coche `Enable API Key`, sauve, génère, **copie la clé**.

### 2. Installe les deps du MCP

```bash
cd mcp/
pnpm install
```

### 3. Configure Claude Code

Édite **`~/.claude.json`** (et non `~/.claude/config.json` — c'est bien à la racine du home) et ajoute une entrée dans `mcpServers` :

```jsonc
{
  "mcpServers": {
    "au-fil-des-semis": {
      "type": "stdio",
      "command": "/opt/homebrew/bin/node",
      "args": [
        "--import",
        "file:///Users/renaud/Documents/projects/au-fil-des-semis/mcp/node_modules/tsx/dist/esm/index.mjs",
        "/Users/renaud/Documents/projects/au-fil-des-semis/mcp/src/server.ts"
      ],
      "env": {
        "AU_FIL_API_URL": "http://localhost:3001",
        "AU_FIL_API_KEY": "colle-ta-cle-ici"
      }
    }
  }
}
```

> ⚠️ **Pièges Claude Code** (sinon : `× failed` ou `-32000`) :
> 1. `command` doit être un **chemin absolu** de `node` (Claude Code spawn avec un PATH minimal — `"node"` tout court échoue). Sur Mac Homebrew : `/opt/homebrew/bin/node`.
> 2. Le loader `tsx/esm` doit être un **chemin absolu en file://** vers `node_modules/tsx/dist/esm/index.mjs`. Avec le nom court `tsx/esm`, Node tente une résolution relative au cwd — qui est probablement `/` quand Claude Code lance les MCP — et échoue.

Pour la prod, remplace `AU_FIL_API_URL` par `https://aufildessemis.be`.

### 4. Redémarre Claude Code

Une fois la config sauvée, redémarre Claude Code. Tu devrais voir les tools `au-fil-des-semis:*` dans la liste des MCP disponibles.

## Vérification

Dans Claude Code, tape :

> Utilise `whoami` du MCP au-fil-des-semis

Tu dois récupérer ton id + email + role. Si tu vois une erreur 401, la clé est mauvaise ou pas active.

## Exemples d'usage

### Démarrer un nouveau lot et y ajouter la première update

> J'ai semé mes courgettes ce matin en godet, terreau bio. Crée le lot et ajoute la première update.

Claude va :
1. Appeler `list_plants` → trouver `slug: courgette`
2. `create_sowing` avec name="Mes courgettes 2026", plantSlug="courgette"
3. `add_sowing_update` avec stage="semis" + note

### Ajouter une update avec photo

> Voici mes basilics qui lèvent : /Users/renaud/Desktop/basilic-leve.jpg. Ajoute ça à mon lot "Basilic 2026".

Claude :
1. `list_my_sowings` → trouve l'id du Sowing "Basilic 2026"
2. `add_sowing_update` avec stage="levee", note, photoPaths=["/Users/.../basilic-leve.jpg"]
3. Le MCP upload la photo et la rattache

### Publier un tip avec markdown + cover image

> Publie un tip "Pourquoi pincer les courgettes" avec un titre H2, une liste à puces des bénéfices, un lien vers la fiche courgette, et la photo /Users/renaud/Desktop/pincage.jpg en couverture.

Claude :
1. `create_tip` avec title, body en markdown (titres, listes, liens), coverImagePath
2. Le MCP slugifie le titre, upload la cover image, convertit le markdown en Lexical, publie

### Corriger un tip déjà publié

> Dans le tip "pourquoi-pincer-les-courgettes", ajoute un paragraphe à la fin sur les variétés non-coureuses.

Claude :
1. `update_tip` avec slug + nouveau body markdown

## Sécurité

- L'API key donne accès en tant que ton user. **Ne la commit pas**. Ne la partage pas.
- Pour révoquer : retourne dans /admin/collections/users/[me], décoche `Enable API Key`, sauve.
- L'access control de Payload s'applique normalement : tu ne peux toucher qu'aux contenus dont tu es owner (sauf si tu es admin/mod).

## Dev

- `pnpm dev` — relance le serveur en watch si tu modifies les tools
- `pnpm typecheck` — vérifie les types

Le serveur communique en **stdio** (JSON-RPC). Pour le tester sans Claude Code, tu peux écrire des requêtes JSON-RPC manuellement, mais le plus simple reste : configure-le dans Claude Code et utilise-le.
