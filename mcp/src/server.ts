#!/usr/bin/env -S node --import tsx/esm
/**
 * Au fil des semis — MCP server (stdio).
 *
 * Permet à Claude Code de piloter ton journal de semis : créer un lot,
 * ajouter une mise à jour datée avec photo(s), consulter ta bibliothèque,
 * publier un tip, etc.
 *
 * Authentification : Payload API key (collection users).
 * Configure AU_FIL_API_URL + AU_FIL_API_KEY dans l'env du MCP côté Claude Code.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import { api, type Sowing } from './api.js'
import { lexicalToPlainText, plainTextToLexical } from './lexical.js'

const STAGE_VALUES = [
  'semis',
  'levee',
  'eclaircissage',
  'repiquage',
  'endurcissement',
  'mise-en-terre',
  'tuteurage',
  'floraison',
  'recolte',
] as const

const MONTH_VALUES = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
] as const

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const ownerName = (sowing: Sowing): string | null =>
  typeof sowing.owner === 'object' && sowing.owner
    ? sowing.owner.displayName ?? null
    : null

const plantName = (sowing: Sowing): string | null =>
  typeof sowing.plant === 'object' && sowing.plant ? sowing.plant.name : null

const ok = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
})

const txt = (text: string) => ({
  content: [{ type: 'text' as const, text }],
})

const server = new McpServer({
  name: 'au-fil-des-semis',
  version: '0.1.0',
})

// ============================================================
// Lecture
// ============================================================

server.registerTool(
  'list_plants',
  {
    description:
      "Liste toutes les fiches plantes de la bibliothèque (slug, nom, nom latin, étapes typiques, fenêtre de semis Belgique). Utilise ça en premier pour trouver le bon slug avant de créer un Sowing.",
    inputSchema: {},
  },
  async () => {
    const plants = await api.listPlants()
    const slim = plants.map((p) => ({
      slug: p.slug,
      name: p.name,
      latinName: p.latinName,
      sowingWindow: p.sowingWindow,
      stages: p.typicalStages?.map((s) => s.stage) ?? [],
    }))
    return ok(slim)
  },
)

server.registerTool(
  'get_plant',
  {
    description:
      "Renvoie le détail complet d'une plante : étapes typiques avec délais et conseils, fenêtre de semis, etc.",
    inputSchema: {
      slug: z.string().describe('Slug exact de la plante (ex. "courgette")'),
    },
  },
  async ({ slug }) => {
    const plant = await api.getPlantBySlug(slug)
    if (!plant) return txt(`Aucune plante avec le slug "${slug}". Utilise list_plants.`)
    return ok(plant)
  },
)

server.registerTool(
  'list_my_sowings',
  {
    description:
      "Liste tes lots de semis (id, nom, plante, stade courant, date de démarrage). Filtrable par visibilité.",
    inputSchema: {
      includePrivate: z
        .boolean()
        .optional()
        .describe('Inclure tes lots privés (défaut: true)'),
    },
  },
  async ({ includePrivate = true }) => {
    const sowings = await api.listMySowings(includePrivate)
    const slim = sowings.map((s) => ({
      id: s.id,
      name: s.name,
      plant: plantName(s),
      owner: ownerName(s),
      currentStage: s.currentStage,
      startedAt: s.startedAt,
      visibility: s.visibility,
    }))
    return ok(slim)
  },
)

server.registerTool(
  'list_sowing_updates',
  {
    description:
      "Liste les mises à jour datées d'un lot de semis (note, étape taguée, photos). Tri du plus récent au plus ancien.",
    inputSchema: {
      sowingId: z.union([z.string(), z.number()]).describe('ID du Sowing'),
      limit: z.number().optional().describe('Nombre max (défaut: 50)'),
    },
  },
  async ({ sowingId, limit }) => {
    const updates = await api.listSowingUpdates(sowingId, limit)
    const slim = updates.map((u) => ({
      id: u.id,
      date: u.date,
      stage: u.stage,
      note: lexicalToPlainText(u.note),
      photoCount: u.photos?.length ?? 0,
    }))
    return ok(slim)
  },
)

// ============================================================
// Écriture
// ============================================================

server.registerTool(
  'create_sowing',
  {
    description:
      "Crée un nouveau lot de semis dans ton journal. Tu dois fournir un slug de plante existante (utilise list_plants). Le lot est public par défaut.",
    inputSchema: {
      name: z.string().describe('Nom du lot (ex. "Mes courgettes 2026")'),
      plantSlug: z
        .string()
        .describe('Slug de la plante (courgette, basilic, tomate, etc.)'),
      startedAt: z
        .string()
        .optional()
        .describe("Date ISO de démarrage (défaut: aujourd'hui)"),
      visibility: z
        .enum(['public', 'private'])
        .optional()
        .describe('public ou private (défaut: public)'),
    },
  },
  async ({ name, plantSlug, startedAt, visibility }) => {
    const plant = await api.getPlantBySlug(plantSlug)
    if (!plant) return txt(`Plante "${plantSlug}" introuvable. Utilise list_plants.`)
    const sowing = await api.createSowing({
      name,
      plantId: plant.id,
      startedAt,
      visibility,
    })
    return ok({
      id: sowing.id,
      name: sowing.name,
      plant: plant.name,
      startedAt: sowing.startedAt,
      visibility: sowing.visibility,
    })
  },
)

server.registerTool(
  'add_sowing_update',
  {
    description:
      "Ajoute une mise à jour datée à un lot de semis. La note est en texte brut (paragraphes séparés par lignes vides). L'étape est optionnelle mais recommandée — elle déverrouille les rappels. Photos : chemins absolus locaux, uploadés automatiquement.",
    inputSchema: {
      sowingId: z.union([z.string(), z.number()]).describe('ID du Sowing'),
      note: z.string().describe('Note libre (texte brut)'),
      stage: z
        .enum(STAGE_VALUES)
        .optional()
        .describe(
          "Étape (semis, levee, eclaircissage, repiquage, endurcissement, mise-en-terre, tuteurage, floraison, recolte)",
        ),
      date: z
        .string()
        .optional()
        .describe("Date ISO de l'événement (défaut: maintenant)"),
      photoPaths: z
        .array(z.string())
        .optional()
        .describe('Chemins absolus locaux à uploader'),
      photoAlt: z
        .string()
        .optional()
        .describe('Texte alternatif partagé pour les photos uploadées'),
    },
  },
  async ({ sowingId, note, stage, date, photoPaths, photoAlt }) => {
    const photoIds: Array<string | number> = []
    if (photoPaths?.length) {
      for (const p of photoPaths) {
        const id = await api.uploadMedia(p, photoAlt ?? `Photo de ${stage ?? 'semis'}`)
        photoIds.push(id)
      }
    }
    const update = await api.createSowingUpdate({
      sowingId,
      date,
      stage,
      note: plainTextToLexical(note),
      photoIds,
    })
    return ok({
      id: update.id,
      date: update.date,
      stage: update.stage,
      photoCount: photoIds.length,
    })
  },
)

server.registerTool(
  'update_sowing',
  {
    description:
      "Modifie un lot existant : nom, visibilité, rappels. Ne touche pas aux updates — pour ça, utilise add/delete_sowing_update.",
    inputSchema: {
      sowingId: z.union([z.string(), z.number()]).describe('ID du Sowing'),
      name: z.string().optional(),
      visibility: z.enum(['public', 'private']).optional(),
      reminderEnabled: z
        .boolean()
        .optional()
        .describe('Active/désactive les rappels pour ce lot'),
    },
  },
  async ({ sowingId, name, visibility, reminderEnabled }) => {
    const patch: Record<string, unknown> = {}
    if (name !== undefined) patch.name = name
    if (visibility !== undefined) patch.visibility = visibility
    if (reminderEnabled !== undefined) {
      patch.reminderSettings = { enabled: reminderEnabled }
    }
    if (!Object.keys(patch).length) return txt('Rien à modifier.')
    const updated = await api.updateSowing(sowingId, patch)
    return ok({
      id: updated.id,
      name: updated.name,
      visibility: updated.visibility,
    })
  },
)

server.registerTool(
  'delete_sowing_update',
  {
    description:
      'Supprime une mise à jour (en cas de faute de frappe par exemple). Ne supprime PAS le Sowing parent.',
    inputSchema: {
      updateId: z.union([z.string(), z.number()]).describe("ID de l'update"),
    },
  },
  async ({ updateId }) => {
    await api.deleteSowingUpdate(updateId)
    return txt(`Update ${updateId} supprimée.`)
  },
)

server.registerTool(
  'set_plant_companions',
  {
    description:
      "Définit les cultures associées (pluriculture) d'une plante. **Remplace** la liste existante. La page détail lit en bi-directionnel : il suffit de déclarer chaque pairing d'un seul côté. Admin/mod uniquement.",
    inputSchema: {
      plantSlug: z
        .string()
        .describe('Slug de la plante qu\'on édite (ex. "tomate")'),
      companions: z
        .array(
          z.object({
            companionSlug: z
              .string()
              .describe('Slug de la plante compagne (ex. "basilic")'),
            note: z
              .string()
              .optional()
              .describe(
                "Explication du pairing (ex. \"repousse les pucerons grâce à son odeur\")",
              ),
          }),
        )
        .describe('Liste qui remplace les compagnons existants'),
    },
  },
  async ({ plantSlug, companions }) => {
    const plant = await api.getPlantBySlug(plantSlug)
    if (!plant) return txt(`Plante "${plantSlug}" introuvable.`)

    const resolved: Array<{ plant: string | number; note?: string }> = []
    const skipped: string[] = []
    for (const c of companions) {
      const target = await api.getPlantBySlug(c.companionSlug)
      if (!target) {
        skipped.push(c.companionSlug)
        continue
      }
      resolved.push({ plant: target.id, note: c.note })
    }

    await api.setPlantCompanions(plant.id, resolved)
    return ok({
      plant: plant.name,
      slug: plant.slug,
      added: resolved.length,
      skipped: skipped.length ? skipped : undefined,
    })
  },
)

server.registerTool(
  'set_plant_cover',
  {
    description:
      "Upload une image locale et la définit comme photo de couverture d'une plante existante. Idéal pour les illustrations botaniques de la bibliothèque. Admin/mod uniquement.",
    inputSchema: {
      plantSlug: z
        .string()
        .describe('Slug de la plante à mettre à jour (ex. "basilic")'),
      imagePath: z
        .string()
        .describe("Chemin absolu local de l'image (png, jpg, webp)"),
      alt: z
        .string()
        .optional()
        .describe(
          "Texte alternatif. Si absent, généré depuis le nom de la plante.",
        ),
    },
  },
  async ({ plantSlug, imagePath, alt }) => {
    const plant = await api.getPlantBySlug(plantSlug)
    if (!plant) return txt(`Plante "${plantSlug}" introuvable.`)
    const mediaId = await api.uploadMedia(
      imagePath,
      alt ?? `Illustration de ${plant.name}`,
    )
    await api.setPlantCover(plant.id, mediaId)
    return ok({
      plant: plant.name,
      slug: plant.slug,
      mediaId,
      url: `/bibliotheque/${plant.slug}`,
    })
  },
)

server.registerTool(
  'create_plant',
  {
    description:
      "Ajoute une nouvelle fiche plante dans la bibliothèque. Réservé aux admins/modérateurs. Renvoie 403 sinon. Si tu n'as pas de slug, laisse vide — il est généré automatiquement depuis le nom. Photo de couverture optionnelle via chemin local (uploadée auto).",
    inputSchema: {
      name: z.string().describe('Nom en français (ex. "Carotte")'),
      latinName: z.string().optional().describe('Nom latin (ex. "Daucus carota")'),
      slug: z
        .string()
        .optional()
        .describe('Slug URL-safe ; auto-généré depuis name si absent'),
      description: z
        .string()
        .optional()
        .describe('Description en texte brut (paragraphes séparés par lignes vides)'),
      sowingWindow: z
        .object({
          startMonth: z.enum(MONTH_VALUES).describe('Mois de début (01-12)'),
          endMonth: z.enum(MONTH_VALUES).describe('Mois de fin (01-12)'),
          note: z
            .string()
            .optional()
            .describe('Note pratique (ex. "intérieur dès avril, en pleine terre dès la mi-mai")'),
        })
        .describe('Fenêtre de semis (Belgique)'),
      typicalStages: z
        .array(
          z.object({
            stage: z.enum(STAGE_VALUES),
            daysFromPrevious: z
              .number()
              .optional()
              .describe("Délai estimé depuis l'étape précédente (jours)"),
            tip: z.string().optional().describe("Conseil court pour cette étape"),
          }),
        )
        .describe('Étapes typiques dans l\'ordre, du semis à la récolte'),
      coverImagePath: z
        .string()
        .optional()
        .describe("Chemin absolu local d'une photo de couverture (sera uploadée)"),
    },
  },
  async ({ name, latinName, slug, description, sowingWindow, typicalStages, coverImagePath }) => {
    const finalSlug = slug?.trim() || slugify(name)

    // Refuse si une plante avec ce slug existe déjà.
    const existing = await api.getPlantBySlug(finalSlug)
    if (existing) {
      return txt(
        `Une plante existe déjà avec le slug "${finalSlug}" (${existing.name}). Utilise un slug différent ou modifie l'existante depuis l'admin.`,
      )
    }

    let coverImageId: string | number | undefined
    if (coverImagePath) {
      coverImageId = await api.uploadMedia(coverImagePath, `Photo de ${name}`)
    }

    const plant = await api.createPlant({
      name,
      slug: finalSlug,
      latinName,
      description: description ? plainTextToLexical(description) : undefined,
      coverImageId,
      sowingWindow,
      typicalStages,
    })

    return ok({
      id: plant.id,
      name: plant.name,
      slug: plant.slug,
      url: `/bibliotheque/${plant.slug}`,
      stages: plant.typicalStages?.map((s) => s.stage) ?? [],
    })
  },
)

server.registerTool(
  'create_tip',
  {
    description:
      "Publie un Tip (conseil) dans le carnet des astuces. Réservé aux admins/modérateurs — l'API renverra une erreur 403 si tu n'as pas les droits.",
    inputSchema: {
      title: z.string(),
      slug: z
        .string()
        .describe('Slug URL-safe (lowercase, tirets — ex. "premiere-recolte")'),
      body: z
        .string()
        .describe('Corps en texte brut (paragraphes séparés par lignes vides)'),
      plantSlugs: z
        .array(z.string())
        .optional()
        .describe('Slugs de plantes associées (optionnel)'),
      status: z.enum(['draft', 'published']).optional(),
    },
  },
  async ({ title, slug, body, plantSlugs, status }) => {
    let plantIds: Array<string | number> | undefined
    if (plantSlugs?.length) {
      const plants = await Promise.all(plantSlugs.map((s) => api.getPlantBySlug(s)))
      plantIds = plants.filter(Boolean).map((p) => p!.id)
    }
    const tip = await api.createTip({
      title,
      slug,
      body: plainTextToLexical(body),
      plantIds,
      status,
    })
    return ok({ id: tip.id, slug: tip.slug })
  },
)

server.registerTool(
  'whoami',
  {
    description:
      "Renvoie l'identité du compte associé à l'API key (utile pour vérifier la config).",
    inputSchema: {},
  },
  async () => {
    const me = await api.me()
    return ok({
      id: me.id,
      email: me.email,
      displayName: me.displayName,
      role: me.role,
    })
  },
)

// ============================================================
// Boot
// ============================================================

const transport = new StdioServerTransport()
await server.connect(transport)
