#!/usr/bin/env node
/**
 * Seed des fiches plantes en prod via REST API Payload.
 *
 * Usage :
 *   PROD_API_KEY=<key> node scripts/seed-prod-plants.mjs
 *   PROD_API_KEY=<key> PROD_URL=https://aufildessemis.be node scripts/seed-prod-plants.mjs
 *
 * Idempotent : skip si le slug existe déjà.
 */

const API_URL = process.env.PROD_URL ?? 'https://aufildessemis.be'
const API_KEY = process.env.PROD_API_KEY
if (!API_KEY) {
  console.error('❌ PROD_API_KEY manquante.')
  process.exit(1)
}

const richText = (text) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          {
            type: 'text',
            format: 0,
            style: '',
            mode: 'normal',
            text,
            detail: 0,
            version: 1,
          },
        ],
      },
    ],
  },
})

const s = (stage, daysFromPrevious, tip) => ({ stage, daysFromPrevious, tip })

const PLANTS = [
  // VAGUE 1 — Étoiles
  {
    name: 'Concombre', latinName: 'Cucumis sativus', slug: 'concombre',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Intérieur en avril, pleine terre dès la mi-mai.' },
    description: "Cucurbitacée gourmande en eau et en chaleur. Tuteure pour gagner de la place et garder les fruits propres.",
    typicalStages: [
      s('semis', null, 'En godet, 2 graines à 2 cm, à 22-25°C.'),
      s('levee', 7, "Lève en 5-10 jours. Garde la plus belle pousse."),
      s('repiquage', 21, 'Repique en pleine terre après les saints de glace.'),
      s('tuteurage', 14, 'Sur treillis ou ficelle verticale, gain de place énorme.'),
      s('floraison', 21, 'Pollinisation par les insectes — laisse les abeilles bosser.'),
      s('recolte', 21, 'Récolte jeunes (15-20 cm) pour des fruits tendres, en continu.'),
    ],
  },
  {
    name: 'Aubergine', latinName: 'Solanum melongena', slug: 'aubergine',
    sowingWindow: { startMonth: '02', endMonth: '04', note: 'Semis très précoce à la chaleur, plante frileuse.' },
    description: "La diva du potager belge : exige chaleur, soleil et patience. Sous serre ou contre un mur sud, elle se laisse apprivoiser.",
    typicalStages: [
      s('semis', null, 'À 24-28°C en intérieur, terreau fin à peine recouvert.'),
      s('levee', 14, 'Lève lentement (10-20 jours). Soit patient.'),
      s('repiquage', 30, 'Rempote en godet plus grand dès 4 vraies feuilles.'),
      s('endurcissement', 60, "Sors progressivement à l'extérieur 1 sem avant mise en terre."),
      s('mise-en-terre', 7, 'En pleine terre fin mai, abritée du vent.'),
      s('floraison', 45, 'Petites fleurs violettes. Pince les premières.'),
      s('recolte', 45, 'Récolte brillante et ferme, avant que la peau ne ternisse.'),
    ],
  },
  {
    name: 'Haricot vert', latinName: 'Phaseolus vulgaris', slug: 'haricot-vert',
    sowingWindow: { startMonth: '05', endMonth: '07', note: 'En pleine terre, sol réchauffé (15°C min).' },
    description: "Légumineuse qui fixe l'azote — laisse ses racines en place après récolte pour nourrir le sol.",
    typicalStages: [
      s('semis', null, 'En poquet de 5-6 graines à 3 cm de profondeur, écartement 40 cm.'),
      s('levee', 10, 'Lève en 7-12 jours. Pas besoin de repiquage.'),
      s('tuteurage', 14, 'Pour les rames seulement. Les nains se débrouillent.'),
      s('floraison', 30, 'Petites fleurs blanches ou violettes selon variété.'),
      s('recolte', 21, 'Récolte 2-3 fois/semaine pour stimuler la production.'),
    ],
  },
  {
    name: 'Petit pois', latinName: 'Pisum sativum', slug: 'petit-pois',
    sowingWindow: { startMonth: '02', endMonth: '05', note: 'Très précoce, supporte bien le froid.' },
    description: "Une des premières semées de l'année. Croquant dans la cosse fraîchement cueillie, incomparable.",
    typicalStages: [
      s('semis', null, 'En ligne, graines à 3 cm de profondeur, espacement 5 cm.'),
      s('levee', 12, "Lève en 10-15 jours, même sous fraîches."),
      s('tuteurage', 21, 'Rames ou filet, indispensable pour la plupart des variétés.'),
      s('floraison', 30, 'Petites fleurs blanches caractéristiques.'),
      s('recolte', 21, 'Quand les cosses sont bien remplies mais encore tendres.'),
    ],
  },
  {
    name: 'Oignon', latinName: 'Allium cepa', slug: 'oignon',
    sowingWindow: { startMonth: '02', endMonth: '04', note: 'Plantation de bulbilles plus simple que semis.' },
    description: "Bulbe de base de la cuisine. Bulbilles au printemps = méthode la plus simple pour démarrer.",
    typicalStages: [
      s('mise-en-terre', null, 'Plante les bulbilles pointe vers le haut, à peine enterrées.'),
      s('levee', 14, 'La pousse verte sort en 1-2 semaines.'),
      s('recolte', 120, 'Récolte quand le feuillage jaunit et tombe naturellement.'),
    ],
  },
  {
    name: 'Échalote', latinName: 'Allium ascalonicum', slug: 'echalote',
    sowingWindow: { startMonth: '02', endMonth: '03', note: 'Plantation très tôt — supporte le froid.' },
    description: "Plus fine et parfumée que l'oignon. Chaque caïeu plantée donne une touffe de 6-8 bulbes.",
    typicalStages: [
      s('mise-en-terre', null, 'Caïeu pointe en haut, à peine enterré, espacement 15 cm.'),
      s('levee', 21, "Apparition des premières feuilles vertes."),
      s('recolte', 120, 'Quand le feuillage sèche, en juillet généralement.'),
    ],
  },
  {
    name: 'Ail', latinName: 'Allium sativum', slug: 'ail',
    sowingWindow: { startMonth: '10', endMonth: '12', note: "Plantation automnale en Belgique, l'ail a besoin du froid." },
    description: "Plante d'automne — gousses mises en terre avant l'hiver, récolte l'été suivant. Adore les sols meubles et drainés.",
    typicalStages: [
      s('mise-en-terre', null, 'Gousses pointe en haut, 3 cm de profondeur.'),
      s('levee', 21, "Pousse verte avant l'hiver, dormance puis reprise au printemps."),
      s('recolte', 240, "En juin-juillet, quand 2/3 des feuilles ont jauni."),
    ],
  },
  {
    name: 'Pomme de terre', latinName: 'Solanum tuberosum', slug: 'pomme-de-terre',
    sowingWindow: { startMonth: '03', endMonth: '04', note: 'Plantation après les dernières gelées. Pré-germer 4 sem avant.' },
    description: "Le tubercule incontournable. Variétés précoces (récolte 90j) ou conservation (120j+). Buttage clé pour le rendement.",
    typicalStages: [
      s('mise-en-terre', null, 'Plant pré-germé, germes vers le haut, à 10 cm de profondeur.'),
      s('levee', 21, 'Feuillage vert qui sort, susceptible au gel tardif.'),
      s('eclaircissage', 30, 'Premier buttage quand les plants font 20 cm.'),
      s('floraison', 45, 'Fleurs blanches/violettes = les tubercules grossissent.'),
      s('recolte', 30, 'Quand le feuillage jaunit, ou plus tôt pour des grenailles.'),
    ],
  },

  // VAGUE 2 — Aromatiques
  {
    name: 'Persil', latinName: 'Petroselinum crispum', slug: 'persil',
    sowingWindow: { startMonth: '03', endMonth: '07', note: "Plat ou frisé — au choix." },
    description: "Bisannuel. Lève lentement (3 semaines), mais une fois lancé donne pendant des mois.",
    typicalStages: [
      s('semis', null, 'Tremper les graines 24h avant. Semer à peine recouvert.'),
      s('levee', 21, 'Lève en 15-25 jours, patience nécessaire.'),
      s('eclaircissage', 14, 'Garde 1 plant tous les 10 cm.'),
      s('recolte', 60, 'Coupe les tiges extérieures, le cœur continue de produire.'),
    ],
  },
  {
    name: 'Ciboulette', latinName: 'Allium schoenoprasum', slug: 'ciboulette',
    sowingWindow: { startMonth: '03', endMonth: '05', note: 'Vivace — un plant pour des années de récolte.' },
    description: "Vivace très généreuse. Coupe ras au-dessus du sol, elle repousse en quelques semaines.",
    typicalStages: [
      s('semis', null, 'En godet, plusieurs graines pour faire une touffe.'),
      s('levee', 14, 'Lève en 10-20 jours.'),
      s('repiquage', 60, 'Touffe au jardin, espacée de 25 cm.'),
      s('floraison', 60, 'Fleurs mauves comestibles, à incorporer en salade.'),
      s('recolte', 30, 'Coupe à 2 cm du sol, recommence aussitôt.'),
    ],
  },
  {
    name: 'Coriandre', latinName: 'Coriandrum sativum', slug: 'coriandre',
    sowingWindow: { startMonth: '04', endMonth: '07', note: 'Monte vite en graine — semis échelonnés.' },
    description: "Feuillage et graines. Monte vite à fleur en plein été — semis toutes les 3 semaines pour avoir des feuilles en continu.",
    typicalStages: [
      s('semis', null, 'En place de préférence, racines fragiles au repiquage.'),
      s('levee', 14, 'Lève en 10-15 jours.'),
      s('recolte', 45, 'Feuilles dès 4-5 vraies feuilles, graines quand elles brunissent.'),
    ],
  },
  {
    name: 'Thym', latinName: 'Thymus vulgaris', slug: 'thym',
    sowingWindow: { startMonth: '03', endMonth: '05', note: 'Vivace méditerranéenne — préfère le sec.' },
    description: "Vivace robuste, sobre en eau. Adore les sols pauvres et drainants. Un plant peut vivre 4-5 ans avant de se lignifier.",
    typicalStages: [
      s('semis', null, 'En godet, graines à peine recouvertes, à 18-20°C.'),
      s('levee', 21, 'Lève en 15-25 jours, patience.'),
      s('repiquage', 60, 'Sol bien drainé, plein soleil, espacement 30 cm.'),
      s('recolte', 90, 'Toute l\'année, surtout avant floraison pour plus de parfum.'),
    ],
  },
  {
    name: 'Romarin', latinName: 'Rosmarinus officinalis', slug: 'romarin',
    sowingWindow: { startMonth: '04', endMonth: '05', note: 'Plus simple par bouture que par semis.' },
    description: "Arbuste vivace persistant. Préfère le bouturage (90j) au semis. Une fois installé, dure des décennies.",
    typicalStages: [
      s('semis', null, 'À la chaleur (20-22°C), terreau drainant.'),
      s('levee', 21, 'Lève en 15-30 jours, irrégulièrement.'),
      s('mise-en-terre', 90, 'Plein soleil, sol drainé, à l\'abri du vent du nord.'),
      s('recolte', 180, 'Cueille selon les besoins, toute l\'année.'),
    ],
  },
  {
    name: 'Sauge', latinName: 'Salvia officinalis', slug: 'sauge',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Vivace persistante, plante 1 plant par famille suffit.' },
    description: "Vivace persistante au feuillage gris-vert. Très peu d'entretien, fleurit en bleu en début d'été.",
    typicalStages: [
      s('semis', null, 'En godet, à 18-20°C.'),
      s('levee', 21, 'Lève en 14-21 jours.'),
      s('mise-en-terre', 60, 'Plein soleil, sol drainant.'),
      s('floraison', 365, 'Belles fleurs bleues la deuxième année.'),
      s('recolte', 90, 'Feuilles toute l\'année — plus parfumées avant la floraison.'),
    ],
  },
  {
    name: 'Menthe', latinName: 'Mentha spicata', slug: 'menthe',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Plantation par boutures/division — envahissante.' },
    description: "Vivace TRÈS envahissante. Plante-la dans un pot enterré pour contenir ses rhizomes, sinon elle colonise tout.",
    typicalStages: [
      s('mise-en-terre', null, 'Bouture ou division de touffe, dans un pot enterré.'),
      s('recolte', 60, 'Coupe régulièrement, ça la renforce.'),
    ],
  },
  {
    name: 'Mélisse', latinName: 'Melissa officinalis', slug: 'melisse',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Vivace au parfum citronné. Se ressème spontanément.' },
    description: "Vivace au parfum citron-citronnelle. Très appréciée des abeilles. Tisane apaisante.",
    typicalStages: [
      s('semis', null, 'En surface, graines à la lumière pour germer.'),
      s('levee', 21, 'Lève en 15-21 jours.'),
      s('mise-en-terre', 60, 'Mi-ombre, sol frais.'),
      s('recolte', 90, 'Avant floraison pour la tisane, feuilles fraîches en cuisine.'),
    ],
  },
  {
    name: 'Aneth', latinName: 'Anethum graveolens', slug: 'aneth',
    sowingWindow: { startMonth: '04', endMonth: '07', note: 'Annuel, semis échelonnés.' },
    description: "Annuel, monte vite en graines. Sème en continu pour avoir des feuilles tout l'été. Compagnon du concombre.",
    typicalStages: [
      s('semis', null, 'En place, racine pivotante n\'aime pas le repiquage.'),
      s('levee', 14, 'Lève en 10-14 jours.'),
      s('recolte', 45, 'Feuilles dès 20 cm, graines à maturité (août-sept).'),
    ],
  },
  {
    name: 'Origan', latinName: 'Origanum vulgare', slug: 'origan',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Vivace méditerranéenne.' },
    description: "Vivace au parfum chaud, idéal sur pizzas et plats du sud. Fleurs roses très visitées par les pollinisateurs.",
    typicalStages: [
      s('semis', null, 'En surface, graines minuscules à la lumière.'),
      s('levee', 21, 'Lève lentement (15-25 jours).'),
      s('mise-en-terre', 60, 'Plein soleil, sol drainant.'),
      s('recolte', 120, 'Feuilles fraîches ou séchées avant floraison.'),
    ],
  },
  {
    name: 'Estragon', latinName: 'Artemisia dracunculus', slug: 'estragon',
    sowingWindow: { startMonth: '03', endMonth: '04', note: 'Vivace — division de touffe (le vrai estragon ne se sème pas).' },
    description: "L'estragon de France ne produit pas de graines viables — propage par division au printemps. Parfum anisé indispensable en cuisine.",
    typicalStages: [
      s('mise-en-terre', null, 'Division d\'une touffe existante, à la fonte des gelées.'),
      s('recolte', 60, 'Feuilles fraîches toute la saison, sèche pour l\'hiver.'),
    ],
  },
  {
    name: 'Cerfeuil', latinName: 'Anthriscus cerefolium', slug: 'cerfeuil',
    sowingWindow: { startMonth: '03', endMonth: '09', note: 'Annuel à cycle court, semis tous les mois.' },
    description: "Annuel délicat au parfum anisé. Monte vite à fleur — semis échelonnés en mi-ombre pour prolonger.",
    typicalStages: [
      s('semis', null, 'En place, en surface, peu recouvert.'),
      s('levee', 14, 'Lève en 10-15 jours.'),
      s('recolte', 45, 'Coupe régulièrement avant montée en graines.'),
    ],
  },

  // VAGUE 3 — Racines, feuilles, oubliés
  {
    name: 'Betterave', latinName: 'Beta vulgaris', slug: 'betterave',
    sowingWindow: { startMonth: '04', endMonth: '07', note: 'En pleine terre dès que le sol est ressuyé.' },
    description: "Racine sucrée à la chair colorée. Variétés rondes ou allongées. Les fanes se mangent en gratin.",
    typicalStages: [
      s('semis', null, 'En ligne, 1 graine tous les 5 cm, 2 cm de profondeur.'),
      s('levee', 12, 'Lève en 10-14 jours.'),
      s('eclaircissage', 14, 'Garde un plant tous les 10-15 cm.'),
      s('recolte', 80, 'Quand les racines font 5-8 cm de diamètre.'),
    ],
  },
  {
    name: 'Navet', latinName: 'Brassica rapa', slug: 'navet',
    sowingWindow: { startMonth: '03', endMonth: '09', note: 'Cycles courts, semis échelonnés.' },
    description: "Cycle rapide (60-90j). Préfère les semis d'été pour une récolte d'automne plus douce.",
    typicalStages: [
      s('semis', null, 'En ligne, 1 cm de profondeur.'),
      s('levee', 7, 'Très rapide, 5-10 jours.'),
      s('eclaircissage', 14, 'Garde 1 plant tous les 10 cm.'),
      s('recolte', 60, 'À la taille d\'une balle de tennis pour la tendresse.'),
    ],
  },
  {
    name: 'Panais', latinName: 'Pastinaca sativa', slug: 'panais',
    sowingWindow: { startMonth: '03', endMonth: '05', note: 'Cycle très long (6 mois). Sol profond.' },
    description: "Racine douce, sucrée et un peu anisée. Longue à pousser mais se conserve en terre tout l'hiver.",
    typicalStages: [
      s('semis', null, 'En place (racine pivotante), graines fraîches obligatoires.'),
      s('levee', 21, 'Très lent (15-25 jours), patience.'),
      s('eclaircissage', 21, 'Garde un plant tous les 10-15 cm.'),
      s('recolte', 180, 'Après les premières gelées qui adoucissent la chair.'),
    ],
  },
  {
    name: 'Épinard', latinName: 'Spinacia oleracea', slug: 'epinard',
    sowingWindow: { startMonth: '03', endMonth: '09', note: 'Évite plein été — monte trop vite à fleur.' },
    description: "Préfère les saisons fraîches (printemps et automne). En plein été, il monte à fleurs au lieu de produire.",
    typicalStages: [
      s('semis', null, 'En ligne, 2 cm de profondeur.'),
      s('levee', 10, 'Lève en 7-12 jours.'),
      s('recolte', 45, 'Feuille à feuille, le cœur continue de produire.'),
    ],
  },
  {
    name: 'Roquette', latinName: 'Eruca sativa', slug: 'roquette',
    sowingWindow: { startMonth: '03', endMonth: '09', note: 'Cycle ultra-court, semis tous les 15 jours.' },
    description: "Salade piquante au cycle très court (30-45j). Se ressème spontanément si on la laisse fleurir.",
    typicalStages: [
      s('semis', null, 'En surface, peu recouverte, en ligne ou à la volée.'),
      s('levee', 5, 'Très rapide (3-7 jours).'),
      s('recolte', 30, 'À la cisaille, la base repousse 2-3 fois.'),
    ],
  },
  {
    name: 'Mâche', latinName: 'Valerianella locusta', slug: 'mache',
    sowingWindow: { startMonth: '08', endMonth: '10', note: 'Salade d\'automne et d\'hiver.' },
    description: "Salade d'hiver typique. Sème en fin d'été pour récolter d'octobre à mars. Très résistante au froid.",
    typicalStages: [
      s('semis', null, 'En place, en ligne, à la volée si tu préfères.'),
      s('levee', 12, 'Lève en 10-15 jours.'),
      s('recolte', 90, 'À la rosette entière, en plein hiver.'),
    ],
  },
  {
    name: 'Blette', latinName: 'Beta vulgaris subsp. cicla', slug: 'blette',
    sowingWindow: { startMonth: '03', endMonth: '07', note: 'Une seule plantation produit toute la saison.' },
    description: "Cardes colorées (blanc, jaune, rouge) selon variété. Les feuilles ET les cardes se mangent. Très productive.",
    typicalStages: [
      s('semis', null, 'En godet ou en place, 2 cm de profondeur.'),
      s('levee', 10, 'Lève en 8-14 jours.'),
      s('repiquage', 30, 'Espacement 40 cm — chaque plant prend de la place.'),
      s('recolte', 60, 'Feuille à feuille, le cœur continue toute la saison.'),
    ],
  },
  {
    name: 'Chou kale', latinName: 'Brassica oleracea var. acephala', slug: 'chou-kale',
    sowingWindow: { startMonth: '03', endMonth: '06', note: 'Très rustique, supporte -10°C.' },
    description: "Chou non-pommé aux feuilles frisées. Plus tendre après les premières gelées. Toute la saison hivernale.",
    typicalStages: [
      s('semis', null, 'En godet pour repiquer ensuite.'),
      s('levee', 10, 'Lève en 7-12 jours.'),
      s('repiquage', 45, 'Espacement 50 cm, sol riche en compost.'),
      s('recolte', 90, 'Feuille à feuille, en commençant par le bas. Hiver inclus.'),
    ],
  },
  {
    name: 'Chou-fleur', latinName: 'Brassica oleracea var. botrytis', slug: 'chou-fleur',
    sowingWindow: { startMonth: '03', endMonth: '06', note: 'Demande un sol riche et un arrosage régulier.' },
    description: "Capricieux : un coup de chaud ou de sec fait monter en graines au lieu de pommer. Variétés d'été ou d'automne.",
    typicalStages: [
      s('semis', null, 'En godet, terreau de qualité.'),
      s('levee', 10, 'Lève en 7-12 jours.'),
      s('repiquage', 45, 'Espacement 60 cm, terre tassée autour du collet.'),
      s('recolte', 90, 'Pomme blanche et serrée, avant qu\'elle ne s\'ouvre.'),
    ],
  },
  {
    name: 'Topinambour', latinName: 'Helianthus tuberosus', slug: 'topinambour',
    sowingWindow: { startMonth: '03', endMonth: '04', note: 'Vivace envahissante — choisis bien son emplacement.' },
    description: "Le 'soleil sauvage' au goût d'artichaut. Vivace très rustique mais envahissante : 1 tubercule oublié = repousse l'année suivante.",
    typicalStages: [
      s('mise-en-terre', null, 'Tubercules à 10 cm de profondeur, espacement 50 cm.'),
      s('levee', 30, 'Tiges qui montent en mai, peuvent atteindre 2 m.'),
      s('floraison', 150, 'Petites fleurs jaunes en septembre.'),
      s('recolte', 60, 'Après les premières gelées, déterre au fur et à mesure.'),
    ],
  },
  {
    name: 'Crosne', latinName: 'Stachys affinis', slug: 'crosne',
    sowingWindow: { startMonth: '03', endMonth: '04', note: 'Tubercules vivaces, oubliés du potager.' },
    description: "Tubercule étonnant en forme de chenille blanche, goût fin d'artichaut. Très productif, à découvrir.",
    typicalStages: [
      s('mise-en-terre', null, 'Tubercules à 5 cm de profondeur, sol meuble.'),
      s('levee', 30, 'Tiges qui montent au printemps.'),
      s('recolte', 210, 'D\'octobre à mars, à mesure des besoins.'),
    ],
  },
  {
    name: 'Rutabaga', latinName: 'Brassica napobrassica', slug: 'rutabaga',
    sowingWindow: { startMonth: '05', endMonth: '06', note: 'Légume oublié, à redécouvrir.' },
    description: "Croisement entre chou et navet, racine douce et fondante en gratin. Résiste aux gelées et se conserve longtemps.",
    typicalStages: [
      s('semis', null, 'En place ou en godet, 2 cm de profondeur.'),
      s('levee', 10, 'Lève en 7-14 jours.'),
      s('eclaircissage', 21, 'Garde un plant tous les 25 cm.'),
      s('recolte', 150, 'En octobre-novembre, après les premières gelées.'),
    ],
  },

  // VAGUE 4 — Fleurs compagnes
  {
    name: 'Capucine', latinName: 'Tropaeolum majus', slug: 'capucine',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Fleur ET compagne du potager.' },
    description: "Fleur grimpante orangée, comestible (fleurs + feuilles + boutons en câprons). Attire les pucerons et les détourne du potager.",
    typicalStages: [
      s('semis', null, 'En poquet de 2-3 graines à 2 cm, en place.'),
      s('levee', 12, 'Lève en 10-15 jours.'),
      s('floraison', 60, 'Fleurs en continu de juin aux gelées.'),
      s('recolte', 60, 'Fleurs en salade, boutons confits comme des câpres.'),
    ],
  },
  {
    name: 'Souci', latinName: 'Calendula officinalis', slug: 'souci',
    sowingWindow: { startMonth: '03', endMonth: '06', note: 'Compagnon classique de tout potager.' },
    description: "Fleur orange ou jaune, comestible et médicinale (calendula). Très bonne compagne — attire pollinisateurs et auxiliaires.",
    typicalStages: [
      s('semis', null, 'En place, à 1 cm de profondeur.'),
      s('levee', 10, 'Lève en 7-14 jours.'),
      s('floraison', 60, 'Fleurit jusqu\'aux gelées si on coupe les fanées.'),
      s('recolte', 60, 'Pétales en salade ou pour macérat huileux.'),
    ],
  },
  {
    name: 'Bourrache', latinName: 'Borago officinalis', slug: 'bourrache',
    sowingWindow: { startMonth: '03', endMonth: '06', note: 'Se ressème spontanément année après année.' },
    description: "Grandes feuilles velues et fleurs bleu vif comestibles (goût de concombre). Attire massivement les abeilles.",
    typicalStages: [
      s('semis', null, 'En place, racine pivotante. 2 cm de profondeur.'),
      s('levee', 12, 'Lève en 10-15 jours.'),
      s('floraison', 60, 'Fleurs bleues étoilées en abondance.'),
      s('recolte', 60, 'Fleurs en glaçon ou en salade, feuilles jeunes hachées.'),
    ],
  },
  {
    name: 'Cosmos', latinName: 'Cosmos bipinnatus', slug: 'cosmos',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Annuelle qui éclate du potager d\'août à octobre.' },
    description: "Annuelle légère et aérienne, fleurs en marguerite roses/blanches/rouges. Très visitée par les pollinisateurs.",
    typicalStages: [
      s('semis', null, 'En godet ou en place, à peine recouverte.'),
      s('levee', 10, 'Lève en 7-14 jours.'),
      s('repiquage', 30, 'Espacement 30 cm, plein soleil.'),
      s('floraison', 60, 'En continu jusqu\'aux gelées.'),
    ],
  },
  {
    name: 'Tagetes', latinName: 'Tagetes patula', slug: 'tagetes',
    sowingWindow: { startMonth: '03', endMonth: '05', note: "Œillet d'Inde — répulsif naturel pour les tomates." },
    description: "Œillet d'Inde au parfum prononcé. Ses racines secrètent des composés qui repoussent les nématodes des tomates.",
    typicalStages: [
      s('semis', null, 'En godet, à 18-20°C.'),
      s('levee', 7, 'Lève en 5-10 jours.'),
      s('repiquage', 30, 'En bordure de tomates, espacement 30 cm.'),
      s('floraison', 60, 'Fleurs orange/jaune en continu.'),
    ],
  },
  {
    name: 'Fraisier', latinName: 'Fragaria × ananassa', slug: 'fraisier',
    sowingWindow: { startMonth: '09', endMonth: '04', note: 'Plantation préférée en automne ou fin d\'hiver.' },
    description: "Vivace qui produit 3 ans avant de fatiguer. Stolons rampants pour propagation. Variétés remontantes ou non.",
    typicalStages: [
      s('mise-en-terre', null, 'Plant à racines nues ou en motte, collet au ras du sol.'),
      s('floraison', 60, 'Petites fleurs blanches qui donneront les fruits.'),
      s('recolte', 30, 'De mai à juillet (non-remontantes), tout l\'été (remontantes).'),
    ],
  },
  {
    name: 'Tournesol', latinName: 'Helianthus annuus', slug: 'tournesol',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Lumineux et utile aux abeilles.' },
    description: "Annuelle géante (1-3 m selon variété). Fleur structurante au jardin, graines pour les oiseaux à l'automne.",
    typicalStages: [
      s('semis', null, 'En poquet de 2 graines, 2 cm de profondeur, en place.'),
      s('levee', 10, 'Lève en 7-14 jours, vite.'),
      s('floraison', 80, 'Capitule jaune qui suit le soleil avant maturité.'),
      s('recolte', 30, 'Graines mûres quand le dos du capitule jaunit.'),
    ],
  },
  {
    name: 'Camomille romaine', latinName: 'Chamaemelum nobile', slug: 'camomille-romaine',
    sowingWindow: { startMonth: '04', endMonth: '06', note: 'Vivace rampante, tapis fleuri.' },
    description: "Vivace tapissante. Fleurs blanches au cœur jaune pour tisanes. Bonne compagne — son parfum éloigne certains ravageurs.",
    typicalStages: [
      s('semis', null, 'En surface, graines fines à la lumière.'),
      s('levee', 14, 'Lève en 10-21 jours.'),
      s('mise-en-terre', 60, 'Espacement 30 cm, sol drainant.'),
      s('floraison', 90, 'Fleurs en juillet-août, à cueillir au matin.'),
    ],
  },
]

