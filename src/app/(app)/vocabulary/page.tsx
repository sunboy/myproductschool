import { getAllConcepts } from '@/lib/data/concepts'
import { VocabHub } from '@/components/vocabulary/VocabHub'

export default async function VocabularyPage() {
  const concepts = await getAllConcepts()

  return <VocabHub concepts={concepts} />
}
