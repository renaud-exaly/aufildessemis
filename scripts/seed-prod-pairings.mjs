#!/usr/bin/env node
/**
 * Seed des cultures associées (companions) ET incompatibles entre les 47
 * plantes en prod. Données issues d'une recherche agronomique (consensus
 * scientifique + tradition maraîchère solide, folklore écarté).
 *
 * Usage : PROD_API_KEY=<key> node scripts/seed-prod-pairings.mjs
 *
 * Notes :
 *  - La lecture est bi-directionnelle côté UI, mais on déclare quand même
 *    les paires des 2 côtés (explicite, idempotent).
 *  - On écarte les références à des plantes hors DB (poireau, asperge,
 *    rosier, maïs, sarriette, fenouil) — facilement réintégrables plus tard.
 */

const API_URL = process.env.PROD_URL ?? 'https://aufildessemis.be'
const API_KEY = process.env.PROD_API_KEY
if (!API_KEY) {
  console.error('❌ PROD_API_KEY manquante.')
  process.exit(1)
}

const auth = `users API-Key ${API_KEY}`

async function request(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} on ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function getPlantIdBySlug(slug) {
  const q = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
    depth: '0',
  })
  const data = await request(`/api/plants?${q.toString()}`)
  return data.docs?.[0]?.id ?? null
}

const c = (slug, note) => ({ slug, note })

/**
 * Matrice complète. Chaque entrée = { companions: [...], incompatibles: [...] }
 * Notes en 1 phrase, style carnet, mentionnent le mécanisme (allélopathie,
 * répulsion olfactive, attraction d'auxiliaires, fixation azote, etc.).
 */
