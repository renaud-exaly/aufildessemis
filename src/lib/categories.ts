export const PLANT_CATEGORIES = [
  { value: 'legume-fruit', label: 'Légume-fruit' },
  { value: 'legume-feuille', label: 'Légume-feuille' },
  { value: 'legume-racine', label: 'Légume-racine' },
  { value: 'legume-bulbe', label: 'Légume-bulbe' },
  { value: 'legume-tige', label: 'Légume-tige' },
  { value: 'legume-fleur', label: 'Légume-fleur' },
  { value: 'aromatique', label: 'Aromatique' },
  { value: 'fleur', label: 'Fleur du potager' },
  { value: 'petit-fruit', label: 'Petit fruit' },
  { value: 'arbre-fruitier', label: 'Arbre fruitier' },
  { value: 'engrais-vert', label: 'Engrais vert' },
  { value: 'exotique-interieur', label: "Exotique d'intérieur" },
] as const

export type PlantCategory = (typeof PLANT_CATEGORIES)[number]['value']

export const PLANT_CATEGORY_LABEL: Record<PlantCategory, string> = Object.fromEntries(
  PLANT_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<PlantCategory, string>
