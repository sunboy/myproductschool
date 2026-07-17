import { getStudyPlans, getEnrolledPlans } from '@/lib/data/study-plans'
import { createClient } from '@/lib/supabase/server'
import { StudyPlansClient } from './StudyPlansClient'

export default async function StudyPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [studyPlans, enrolledPlans] = await Promise.all([
    getStudyPlans(user?.id),
    user?.id ? getEnrolledPlans(user.id) : Promise.resolve([]),
  ])

  return <StudyPlansClient studyPlans={studyPlans} enrolledPlans={enrolledPlans} />
}
