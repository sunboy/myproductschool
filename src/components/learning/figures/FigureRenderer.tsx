import type { ChapterFigure } from '@/lib/types'
import { ComparisonTable } from './ComparisonTable'
import { ConnectedBoxes } from './ConnectedBoxes'
import { MappingDiagram } from './MappingDiagram'

export function FigureRenderer({ figure }: { figure: ChapterFigure }) {
  switch (figure.kind) {
    case 'comparison_table':
      return <ComparisonTable figure={figure} />
    case 'connected_boxes':
      return <ConnectedBoxes figure={figure} />
    case 'mapping_diagram':
      return <MappingDiagram figure={figure} />
    default: {
      // Exhaustiveness check
      const _exhaustive: never = figure
      return null
    }
  }
}
