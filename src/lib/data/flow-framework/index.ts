import { productSense } from './product-sense'
import { systemDesign } from './system-design'
import { dataModeling } from './data-modeling'
import { coding } from './coding'
import type { Discipline, DisciplineId } from './types'

export { productSense } from './product-sense'
export { systemDesign } from './system-design'
export { dataModeling } from './data-modeling'
export { coding } from './coding'

export const DISCIPLINES: Record<DisciplineId, Discipline> = {
  product_sense: productSense,
  system_design: systemDesign,
  data_modeling: dataModeling,
  coding,
}

export const ALL_DISCIPLINES: Discipline[] = [productSense, systemDesign, dataModeling, coding]

export type {
  Discipline,
  DisciplineId,
  Tradition,
  Competency,
  FlowStep,
  AnimationMode,
  DisciplineEdges,
  FlowStepId,
} from './types'
