export type DisciplineId = 'sql' | 'coding' | 'sysdes' | 'datamod' | 'product' | 'ml'

export type Discipline = {
  id: DisciplineId
  label: string
  swatch: string
  url: string
}

export const DISCIPLINES: Discipline[] = [
  { id: 'sql',     label: 'SQL',            swatch: 'var(--d-sql)',     url: 'hackproduct.com/sql' },
  { id: 'coding',  label: 'Coding',         swatch: 'var(--d-coding)',  url: 'hackproduct.com/coding' },
  { id: 'sysdes',  label: 'System Design',  swatch: 'var(--d-sysdes)',  url: 'hackproduct.com/system-design' },
  { id: 'datamod', label: 'Data Modeling',  swatch: 'var(--d-datamod)', url: 'hackproduct.com/data-modeling' },
  { id: 'product', label: 'Product Sense',  swatch: 'var(--d-product)', url: 'hackproduct.com/product-sense' },
  { id: 'ml',      label: 'ML / AI',        swatch: 'var(--d-ml)',      url: 'hackproduct.com/ml-ai' },
]