const PAIRINGS = {
  ail: {
    companions: [
      c('fraisier', "Composés soufrés volatils — action fongicide qui réduit la pourriture grise (Botrytis) sur les fraises."),
      c('tomate', "Émanations soufrées qui repoussent acariens et pucerons ; effet rapporté sur le mildiou à faible dose."),
      c('carotte', "Odeur soufrée qui masque la carotte et perturbe la mouche de la carotte (Psila rosae)."),
      c('betterave', "Cohabitation racinaire sans concurrence ; l'ail occupe la couche superficielle."),
    ],
    incompatibles: [
      c('haricot-vert', "Les composés soufrés inhibent les bactéries Rhizobium qui fixent l'azote sur les nodosités du haricot."),
      c('petit-pois', "Même mécanisme : l'ail bloque la symbiose rhizobienne et freine la croissance du pois."),
      c('chou-kale', "Concurrence pour le soufre du sol, croissance ralentie observée empiriquement."),
    ],
  },
  aneth: {
    companions: [
      c('concombre', "Ses ombelles attirent syrphes et chalcidiens qui régulent pucerons et aleurodes."),
      c('chou-kale', "Attire les Trichogrammes parasitoïdes qui pondent dans les œufs de piéride."),
      c('chou-fleur', "Même mécanisme : l'aneth en fleur draine les auxiliaires anti-chenilles."),
      c('salade', "Ombrage léger et microclimat humide bénéfique en été."),
    ],
    incompatibles: [
      c('carotte', "Mêmes apiacées : risque d'hybridation et partage de la mouche de la carotte."),
      c('tomate', "En vieillissant, l'aneth devient allélopathique pour la tomate."),
    ],
  },
  aubergine: {
    companions: [
      c('haricot-vert', "Le haricot fixe l'azote dont l'aubergine, gourmande, profite ; effet rapporté contre le doryphore."),
      c('tagetes', "Action nématicide racinaire (α-terthiényl) qui protège les racines de l'aubergine."),
      c('basilic', "Son parfum repousse aleurodes et thrips, ravageurs majeurs de l'aubergine."),
      c('estragon', "Effet répulsif olfactif rapporté sur plusieurs ravageurs des solanacées."),
      c('capucine', "Plante-piège pour les pucerons qui s'y concentrent au lieu d'attaquer l'aubergine."),
      c('souci', "Attire les auxiliaires anti-puceron et aleurodes."),
    ],
    incompatibles: [
      c('pomme-de-terre', "Mêmes solanacées — partagent doryphore, mildiou et alternariose."),
      c('tomate', "Solanacées qui partagent les mêmes maladies cryptogamiques (mildiou, verticilliose)."),
    ],
  },
  basilic: {
    companions: [
      c('tomate', "Le parfum repousse aleurodes et pucerons ; la tomate ombre le basilic et l'empêche de monter en graines."),
      c('aubergine', "Émanations répulsives bénéfiques contre les aleurodes."),
      c('poivron', "Protège des thrips et pucerons par ses huiles essentielles (linalool, eugénol)."),
      c('concombre', "Repousse certains ravageurs et améliore la pollinisation en fleur."),
      c('melisse', "Cohabitation aromatique harmonieuse, mêmes besoins en chaleur et en eau."),
      c('camomille-romaine', "Bénéfice mutuel observé en compagnonnage aromatique traditionnel."),
    ],
    incompatibles: [
      c('sauge', "Concurrence aromatique — le basilic souffre près des Lamiacées vivaces sèches."),
      c('thym', "Besoins en eau opposés : le thym aime le sec, le basilic l'humide."),
      c('romarin', "Lamiacées aux besoins en eau opposés (basilic humide, romarin sec)."),
      c('origan', "Concurrence aromatique entre aromatiques aux besoins en eau divergents."),
    ],
  },
  betterave: {
    companions: [
      c('oignon', "Cohabitation racinaire complémentaire — l'oignon en surface, la betterave en profondeur."),
      c('salade', "Couverture rapide du sol avant que la betterave occupe l'espace ; pas de concurrence."),
      c('chou-kale', "La betterave libère des minéraux profonds utiles au chou."),
      c('ail', "Effet fongicide olfactif et pas de concurrence racinaire."),
      c('haricot-vert', "Le haricot fixe l'azote, la betterave en profite modérément."),
      c('echalote', "Cohabitation racinaire complémentaire entre surface et profondeur."),
    ],
    incompatibles: [
      c('epinard', "Concurrence directe pour le bore (mêmes Chénopodiacées)."),
      c('blette', "Même famille (Amaranthacées) — partage cercosporiose et mineuse (Pegomya)."),
    ],
  },
  blette: {
    companions: [
      c('carotte', "Pas de concurrence racinaire — la carotte en profondeur, la blette en surface."),
      c('haricot-vert', "Le haricot fixe l'azote dont la blette, gourmande en feuilles, profite."),
      c('chou-kale', "Mêmes besoins, cohabitation harmonieuse sans partage de maladies majeures."),
      c('oignon', "Effet répulsif olfactif sur la mineuse de la blette."),
    ],
    incompatibles: [
      c('betterave', "Même famille (Amaranthacées) — partage cercosporiose et mineuse (Pegomya)."),
      c('epinard', "Même famille, mêmes ravageurs et concurrence directe."),
      c('persil', "Concurrence racinaire et croissance ralentie rapportée."),
    ],
  },
  bourrache: {
    companions: [
      c('fraisier', "Attire les bourdons et améliore le calibrage des fraises ; ses racines profondes remontent les minéraux."),
      c('tomate', "Effet répulsif rapporté sur le sphinx de la tomate ; attire les pollinisateurs."),
      c('courgette', "Attire massivement les abeilles, indispensables à la pollinisation des fleurs femelles."),
      c('concombre', "Bénéfice pollinisateur crucial pour les variétés non parthénocarpiques."),
      c('chou-kale', "Attire les syrphes qui régulent les pucerons cendrés du chou."),
      c('roquette', "Attire les auxiliaires anti-altise et puceron."),
    ],
    incompatibles: [],
  },
  'camomille-romaine': {
    companions: [
      c('chou-kale', "Attire syrphes et guêpes parasitoïdes ; réputée 'plante médecin' qui stimule les voisines."),
      c('oignon', "Améliorerait la saveur de l'oignon ; attire les auxiliaires."),
      c('concombre', "Attire pollinisateurs et auxiliaires anti-puceron."),
      c('basilic', "Bénéfice mutuel observé en compagnonnage aromatique traditionnel."),
    ],
    incompatibles: [
      c('menthe', "Concurrence allélopathique entre aromatiques couvrantes."),
    ],
  },
  capucine: {
    companions: [
      c('chou-kale', "Plante-piège pour pucerons cendrés et piérides qui se concentrent sur elle."),
      c('chou-fleur', "Même rôle de plante-piège anti-piéride et puceron."),
      c('tomate', "Attire les pucerons hors de la tomate et héberge des auxiliaires."),
      c('courgette', "Réputée contre aleurodes et punaises des cucurbitacées."),
      c('concombre', "Repousse les chrysomèles et attire les pucerons hors du concombre."),
      c('pomme-de-terre', "Effet répulsif rapporté sur le doryphore."),
      c('aubergine', "Plante-piège pour les pucerons qui s'y concentrent."),
      c('radis', "Repousse les altises du radis."),
    ],
    incompatibles: [],
  },
  carotte: {
    companions: [
      c('oignon', "Odeurs soufrées qui se masquent mutuellement et désorientent les mouches de la carotte ET de l'oignon."),
      c('echalote', "Émanations soufrées qui désorientent la mouche de la carotte."),
      c('ail', "Effet répulsif olfactif similaire sur Psila rosae."),
      c('ciboulette', "Allium aromatique très efficace contre la mouche de la carotte sur petites surfaces."),
      c('romarin', "Son parfum désoriente également la mouche de la carotte."),
      c('salade', "Couverture du sol rapide, pas de concurrence racinaire."),
      c('petit-pois', "Cohabitation racinaire et bénéfice azoté pour la carotte."),
      c('tomate', "Cohabitation racinaire complémentaire et pas de maladies partagées."),
      c('radis', "Cycle court qui marque les rangs ; récolté avant que la carotte ait besoin de place."),
      c('blette', "Pas de concurrence racinaire — la carotte en profondeur, la blette en surface."),
      c('roquette', "Pas de concurrence racinaire, cohabitation tranquille."),
      c('mache', "Couverture du sol en hiver pendant que la carotte hiverne."),
      c('sauge', "Son parfum désorienterait la mouche de la carotte."),
    ],
    incompatibles: [
      c('aneth', "Apiacée proche — risque d'hybridation et partage de Psila rosae."),
      c('persil', "Même famille (apiacée) — partage maladies (alternaria) et ravageurs."),
      c('cerfeuil', "Apiacée concurrente avec ravageurs communs."),
      c('panais', "Apiacée proche — partage maladies foliaires et insectes."),
    ],
  },
  cerfeuil: {
    companions: [
      c('salade', "Ombre légèrement la salade en été et limite la montaison ; la salade couvre le sol pour garder la fraîcheur du cerfeuil."),
      c('radis', "Rendrait les radis plus piquants et plus résistants aux altises (tradition maraîchère)."),
      c('concombre', "Apiacée en fleur qui attire les syrphes anti-puceron."),
    ],
    incompatibles: [
      c('carotte', "Même famille (apiacée) — ravageurs communs (Psila rosae)."),
      c('aneth', "Apiacée proche — hybridation et ravageurs partagés."),
    ],
  },
  'chou-kale': {
    companions: [
      c('capucine', "Plante-piège pour les pucerons cendrés et piérides."),
      c('souci', "Attire syrphes et coccinelles qui régulent les pucerons du chou."),
      c('aneth', "Attire les Trichogrammes parasitoïdes des œufs de piéride."),
      c('camomille-romaine', "Stimulant réputé et attracteur d'auxiliaires."),
      c('thym', "Repousse la piéride du chou par son parfum (thymol)."),
      c('sauge', "Effet répulsif olfactif sur la piéride et l'altise."),
      c('bourrache', "Attire les syrphes anti-puceron."),
      c('haricot-vert', "Apport d'azote au chou très gourmand."),
      c('betterave', "Cohabitation racinaire harmonieuse, la betterave puise plus profond."),
      c('petit-pois', "Le pois fournit l'azote dont le chou raffole."),
      c('cosmos', "Attire les parasitoïdes anti-chenilles."),
      c('romarin', "Effet répulsif sur la piéride et l'altise par ses huiles essentielles."),
      c('menthe', "Repousse la piéride et l'altise par son parfum mentholé."),
      c('blette', "Cohabitation harmonieuse sans partage de maladies majeures."),
    ],
    incompatibles: [
      c('chou-fleur', "Même famille (Brassicacées) — partage hernie du chou (Plasmodiophora), piéride et altises."),
      c('navet', "Brassicacée — partage altises, mouche du chou et hernie."),
      c('radis', "Même famille, à séparer en parallèle (succession OK)."),
      c('roquette', "Brassicacée — mêmes altises et hernie du chou."),
      c('rutabaga', "Brassicacée — mêmes ravageurs et maladies."),
      c('fraisier', "Concurrence et inhibition réciproque rapportée."),
      c('tomate', "Concurrence pour les nutriments, croissance mutuellement freinée."),
    ],
  },
  'chou-fleur': {
    companions: [
      c('capucine', "Plante-piège anti-pucerons et piérides."),
      c('souci', "Attracteur de syrphes anti-puceron."),
      c('aneth', "Attire les parasitoïdes des chenilles de piéride."),
      c('haricot-vert', "Apport d'azote pour cette brassicacée gourmande."),
      c('thym', "Répulsif olfactif contre la piéride."),
      c('sauge', "Effet répulsif sur la piéride et l'altise."),
    ],
    incompatibles: [
      c('chou-kale', "Même famille (Brassicacées) — partage hernie du chou, piéride et altises."),
      c('navet', "Brassicacée — mêmes ravageurs."),
      c('radis', "Brassicacée — à séparer en parallèle."),
      c('roquette', "Brassicacée — mêmes ravageurs."),
      c('rutabaga', "Brassicacée — mêmes ravageurs et maladies."),
      c('fraisier', "Inhibition mutuelle traditionnellement observée."),
    ],
  },
  ciboulette: {
    companions: [
      c('carotte', "Son odeur soufrée perturbe la mouche de la carotte ; idéale en bordure de rang."),
      c('fraisier', "Action fongicide légère contre la pourriture grise et stimulation rapportée."),
      c('tomate', "Repousse les pucerons et certains acariens par ses émanations."),
      c('concombre', "Repousse acariens et limite l'oïdium par ses émanations soufrées."),
    ],
    incompatibles: [
      c('haricot-vert', "Allium — inhibe les bactéries Rhizobium fixatrices d'azote."),
      c('petit-pois', "Allium — bloque la symbiose rhizobienne."),
    ],
  },
  concombre: {
    companions: [
      c('aneth', "Attire les syrphes anti-puceron et améliore la pollinisation."),
      c('basilic', "Repousse aleurodes et thrips ; attire les pollinisateurs en fleur."),
      c('bourrache', "Attire massivement les abeilles, essentielle pour la pollinisation."),
      c('capucine', "Repousse chrysomèles et plante-piège pucerons."),
      c('tournesol', "Sert de tuteur vivant et attire les pollinisateurs."),
      c('haricot-vert', "Apport d'azote pour cette cucurbitacée gourmande (principe des Trois Sœurs)."),
      c('camomille-romaine', "Attire pollinisateurs et auxiliaires anti-puceron."),
      c('cerfeuil', "Apiacée en fleur qui attire les syrphes anti-puceron."),
      c('ciboulette', "Repousse les acariens et limite l'oïdium par ses émanations."),
      c('melisse', "Attire les abeilles, bénéfice de pollinisation."),
    ],
    incompatibles: [
      c('pomme-de-terre', "Effet inhibiteur réciproque (allélopathie rapportée) ; partage de risques fongiques."),
      c('sauge', "Lamiacée sèche qui étouffe le concombre humide ; inhibition aromatique."),
      c('menthe', "Concurrence agressive et aromatique défavorable."),
      c('thym', "Besoins en eau opposés (thym sec, concombre humide)."),
      c('romarin', "Besoins en eau et croissance incompatibles."),
      c('origan', "Concurrence aromatique et besoins en eau divergents."),
      c('courgette', "Même famille (cucurbitacées) — partage oïdium et mosaïque."),
    ],
  },
  coriandre: {
    companions: [
      c('tomate', "En fleur, attire syrphes et chalcidiens qui régulent pucerons et aleurodes."),
      c('aubergine', "Attire les parasitoïdes des aleurodes."),
      c('epinard', "Cohabitation harmonieuse, croissance courte similaire."),
      c('salade', "Pas de concurrence, attire les auxiliaires."),
    ],
    incompatibles: [
      c('aneth', "Hybridation possible (apiacées proches) et concurrence en fleur."),
    ],
  },
  cosmos: {
    companions: [
      c('tomate', "Attire syrphes, chrysopes et coccinelles anti-pucerons et anti-aleurodes."),
      c('aubergine', "Attire les auxiliaires sur les ravageurs des solanacées."),
      c('courgette', "Améliore la pollinisation par attraction massive d'abeilles."),
      c('chou-kale', "Attire les parasitoïdes anti-chenilles."),
    ],
    incompatibles: [],
  },
  courgette: {
    companions: [
      c('capucine', "Repousse les punaises des cucurbitacées et sert de plante-piège."),
      c('bourrache', "Attire les abeilles indispensables à la pollinisation des fleurs femelles."),
      c('cosmos', "Renforce la pollinisation par attraction massive de pollinisateurs."),
      c('haricot-vert', "Fixe l'azote pour la courgette très gourmande (principe Trois Sœurs)."),
      c('tournesol', "Tuteur léger et attracteur d'auxiliaires."),
      c('souci', "Attire syrphes et coccinelles, repousse certains nématodes."),
      c('cosmos', "Améliore la pollinisation par attraction massive d'abeilles."),
      c('origan', "Attire les pollinisateurs en fleur."),
    ],
    incompatibles: [
      c('concombre', "Même famille (cucurbitacées) — partage oïdium et mosaïque."),
      c('pomme-de-terre', "Concurrence racinaire forte et partage de pathogènes du sol."),
    ],
  },
  crosne: {
    companions: [
      c('salade', "Couvre le sol pendant que les crosnes développent leurs tubercules en profondeur."),
      c('haricot-vert', "Apport d'azote modeste, cohabitation racinaire compatible."),
      c('souci', "Attire les auxiliaires et serait répulsif sur certains nématodes."),
    ],
    incompatibles: [
      c('topinambour', "Tubéreuse vivace envahissante — concurrence directe pour l'espace racinaire."),
      c('pomme-de-terre', "Concurrence pour la couche racinaire de fond, risque de mêler les récoltes."),
    ],
  },
  echalote: {
    companions: [
      c('carotte', "Émanations soufrées qui désorientent la mouche de la carotte."),
      c('fraisier', "Action fongicide légère contre la pourriture grise."),
      c('betterave', "Cohabitation racinaire complémentaire (surface vs profondeur)."),
      c('tomate', "Repousse pucerons et acariens par ses sulfures volatils."),
    ],
    incompatibles: [
      c('haricot-vert', "Allium qui inhibe la symbiose rhizobienne fixatrice d'azote."),
      c('petit-pois', "Allium — blocage de Rhizobium et croissance ralentie."),
      c('chou-kale', "Concurrence pour le soufre du sol rapportée empiriquement."),
    ],
  },
  epinard: {
    companions: [
      c('fraisier', "Couvre le sol et garde la fraîcheur dont le fraisier a besoin ; cycle court compatible."),
      c('salade', "Cohabitation harmonieuse, mêmes besoins, pas de concurrence majeure."),
      c('radis', "Cycle court intercalé, pas de concurrence racinaire."),
      c('haricot-vert', "Apport d'azote bénéfique à l'épinard très gourmand en feuilles."),
      c('chou-kale', "Mêmes besoins, microclimat humide partagé."),
      c('coriandre', "Cohabitation harmonieuse, cycles courts similaires."),
    ],
    incompatibles: [
      c('betterave', "Même famille (Chénopodiacées) — concurrence pour le bore et mêmes ravageurs."),
      c('blette', "Même famille — partage mineuse Pegomya et cercosporiose."),
    ],
  },
  estragon: {
    companions: [
      c('aubergine', "Effet répulsif olfactif rapporté sur les ravageurs des solanacées."),
      c('tomate', "Émanations aromatiques qui éloigneraient certains ravageurs (classique français)."),
      c('poivron', "Effet répulsif sur thrips et pucerons par voisinage aromatique."),
    ],
    incompatibles: [],
  },
  fraisier: {
    companions: [
      c('ail', "Effet fongicide soufré contre la pourriture grise (Botrytis cinerea)."),
      c('echalote', "Émanations soufrées antifongiques."),
      c('ciboulette', "Action fongicide légère et répulsion des pucerons."),
      c('bourrache', "Attire pollinisateurs et améliore le calibrage des fraises ; remonte des minéraux."),
      c('epinard', "Couvre le sol et maintient la fraîcheur sans concurrencer."),
      c('persil', "Cohabitation harmonieuse, repousserait les limaces selon la tradition."),
      c('souci', "Attire les auxiliaires anti-puceron et a un effet nématicide."),
      c('tagetes', "Effet nématicide contre les nématodes des racines de fraisier (Pratylenchus)."),
      c('salade', "La salade ombre le sol et garde la fraîcheur du fraisier."),
    ],
    incompatibles: [
      c('chou-kale', "Inhibition mutuelle rapportée, concurrence et alcalinisation du sol."),
      c('chou-fleur', "Inhibition mutuelle ; à séparer absolument."),
      c('pomme-de-terre', "Partage de Verticillium dahliae, agent du flétrissement vasculaire."),
      c('tomate', "Partage de Verticillium ; concurrence racinaire."),
    ],
  },
  'haricot-vert': {
    companions: [
      c('carotte', "Cohabitation racinaire (surface vs profondeur) et bénéfice azoté pour la carotte."),
      c('concombre', "Apport d'azote (cucurbitacée gourmande) — principe des Trois Sœurs."),
      c('courgette', "Même bénéfice azoté pour cette cucurbitacée gourmande."),
      c('aubergine', "Fixation d'azote bénéfique ; effet rapporté contre le doryphore."),
      c('salade', "Apport d'azote et microclimat partagé."),
      c('chou-kale', "Le haricot fournit l'azote dont le chou raffole."),
      c('pomme-de-terre', "Apport d'azote et effet répulsif rapporté sur le doryphore."),
      c('chou-fleur', "Apport d'azote pour cette brassicacée gourmande."),
      c('tagetes', "Action nématicide protectrice, pas de concurrence majeure."),
      c('blette', "Le haricot fixe l'azote dont la blette, gourmande, profite."),
      c('betterave', "Le haricot fixe l'azote, la betterave en profite modérément."),
      c('rutabaga', "Bénéfice azoté pour cette brassicacée gourmande."),
      c('navet', "Bénéfice azoté pour cette brassicacée."),
      c('crosne', "Apport d'azote modeste, cohabitation racinaire compatible."),
      c('roquette', "Apport d'azote bénéfique à cette brassicacée à feuilles."),
      c('epinard', "Apport d'azote bénéfique à l'épinard gourmand."),
      c('poivron', "Apport d'azote pour ce solanacée gourmand."),
    ],
    incompatibles: [
      c('ail', "Allium qui inhibe les bactéries Rhizobium sur les nodosités."),
      c('oignon', "Allium — blocage de la symbiose rhizobienne."),
      c('echalote', "Allium — inhibiteur de Rhizobium."),
      c('ciboulette', "Allium — à éviter à proximité immédiate."),
    ],
  },
  mache: {
    companions: [
      c('radis', "Cycle court compatible, peuvent être semés en mélange."),
      c('carotte', "Couverture du sol en hiver pendant que la carotte hiverne."),
      c('oignon', "Effet répulsif sur certains ravageurs et cohabitation racinaire."),
      c('salade', "Mêmes besoins, succession ou cohabitation en planches d'hiver."),
    ],
    incompatibles: [],
  },
  melisse: {
    companions: [
      c('tomate', "Attire les pollinisateurs et améliorerait la saveur de la tomate."),
      c('concombre', "Attire les abeilles, bénéfice de pollinisation."),
      c('basilic', "Cohabitation aromatique harmonieuse, mêmes besoins."),
      c('courgette', "Attire les pollinisateurs essentiels."),
    ],
    incompatibles: [
      c('menthe', "Concurrence agressive entre Lamiacées coureuses."),
      c('sauge', "Concurrence aromatique et besoins en eau divergents."),
    ],
  },
  menthe: {
    companions: [
      c('chou-kale', "Repousse la piéride et l'altise par son parfum mentholé."),
      c('chou-fleur', "Effet répulsif sur les ravageurs des brassicacées."),
      c('tomate', "Repousse les pucerons et certains acariens."),
      c('souci', "Couple aromatique attracteur d'auxiliaires."),
    ],
    incompatibles: [
      c('persil', "Concurrence aromatique, croissance perturbée du persil."),
      c('camomille-romaine', "Concurrence allélopathique entre aromatiques couvrantes."),
      c('melisse', "Lamiacées concurrentes par leur expansion rhizomateuse."),
      c('thym', "Concurrence agressive de la menthe coureuse sur le thym."),
      c('romarin', "Concurrence agressive de la menthe envahissante."),
    ],
  },
  navet: {
    companions: [
      c('petit-pois', "Le pois fixe l'azote dont le navet profite ; cohabitation classique."),
      c('haricot-vert', "Bénéfice azoté."),
      c('salade', "Pas de concurrence racinaire, cohabitation tranquille."),
      c('aneth', "Attire les parasitoïdes anti-altise."),
    ],
    incompatibles: [
      c('chou-kale', "Brassicacée — partage altises, mouche du chou et hernie."),
      c('chou-fleur', "Brassicacée — mêmes ravageurs et maladies."),
      c('radis', "Brassicacée — à séparer en parallèle (succession OK)."),
      c('roquette', "Brassicacée — mêmes altises."),
      c('rutabaga', "Brassicacées très proches — mêmes ravageurs."),
      c('pomme-de-terre', "Concurrence racinaire et croissance ralentie rapportée."),
    ],
  },
  oignon: {
    companions: [
      c('carotte', "Émanations soufrées qui désorientent la mouche de la carotte ; la carotte renvoie la pareille contre la mouche de l'oignon."),
      c('fraisier', "Action fongicide soufrée contre la pourriture grise."),
      c('betterave', "Cohabitation racinaire complémentaire (surface vs profondeur)."),
      c('tomate', "Repousse pucerons et acariens par ses sulfures volatils."),
      c('salade', "Cohabitation tranquille sans concurrence."),
      c('camomille-romaine', "Effet stimulant sur la croissance de l'oignon (tradition)."),
      c('mache', "Effet répulsif sur certains ravageurs et cohabitation racinaire."),
      c('blette', "Effet répulsif olfactif sur la mineuse de la blette."),
    ],
    incompatibles: [
      c('haricot-vert', "Allium qui inhibe Rhizobium et bloque la fixation d'azote."),
      c('petit-pois', "Allium — blocage de la symbiose rhizobienne."),
      c('chou-kale', "Concurrence pour le soufre rapportée."),
      c('sauge', "Concurrence aromatique et croissance perturbée rapportée."),
    ],
  },
  origan: {
    companions: [
      c('tomate', "Repousse certains ravageurs et améliorerait la saveur (carvacrol)."),
      c('poivron', "Effet répulsif aromatique sur pucerons et thrips."),
      c('aubergine', "Bénéfice répulsif sur les ravageurs des solanacées."),
      c('courgette', "Attire les pollinisateurs en fleur."),
    ],
    incompatibles: [
      c('concombre', "Concurrence aromatique et besoins en eau divergents."),
      c('basilic', "Concurrence entre aromatiques aux besoins en eau opposés."),
    ],
  },
  panais: {
    companions: [
      c('oignon', "Émanations soufrées qui perturbent la mouche du panais."),
      c('ail', "Mécanisme répulsif olfactif similaire."),
      c('salade', "Couverture du sol pendant la croissance lente du panais."),
      c('radis', "Cycle court — marqueur de rangs, pas de concurrence."),
    ],
    incompatibles: [
      c('carotte', "Apiacée proche — partage maladies foliaires (alternaria) et insectes."),
      c('aneth', "Apiacée — hybridation possible et ravageurs communs."),
      c('cerfeuil', "Apiacée — ravageurs partagés."),
      c('persil', "Même famille — à séparer dans la rotation."),
    ],
  },
  persil: {
    companions: [
      c('tomate', "Attire les syrphes en fleur ; effet stimulant rapporté sur la tomate."),
      c('fraisier', "Repousserait les limaces et n'entre pas en concurrence."),
    ],
    incompatibles: [
      c('carotte', "Apiacée proche — partage maladies (alternaria) et mouche de la carotte."),
      c('aneth', "Apiacée — hybridation et ravageurs communs."),
      c('cerfeuil', "Apiacée — ravageurs partagés."),
      c('menthe', "Concurrence aromatique, croissance perturbée du persil."),
      c('salade', "Allélopathie rapportée du persil sur la salade."),
      c('blette', "Concurrence racinaire et croissance ralentie rapportée."),
      c('panais', "Apiacée proche — à séparer."),
    ],
  },
  'petit-pois': {
    companions: [
      c('carotte', "Cohabitation racinaire (surface vs profondeur) et bénéfice azoté pour la carotte."),
      c('radis', "Le radis profite de l'azote ; cycle court compatible."),
      c('navet', "Bénéfice azoté pour le navet."),
      c('salade', "Apport d'azote et microclimat partagé."),
      c('chou-kale', "Le pois fournit l'azote dont le chou raffole."),
      c('concombre', "Apport d'azote (cucurbitacée gourmande)."),
      c('rutabaga', "Apport d'azote bénéfique."),
    ],
    incompatibles: [
      c('ail', "Allium — inhibe Rhizobium et bloque la fixation d'azote."),
      c('oignon', "Allium — mécanisme inhibiteur de la symbiose."),
      c('echalote', "Allium — à éviter à proximité."),
      c('ciboulette', "Allium — inhibiteur."),
      c('pomme-de-terre', "Concurrence racinaire et risque de pourritures partagées."),
    ],
  },
  poivron: {
    companions: [
      c('basilic', "Repousse thrips et pucerons par ses huiles essentielles ; cohabite avec les besoins en chaleur du poivron."),
      c('tagetes', "Action nématicide racinaire bénéfique."),
      c('origan', "Effet répulsif aromatique sur pucerons."),
      c('haricot-vert', "Apport d'azote pour ce solanacée gourmand."),
      c('capucine', "Plante-piège pour pucerons."),
      c('souci', "Attracteur d'auxiliaires anti-puceron."),
      c('estragon', "Effet répulsif sur thrips et pucerons par voisinage aromatique."),
    ],
    incompatibles: [
      c('pomme-de-terre', "Solanacée — partage mildiou et alternariose."),
    ],
  },
  'pomme-de-terre': {
    companions: [
      c('haricot-vert', "Fixe l'azote et aurait un effet répulsif sur le doryphore."),
      c('capucine', "Effet répulsif traditionnel sur le doryphore."),
      c('tagetes', "Action nématicide racinaire et effet rapporté sur doryphore."),
      c('souci', "Attire les auxiliaires et nématicide modéré."),
    ],
    incompatibles: [
      c('tomate', "Solanacée — partage mildiou (Phytophthora infestans) et alternariose, risque épidémique majeur."),
      c('aubergine', "Solanacée — mêmes maladies et doryphore."),
      c('poivron', "Solanacée — partage maladies cryptogamiques."),
      c('concombre', "Allélopathie réciproque et risques fongiques croisés."),
      c('courgette', "Concurrence racinaire et pathogènes du sol partagés."),
      c('fraisier', "Partage de Verticillium dahliae (flétrissement)."),
      c('navet', "Concurrence racinaire et croissance ralentie."),
      c('tournesol', "Allélopathie marquée du tournesol qui inhibe la pomme de terre."),
      c('topinambour', "Concurrence racinaire et allélopathie ; à isoler absolument."),
      c('crosne', "Concurrence pour la couche racinaire de fond, risque de mêler les récoltes."),
      c('petit-pois', "Concurrence racinaire et risque de pourritures partagées."),
    ],
  },
  radis: {
    companions: [
      c('carotte', "Cycle court qui marque les rangs ; récolté avant que la carotte ait besoin de place."),
      c('salade', "Cohabitation harmonieuse, cycle court compatible."),
      c('cerfeuil', "Rendrait les radis plus piquants et plus résistants aux altises."),
      c('epinard', "Cycle court compatible, pas de concurrence."),
      c('petit-pois', "Bénéfice azoté."),
      c('capucine', "Repousse les altises du radis."),
      c('mache', "Cycle court compatible, peuvent être semés en mélange."),
      c('panais', "Cycle court — marqueur de rangs, pas de concurrence."),
    ],
    incompatibles: [
      c('chou-kale', "Brassicacée — partage altises et hernie du chou."),
      c('chou-fleur', "Brassicacée — mêmes ravageurs."),
      c('navet', "Brassicacée — mêmes ravageurs (succession OK, parallèle non)."),
      c('roquette', "Brassicacée — mêmes altises."),
      c('rutabaga', "Brassicacée — mêmes altises."),
    ],
  },
  romarin: {
    companions: [
      c('carotte', "Son parfum désoriente la mouche de la carotte."),
      c('chou-kale', "Effet répulsif sur la piéride et l'altise par ses huiles essentielles."),
      c('sauge', "Cohabitation harmonieuse entre Lamiacées sèches."),
      c('thym', "Mêmes besoins en sec — association classique des sols pauvres."),
    ],
    incompatibles: [
      c('basilic', "Besoins en eau opposés (basilic humide, romarin sec)."),
      c('concombre', "Besoins en eau et croissance incompatibles."),
      c('menthe', "Concurrence agressive de la menthe envahissante."),
    ],
  },
  roquette: {
    companions: [
      c('salade', "Cohabitation harmonieuse, cycles courts proches."),
      c('carotte', "Pas de concurrence racinaire."),
      c('haricot-vert', "Apport d'azote bénéfique à cette brassicacée à feuilles."),
      c('bourrache', "Attire les auxiliaires anti-puceron et altise."),
    ],
    incompatibles: [
      c('chou-kale', "Brassicacée — partage altises et hernie du chou."),
      c('chou-fleur', "Brassicacée — mêmes ravageurs."),
      c('navet', "Brassicacée — mêmes altises."),
      c('radis', "Brassicacée — partage altises (succession OK)."),
      c('rutabaga', "Brassicacée — mêmes ravageurs."),
    ],
  },
  rutabaga: {
    companions: [
      c('petit-pois', "Apport d'azote bénéfique à cette brassicacée gourmande."),
      c('haricot-vert', "Même bénéfice azoté."),
      c('salade', "Couverture du sol, pas de concurrence."),
      c('aneth', "Attire les parasitoïdes anti-piéride et altise."),
    ],
    incompatibles: [
      c('chou-kale', "Brassicacée — partage altises, mouche du chou et hernie."),
      c('chou-fleur', "Brassicacée — mêmes ravageurs et maladies."),
      c('navet', "Brassicacée très proche — mêmes ravageurs."),
      c('radis', "Brassicacée — mêmes altises."),
      c('roquette', "Brassicacée — mêmes ravageurs."),
    ],
  },
  salade: {
    companions: [
      c('carotte', "Couverture du sol au-dessus, pas de concurrence racinaire."),
      c('radis', "Cycle court compatible."),
      c('fraisier', "La salade ombre le sol et garde la fraîcheur du fraisier."),
      c('haricot-vert', "Apport d'azote et microclimat partagé."),
      c('cerfeuil', "La salade couvre le sol pour garder la fraîcheur du cerfeuil."),
      c('betterave', "Cohabitation racinaire harmonieuse."),
      c('oignon', "Effet répulsif léger et pas de concurrence."),
      c('coriandre', "Pas de concurrence, attire les auxiliaires."),
      c('epinard', "Cohabitation harmonieuse, mêmes besoins."),
      c('roquette', "Cycles courts proches."),
      c('aneth', "Ombrage léger et microclimat humide bénéfique."),
      c('navet', "Pas de concurrence racinaire."),
      c('panais', "Couverture du sol pendant la croissance lente du panais."),
      c('crosne', "Couvre le sol pendant que les crosnes développent leurs tubercules."),
      c('rutabaga', "Couverture du sol, pas de concurrence."),
      c('mache', "Cohabitation en planches d'hiver."),
      c('souci', "Attire les syrphes anti-puceron du collet."),
    ],
    incompatibles: [
      c('persil', "Allélopathie rapportée du persil sur la salade."),
      c('tournesol', "Allélopathie marquée (résidus inhibiteurs au sol)."),
      c('topinambour', "Ombrage excessif et allélopathie sur les plantes basses."),
    ],
  },
  sauge: {
    companions: [
      c('chou-kale', "Effet répulsif aromatique sur la piéride et l'altise."),
      c('chou-fleur', "Effet répulsif sur les ravageurs des brassicacées."),
      c('romarin', "Cohabitation harmonieuse entre Lamiacées sèches."),
      c('carotte', "Son parfum désorienterait la mouche de la carotte."),
    ],
    incompatibles: [
      c('concombre', "Besoins en eau opposés et inhibition aromatique rapportée."),
      c('basilic', "Lamiacées aux besoins en eau opposés."),
      c('oignon', "Concurrence aromatique et croissance perturbée."),
      c('melisse', "Concurrence aromatique et besoins en eau divergents."),
    ],
  },
  souci: {
    companions: [
      c('tomate', "Attire syrphes et coccinelles anti-puceron ; effet nématicide racinaire modéré."),
      c('chou-kale', "Attire les auxiliaires anti-puceron cendré du chou."),
      c('fraisier', "Effet nématicide et attracteur d'auxiliaires."),
      c('pomme-de-terre', "Effet nématicide modeste et auxiliaires."),
      c('aubergine', "Attire les auxiliaires anti-puceron et aleurodes."),
      c('courgette', "Attire les pollinisateurs et auxiliaires."),
      c('salade', "Attire les syrphes anti-puceron du collet."),
      c('chou-fleur', "Attracteur de syrphes anti-puceron."),
      c('poivron', "Attracteur d'auxiliaires anti-puceron."),
      c('crosne', "Attire les auxiliaires, réputé répulsif sur certains nématodes."),
      c('menthe', "Couple aromatique attracteur d'auxiliaires."),
    ],
    incompatibles: [],
  },
  tagetes: {
    companions: [
      c('tomate', "Ses racines secrètent α-terthiényl, nématicide qui protège les solanacées des Meloidogyne."),
      c('aubergine', "Action nématicide racinaire ; protection durable."),
      c('poivron', "Effet nématicide bénéfique pour les racines."),
      c('pomme-de-terre', "Action contre les nématodes du sol et effet répulsif sur le doryphore."),
      c('fraisier', "Effet nématicide contre les Pratylenchus des racines de fraisier."),
      c('haricot-vert', "Action nématicide protectrice ; pas de concurrence majeure."),
      c('chou-kale', "Attire syrphes et coccinelles anti-puceron."),
    ],
    incompatibles: [],
  },
  thym: {
    companions: [
      c('chou-kale', "Repousse la piéride par son parfum (thymol)."),
      c('chou-fleur', "Effet répulsif sur les ravageurs des brassicacées."),
      c('tomate', "Effet répulsif léger sur certains ravageurs."),
      c('aubergine', "Bénéfice répulsif sur les solanacées."),
      c('romarin', "Cohabitation harmonieuse entre Lamiacées sèches."),
    ],
    incompatibles: [
      c('concombre', "Besoins en eau opposés (thym sec, concombre humide)."),
      c('basilic', "Lamiacées aux besoins en eau opposés."),
      c('menthe', "Concurrence agressive de la menthe coureuse."),
    ],
  },
  tomate: {
    companions: [
      c('basilic', "Le parfum repousse aleurodes et pucerons ; la tomate ombre le basilic et freine sa montée en graines."),
      c('tagetes', "Ses racines secrètent α-terthiényl, nématicide qui protège des Meloidogyne."),
      c('souci', "Attire syrphes et coccinelles anti-puceron ; effet nématicide modéré."),
      c('capucine', "Plante-piège pour les pucerons qui s'y concentrent."),
      c('persil', "Attire les syrphes en fleur et stimule la tomate selon la tradition."),
      c('ail', "Émanations soufrées qui repoussent acariens et pucerons."),
      c('oignon', "Effet répulsif soufré sur pucerons et acariens."),
      c('ciboulette', "Allium répulsif léger, sans concurrence."),
      c('carotte', "Cohabitation racinaire complémentaire et pas de maladies partagées."),
      c('bourrache', "Attire les pollinisateurs et serait répulsive du sphinx de la tomate."),
      c('cosmos', "Attire les auxiliaires anti-puceron."),
      c('coriandre', "En fleur, attire les parasitoïdes des aleurodes."),
      c('melisse', "Attire les pollinisateurs et améliorerait la saveur."),
      c('echalote', "Repousse pucerons et acariens par ses sulfures volatils."),
      c('thym', "Effet répulsif léger sur certains ravageurs."),
      c('origan', "Repousse certains ravageurs et améliorerait la saveur (carvacrol)."),
      c('menthe', "Repousse les pucerons et certains acariens."),
      c('estragon', "Émanations aromatiques qui éloigneraient certains ravageurs."),
    ],
    incompatibles: [
      c('pomme-de-terre', "Solanacée — partage mildiou et alternariose, risque épidémique majeur."),
      c('aubergine', "Solanacée — partage mildiou et verticilliose."),
      c('fraisier', "Partage de Verticillium dahliae (flétrissement vasculaire)."),
      c('aneth', "Allélopathique pour la tomate en pleine maturité."),
      c('chou-kale', "Concurrence pour les nutriments, croissance mutuellement freinée."),
      c('topinambour', "Allélopathie marquée du topinambour qui inhibe la tomate."),
    ],
  },
  topinambour: {
    companions: [
      c('haricot-vert', "Apport d'azote, tuteur naturel possible."),
      c('souci', "Attire les auxiliaires et tolère l'ombre légère."),
    ],
    incompatibles: [
      c('tomate', "Allélopathie marquée qui inhibe la tomate."),
      c('pomme-de-terre', "Concurrence racinaire et allélopathie ; à isoler absolument."),
      c('crosne', "Tubéreuse vivace concurrente — espace racinaire partagé."),
      c('salade', "Ombrage excessif et allélopathie sur les plantes basses."),
    ],
  },
  tournesol: {
    companions: [
      c('concombre', "Sert de tuteur vivant et attire les pollinisateurs."),
      c('courgette', "Attire les pollinisateurs et auxiliaires."),
    ],
    incompatibles: [
      c('pomme-de-terre', "Allélopathie marquée qui inhibe la pomme de terre."),
      c('salade', "Allélopathie marquée (résidus inhibiteurs) sur les plantes basses."),
      c('haricot-vert', "Ombrage excessif et allélopathie légère."),
    ],
  },
}

