import { FullbleedCoverSection } from './layouts/FullbleedCoverSection'
import { SplitPanelSection } from './layouts/SplitPanelSection'
import { FullbleedStatSection } from './layouts/FullbleedStatSection'
import { BeforeAfterSection } from './layouts/BeforeAfterSection'
import { FullbleedPrincipleSection } from './layouts/FullbleedPrincipleSection'
import { FullbleedCTASection } from './layouts/FullbleedCTASection'
import { QuoteSection } from './layouts/QuoteSection'
import { TimelineSection } from './layouts/TimelineSection'
import { QuickReadSection } from './layouts/QuickReadSection'
import { ImagePanelSection } from './layouts/ImagePanelSection'
import { EvidenceLedgerSection } from './layouts/EvidenceLedgerSection'
import { SourcePackSection } from './layouts/SourcePackSection'
import type { StorySection as StorySectionType } from '@/lib/types'

interface Props {
  section: StorySectionType
  isVisible: boolean
  hasBeenVisible: boolean
}

export function StorySection({ section, isVisible, hasBeenVisible }: Props) {
  switch (section.layout) {
    case 'fullbleed_cover':
      return <FullbleedCoverSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'split_panel':
      return <SplitPanelSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'fullbleed_stat':
      return <FullbleedStatSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'before_after':
      return <BeforeAfterSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'fullbleed_principle':
      return <FullbleedPrincipleSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'fullbleed_cta':
      return <FullbleedCTASection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'quote':
      return <QuoteSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'timeline':
      return <TimelineSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'quick_read':
      return <QuickReadSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'image_panel':
      return <ImagePanelSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'evidence_ledger':
      return <EvidenceLedgerSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    case 'source_pack':
      return <SourcePackSection section={section} isVisible={isVisible} hasBeenVisible={hasBeenVisible} />
    default:
      return null
  }
}
