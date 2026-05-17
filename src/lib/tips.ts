/**
 * Catégories de tips — utilisées pour le filtre `/tips?categorie=X` et les
 * pages dédiées `/tips/categorie/[slug]`.
 *
 * Ces clés sont stockées en base. Si tu en ajoutes, n'oublie pas un seed/
 * migration des tips existants pour leur poser la nouvelle catégorie.
 */
export const TIP_CATEGORIES = [
  { value: 'semis', label: 'Semis & germination' },
  { value: 'sol', label: 'Sol, compost & paillage' },
  { value: 'arrosage', label: 'Arrosage' },
  { value: 'maladies', label: 'Maladies & nuisibles' },
  { value: 'recolte', label: 'Récolte & conservation' },
  { value: 'outils', label: 'Outils & gestes' },
  { value: 'associations', label: 'Pluriculture & compagnonnage' },
  { value: 'saisons', label: 'Climat & saisons (BE)' },
] as const

export type TipCategory = (typeof TIP_CATEGORIES)[number]['value']

export const TIP_CATEGORY_LABEL: Record<TipCategory, string> = Object.fromEntries(
  TIP_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<TipCategory, string>

/**
 * Intro éditoriale courte affichée en haut de `/tips/categorie/[slug]` —
 * fallback si pas encore édité en CMS. À déplacer en collection plus tard
 * si tu veux les retravailler sans déployer.
 */
export const TIP_CATEGORY_INTRO: Record<TipCategory, string> = {
  semis:
    "Lever des graines, c'est l'art le plus humble du potager. Voici les gestes qui font la différence entre un semis qui patine et un semis qui démarre net.",
  sol:
    "Un sol vivant fait tout le reste. Compost, paillage, rotations, engrais verts — ce qui se passe sous la pelle, et ce qu'on fait pour l'entretenir.",
  arrosage:
    "Trop, pas assez, au mauvais moment. L'arrosage paraît simple mais c'est souvent là que les récoltes se jouent. Méthodes douces, économes en eau.",
  maladies:
    "Mildiou, pucerons, limaces. Ce qu'on évite, ce qu'on accepte, ce qu'on traite — toujours en commençant par la prévention plutôt que le pulvérisateur.",
  recolte:
    "Quand cueillir, comment garder. La récolte n'est pas le bout du chemin : c'est là que se décident le goût, la conservation, et les graines pour l'année prochaine.",
  outils:
    "Le bon geste avec le bon outil. Pas besoin d'un magasin de jardinerie — quelques outils bien choisis, quelques gestes qui s'affinent saison après saison.",
  associations:
    "Quelles plantes se plaisent côte à côte, lesquelles se gênent. Les bases de la pluriculture, sans dogme — ce qui marche réellement au potager.",
  saisons:
    "Le climat belge a ses particularités : saints de glace, pluies d'été, courtes périodes chaudes. Comment caler son potager dessus.",
}