async function main() {
  const slugs = Object.keys(PAIRINGS).sort()
  console.log(`→ Seed des associations pour ${slugs.length} plantes\n`)

  const idCache = new Map()
  async function resolveId(slug) {
    if (idCache.has(slug)) return idCache.get(slug)
    const id = await getPlantIdBySlug(slug)
    idCache.set(slug, id)
    return id
  }

  let totalCompanions = 0
  let totalIncompatibles = 0
  let failedPlants = 0

  for (const slug of slugs) {
    const data = PAIRINGS[slug]
    const plantId = await resolveId(slug)
    if (!plantId) {
      console.log(`  ✗ ${slug}: plante introuvable, skip.`)
      failedPlants++
      continue
    }

    // Resolve compagnons + incompatibles vers IDs
    const companions = []
    for (const pair of data.companions ?? []) {
      const id = await resolveId(pair.slug)
      if (!id) {
        console.log(`     ⚠ ${slug} → ${pair.slug} introuvable, skip.`)
        continue
      }
      companions.push({ plant: id, note: pair.note })
    }
    const incompatibles = []
    for (const pair of data.incompatibles ?? []) {
      const id = await resolveId(pair.slug)
      if (!id) continue
      incompatibles.push({ plant: id, note: pair.note })
    }

    try {
      await request(`/api/plants/${plantId}`, {
        method: 'PATCH',
        body: { companions, incompatibles },
      })
      console.log(
        `  ✓ ${slug.padEnd(20)}  ${companions.length} compagnons, ${incompatibles.length} incompatibles`,
      )
      totalCompanions += companions.length
      totalIncompatibles += incompatibles.length
    } catch (err) {
      console.log(`  ✗ ${slug}: ${err.message}`)
      failedPlants++
    }
  }

  console.log(
    `\n— ${totalCompanions} compagnons, ${totalIncompatibles} incompatibles, ${failedPlants} échecs.`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
