import { getStudyPlans } from '@/lib/data/study-plans'
import { createClient } from '@/lib/supabase/server'
import { StudyPlansClient } from './StudyPlansClient'

export default async function StudyPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const studyPlans = await getStudyPlans(user?.id)

  return <StudyPlansClient studyPlans={studyPlans} />
}
