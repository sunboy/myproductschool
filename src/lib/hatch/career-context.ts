// buildCareerContext — summarizes the user's CareerOps state (profile + active
// pipeline + latest fit scores) into a compact block Hatch can reason over, so
// the chat can answer "which saved job fits best / what's my biggest gap" from
// real data instead of asking the user to paste it.

import { createAdminClient } from '@/lib/supabase/admin'

export async function buildCareerContext(userId: string): Promise<string> {
  try {
    const admin = createAdminClient()

    const [{ data: profile }, { data: apps }, { data: evals }] = await Promise.all([
      admin
        .from('career_profiles')
        .select('target_role, seniority, locations, key_skills')
        .eq('user_id', userId)
        .maybeSingle(),
      admin
        .from('job_applications')
        .select('company, role_title, status, fit_score, fit_grade, next_action')
        .eq('user_id', userId)
        .not('status', 'in', '("archived","rejected")')
        .order('fit_score', { ascending: false, nullsFirst: false })
        .limit(12),
      admin
        .from('career_fit_evaluations')
        .select('company, role_title, score, grade, gaps, readiness_map, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const lines: string[] = ['## CareerOps Context', 'This is the learner\'s real job-search state. Use it directly; do not ask them to paste what is already here.']

    if (profile) {
      lines.push(
        `\n### Profile`,
        `Target role: ${profile.target_role ?? 'unspecified'}`,
        `Seniority: ${profile.seniority ?? 'unspecified'}`,
        `Skills: ${(profile.key_skills ?? []).join(', ') || 'unspecified'}`,
        `Locations: ${(profile.locations ?? []).join(', ') || 'unspecified'}`,
      )
    } else {
      lines.push('\nThe learner has not set up a career profile yet.')
    }

    if (apps?.length) {
      lines.push('\n### Active pipeline (best fit first)')
      for (const a of apps) {
        const fit = a.fit_grade ? `${a.fit_grade}${a.fit_score != null ? ` (${a.fit_score})` : ''}` : 'unscored'
        const next = a.next_action ? `, next: ${a.next_action}` : ''
        lines.push(`- ${a.role_title ?? 'role'} at ${a.company ?? 'company'} — ${a.status}, fit ${fit}${next}`)
      }
    } else {
      lines.push('\nNo active applications in the pipeline yet.')
    }

    if (evals?.length) {
      lines.push('\n### Recent fit evaluations')
      for (const e of evals) {
        const gaps = Array.isArray(e.gaps) ? (e.gaps as string[]).slice(0, 3).join('; ') : ''
        const demanded = Array.isArray(e.readiness_map)
          ? (e.readiness_map as Array<{ discipline?: string; demanded?: boolean }>)
              .filter((r) => r.demanded)
              .map((r) => r.discipline)
              .join(', ')
          : ''
        lines.push(
          `- ${e.role_title ?? 'role'} at ${e.company ?? 'company'}: ${e.grade ?? ''} ${e.score ?? ''}` +
          (demanded ? `, demands: ${demanded}` : '') +
          (gaps ? `, gaps: ${gaps}` : ''),
        )
      }
    }

    lines.push(
      '\nWhen the learner asks what to do next, route every gap to a concrete practice rep in one of the five disciplines (product_sense, system_design, data_modeling, coding, sql) and link to /challenges?discipline=… or /live-interviews?discipline=…. Never name frameworks or authors.',
    )

    return lines.join('\n')
  } catch {
    return ''
  }
}