const auth = `users API-Key ${API_KEY}`

async function request(path, opts = {}) {
  const url = `${API_URL}${path}`
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} on ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function existsBySlug(slug) {
  const q = new URLSearchParams({
    'where[slug][equals]': slug,
    limit: '1',
    depth: '0',
  })
  const data = await request(`/api/plants?${q.toString()}`)
  return data.docs?.[0] ?? null
}

async function main() {
  let created = 0
  let skipped = 0
  let failed = 0

  for (const p of PLANTS) {
    try {
      const existing = await existsBySlug(p.slug)
      if (existing) {
        console.log(`  ↷ ${p.name} (${p.slug}) déjà présent, skip.`)
        skipped++
        continue
      }
      await request('/api/plants', {
        method: 'POST',
        body: {
          name: p.name,
          latinName: p.latinName,
          slug: p.slug,
          sowingWindow: p.sowingWindow,
          description: richText(p.description),
          typicalStages: p.typicalStages,
        },
      })
      console.log(`  ✓ ${p.name} (${p.slug})`)
      created++
    } catch (err) {
      console.log(`  ✗ ${p.name} (${p.slug}): ${err.message}`)
      failed++
    }
  }

  console.log(`\n— ${created} créées, ${skipped} déjà là, ${failed} échecs.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
