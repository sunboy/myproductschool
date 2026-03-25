import { Topic, TopicWithProgress } from '@/lib/types'
import { MOCK_TOPICS, MOCK_CHALLENGE_TOPICS, MOCK_CONCEPT_TOPICS, MOCK_DOMAINS } from '@/lib/mock-data'

export async function getTopics(domainId?: string): Promise<TopicWithProgress[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    let topics = MOCK_TOPICS
    if (domainId) topics = topics.filter(t => t.domain_id === domainId)

    return topics.map(topic => {
      const domain = MOCK_DOMAINS.find(d => d.id === topic.domain_id)
      const concept_count = MOCK_CONCEPT_TOPICS.filter(ct => ct.topic_id === topic.id).length
      const challenge_count = MOCK_CHALLENGE_TOPICS.filter(ct => ct.topic_id === topic.id).length
      return {
        ...topic,
        domain: { slug: domain?.slug ?? '', title: domain?.title ?? '' },
        concept_count,
        challenge_count,
        completed_challenges: 0,
        progress_percentage: 0,
      }
    })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  let query = supabase
    .from('topics')
    .select('*, domains(slug, title)')
    .eq('is_published', true)
    .order('order_index')

  if (domainId) query = query.eq('domain_id', domainId)

  const { data } = await query

  return (data ?? []).map(topic => ({
    ...topic,
    domain: topic.domains ?? { slug: '', title: '' },
    concept_count: 0,
    challenge_count: 0,
    completed_challenges: 0,
    progress_percentage: 0,
  }))
}

export async function getTopicBySlug(slug: string): Promise<TopicWithProgress | null> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const topic = MOCK_TOPICS.find(t => t.slug === slug) ?? null
    if (!topic) return null

    const domain = MOCK_DOMAINS.find(d => d.id === topic.domain_id)
    const concept_count = MOCK_CONCEPT_TOPICS.filter(ct => ct.topic_id === topic.id).length
    const challenge_count = MOCK_CHALLENGE_TOPICS.filter(ct => ct.topic_id === topic.id).length

    return {
      ...topic,
      domain: { slug: domain?.slug ?? '', title: domain?.title ?? '' },
      concept_count,
      challenge_count,
      completed_challenges: 0,
      progress_percentage: 0,
    }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('topics')
    .select('*, domains(slug, title)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!data) return null

  return {
    ...data,
    domain: data.domains ?? { slug: '', title: '' },
    concept_count: 0,
    challenge_count: 0,
    completed_challenges: 0,
    progress_percentage: 0,
  }
}

export async function getTopicsByChallenge(challengeId: string): Promise<Pick<Topic, 'slug' | 'title'>[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const topicIds = MOCK_CHALLENGE_TOPICS
      .filter(ct => ct.challenge_id === challengeId)
      .map(ct => ct.topic_id)
    return MOCK_TOPICS
      .filter(t => topicIds.includes(t.id))
      .map(t => ({ slug: t.slug, title: t.title }))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('challenge_topics')
    .select('topics(slug, title)')
    .eq('challenge_id', challengeId)

  return (data ?? []).flatMap(row => (Array.isArray(row.topics) ? row.topics : row.topics ? [row.topics] : [])) as Pick<Topic, 'slug' | 'title'>[]
}

export async function getTopicsByConcept(conceptId: string): Promise<Pick<Topic, 'slug' | 'title'>[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    const topicIds = MOCK_CONCEPT_TOPICS
      .filter(ct => ct.concept_id === conceptId)
      .map(ct => ct.topic_id)
    return MOCK_TOPICS
      .filter(t => topicIds.includes(t.id))
      .map(t => ({ slug: t.slug, title: t.title }))
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data } = await supabase
    .from('concept_topics')
    .select('topics(slug, title)')
    .eq('concept_id', conceptId)

  return (data ?? []).flatMap(row => (Array.isArray(row.topics) ? row.topics : row.topics ? [row.topics] : [])) as Pick<Topic, 'slug' | 'title'>[]
}
