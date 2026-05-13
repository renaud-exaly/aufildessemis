/**
 * Étapes possibles d'un semis. Enum global — chaque `Plant` déclare lesquelles
 * lui sont applicables via `typicalStages`. Une `SowingUpdate` peut être taguée
 * (optionnellement) avec n'importe laquelle de ces valeurs.
 */
export const SOWING_STAGES = [
  { value: 'semis', label: 'Semis' },
  { value: 'levee', label: 'Levée' },
  { value: 'eclaircissage', label: 'Éclaircissage' },
  { value: 'repiquage', label: 'Repiquage' },
  { value: 'endurcissement', label: 'Endurcissement' },
  { value: 'mise-en-terre', label: 'Mise en terre' },
  { value: 'tuteurage', label: 'Tuteurage' },
  { value: 'floraison', label: 'Floraison' },
  { value: 'recolte', label: 'Récolte' },
] as const

export type SowingStage = (typeof SOWING_STAGES)[number]['value']

export const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
] as const
