import type { AutopsyStory, StorySection } from '@/lib/types'
import type { CompanyHub, FeatureAutopsy, AutopsyImageRole } from './types'

function formatConfidence(value: string) {
  return value.replaceAll('_', ' ')
}

const QUICK_READ_LABELS: Record<string, string> = {
  setup: 'The setup',
  decision: 'The user moment',
  'wrong-obvious-answer': 'The trap',
  mechanism: 'The mechanism',
  evidence: 'The proof',
  lesson: 'The takeaway',
}

function getImage(story: FeatureAutopsy, role: AutopsyImageRole) {
  const image = story.images.find(item => item.role === role)
  if (!image) {
    return null
  }

  return {
    src: image.src,
    alt: image.alt,
    caption: image.caption,
    width: image.width,
    height: image.height,
  }
}

function formatStoryType(story: FeatureAutopsy) {
  return story.storyType === 'company_teardown' ? 'company teardown' : 'feature autopsy'
}

export function featureAutopsyToStory(story: FeatureAutopsy, company: CompanyHub): AutopsyStory {
  const hero = getImage(story, 'hero')
  const hatchNarrator = getImage(story, 'hatch-narrator')
  const mechanism = getImage(story, 'failure-mechanism')
  const evidence = getImage(story, 'evidence-card')
  const fallbackImage = hero ?? hatchNarrator ?? {
    src: '/images/hacky_reading.png',
    alt: 'Hatch reading a product autopsy brief',
    width: 420,
    height: 420,
  }

  const sections: StorySection[] = [
    {
      id: 'cover',
      layout: 'fullbleed_cover',
      content: {
        label: `${company.name} ${formatStoryType(story)}`,
        headline: story.title,
        subline: story.dek,
        meta: `${story.estimatedReadTime} | ${story.sources.length} public sources`,
        backdropWord: story.backdropWord ?? company.name.toUpperCase(),
        ...(hero ? { image: hero } : {}),
      },
    },
    {
      id: 'quick-read',
      layout: 'quick_read',
      content: {
        label: 'Quick read',
        title: 'The Short Version',
        cards: story.quickRead.map(card => ({
          eyebrow: QUICK_READ_LABELS[card.id] ?? card.id.replaceAll('-', ' '),
          title: card.title,
          body: card.body,
          confidence: formatConfidence(card.confidence),
          sourceIds: card.sourceIds,
        })),
      },
    },
    {
      id: 'frame',
      layout: 'image_panel',
      content: {
        label: 'Setup',
        title: story.flow[0]?.title ?? 'The setup',
        paragraphs: story.flow[0]?.body ?? [],
        textSide: 'left',
        image: hatchNarrator ?? fallbackImage,
      },
    },
  ]

  if (story.comparison) {
    sections.push({
      id: 'choice',
      layout: 'before_after',
      content: story.comparison,
    })
  }

  sections.push({
    id: 'mechanism',
    layout: 'image_panel',
    content: {
      label: 'Mechanism',
      title: story.flow[1]?.title ?? 'The mechanism',
      paragraphs: [
        ...(story.flow[1]?.body ?? []),
        ...(story.flow[2]?.body ?? []),
      ],
      textSide: 'left',
      image: mechanism ?? fallbackImage,
    },
  })

  if (story.flow[3] || evidence) {
    sections.push({
      id: 'evidence',
      layout: 'image_panel',
      content: {
        label: 'Evidence',
        title: story.flow[3]?.title ?? 'What the record supports',
        paragraphs: story.flow[3]?.body ?? [],
        textSide: 'right',
        image: evidence ?? fallbackImage,
      },
    })
  }

  if (story.quote) {
    sections.push({
      id: 'voice',
      layout: 'quote',
      content: {
        quote: story.quote.quote,
        attribution: story.quote.attribution,
        context: story.quote.context,
      },
    })
  }

  if (story.timeline?.length) {
    sections.push({
      id: 'timeline',
      layout: 'timeline',
      content: {
        title: 'Timeline',
        events: story.timeline,
      },
    })
  }

  if (story.principle) {
    sections.push({
      id: 'lesson',
      layout: 'fullbleed_principle',
      content: {
        principle: story.principle.principle,
        attribution: story.principle.attribution,
      },
    })
  }

  sections.push({
    id: 'sources',
    layout: 'source_pack',
    content: {
      label: 'Source pack',
      title: 'Sources, limits, and corrections',
      summary: story.sourcePackSummary ?? story.sourceSummary,
      correctionSubject: `Autopsy correction: ${story.title}`,
      sources: story.sources.map(source => ({
        id: source.id,
        title: source.title,
        publisher: source.publisher,
        tier: source.tier,
        url: source.url,
        supports: source.supports,
      })),
    },
  })

  return {
    id: story.slug,
    product_id: company.slug,
    slug: story.slug,
    title: story.title,
    read_time: story.estimatedReadTime,
    sections,
    related_challenge_ids: [],
    sort_order: story.queueRank,
    created_at: '2026-05-16',
  }
}
