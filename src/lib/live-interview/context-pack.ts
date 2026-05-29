import { buildCoverageNote } from '@/lib/live-interview/system-prompt'
import {
  buildLiveWorkspaceSignal,
  buildWorkspacePromptNote,
  type LiveWorkspaceSignal,
} from '@/lib/live-interview/workspace-adapters'
import type { LiveInterviewArtifactSnapshot } from '@/lib/live-interview/snapshot-schema'
import type { LiveInterviewDiscipline } from '@/lib/live-interview/disciplines'

export type LiveInterviewRetrievalTrigger =
  | 'normal_turn'
  | 'session_start'
  | 'session_resume'
  | 'debrief'
  | 'explicit_recommendation'
  | 'material_workspace_change'

export function shouldRunLiveInterviewRetrieval(input: {
  trigger: LiveInterviewRetrievalTrigger
  message?: string
  previousDigest?: string | null
  workspaceSignal?: Pick<LiveWorkspaceSignal, 'digest' | 'state'> | null
}) {
  if (input.trigger === 'session_start' || input.trigger === 'session_resume' || input.trigger === 'debrief') return true
  if (input.trigger === 'explicit_recommendation') return true
  if (/\b(study|practice|recommend|next|learn|read|module|weak|improve|work on)\b/i.test(input.message ?? '')) return true
  if (
    input.trigger === 'material_workspace_change' &&
    input.workspaceSignal &&
    input.workspaceSignal.digest !== input.previousDigest &&
    ['started', 'substantive', 'failed_tests', 'passing_signal'].includes(input.workspaceSignal.state)
  ) {
    return true
  }
  return false
}

export function buildLiveInterviewContextPack(input: {
  flowCoverage?: Record<string, number> | null
  memory?: string[] | null
  artifactSnapshot?: LiveInterviewArtifactSnapshot | null
  discipline?: LiveInterviewDiscipline | string | null
}) {
  const sections: string[] = []
  const workspaceSignal = buildLiveWorkspaceSignal(input.artifactSnapshot, input.discipline)
  const workspaceNote = buildWorkspacePromptNote(workspaceSignal)

  sections.push(buildCoverageNote(input.flowCoverage ?? { frame: 0, list: 0, optimize: 0, win: 0 }))

  const memory = input.memory ?? []
  if (memory.length > 0) {
    sections.push(
      `[THINGS THE CANDIDATE HAS SAID]\n${memory.map((item) => `- ${item}`).join('\n')}\nReference these when relevant, especially contradictions.`
    )
  }

  if (workspaceNote) sections.push(workspaceNote)

  return {
    dynamicContext: sections,
    workspaceSignal,
    workspaceNote,
  }
}
