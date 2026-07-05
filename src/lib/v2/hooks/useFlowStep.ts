'use client'

import { useState, useCallback } from 'react'
import type { FlowStep, ResponseType } from '@/lib/types'

interface StepOption {
  id: string
  option_label: string
  option_text: string
}

interface StepQuestionData {
  id: string
  question_text: string
  question_nudge: string | null
  sequence: number
  grading_weight_within_step: number
  response_type: ResponseType
  allow_multiple: boolean
  options: StepOption[]
}

interface StepData {
  step: FlowStep
  nudge: string | null
  questions: StepQuestionData[]
  /** Adaptation contract: coaching register for this learner (SUN-251). */
  guidance?: 'scaffolded' | 'guided' | 'open'
}

interface RevealedOption {
  id: string
  option_label?: string
  option_text?: string
  quality?: string
  points: number
  explanation: string
  framework_hint?: string
}

interface SubmitResult {
  score: number
  grade_label: string
  step_complete: boolean
  step_score?: number
  revealed_options: RevealedOption[]
  role_context?: string
  career_signal?: string
  competency_signal?: { primary: string; signal: string; framework_hint: string } | null
}

export interface StepAnswerDraft {
  question_id: string
  response_type: ResponseType
  selected_option_id?: string | null
  selected_option_ids?: string[]
  user_text?: string | null
  time_spent_seconds?: number
  confidence?: number | null
}

export interface BatchQuestionResult {
  question_id: string
  sequence: number
  score: number
  grade_label: string
  competency_signal: { competency: string; signal: string; framework_hint?: string } | null
  revealed_options: RevealedOption[]
}

export interface StepBatchResult {
  step_complete: boolean
  step_score: number
  competency_signal: { competency: string; signal: string; framework_hint?: string } | null
  questions: BatchQuestionResult[]
}

interface UseFlowStepReturn {
  stepData: StepData | null
  loading: boolean
  submitting: boolean
  error: string | null
  submitResult: SubmitResult | null
  clearStepData: () => void
  loadStep: (attemptId: string) => Promise<void>
  submitAnswer: (params: {
    attemptId: string
    questionId: string
    selectedOptionId: string | null
    selectedOptionIds?: string[]
    userText: string | null
    responseType: ResponseType
    timespentSeconds: number
  }) => Promise<SubmitResult | null>
  submitStep: (params: {
    attemptId: string
    answers: StepAnswerDraft[]
  }) => Promise<StepBatchResult | null>
  fetchCoaching: (params: {
    attemptId: string
    questionId: string
    optionId: string | null
    roleId: string
    userText?: string | null
  }) => Promise<{ role_context: string; career_signal: string } | null>
}

export function useFlowStep(challengeId: string, step: FlowStep): UseFlowStepReturn {
  const [stepData, setStepData] = useState<StepData | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)

  const loadStep = useCallback(async (attemptId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/step/${step}?attempt_id=${attemptId}`)
      if (!res.ok) throw new Error(`Failed to load step: ${res.status}`)
      const data = await res.json()
      setStepData(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [challengeId, step])

  const submitAnswer = useCallback(async (params: {
    attemptId: string
    questionId: string
    selectedOptionId: string | null
    selectedOptionIds?: string[]
    userText: string | null
    responseType: ResponseType
    timespentSeconds: number
  }): Promise<SubmitResult | null> => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/step/${step}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: params.attemptId,
          question_id: params.questionId,
          selected_option_id: params.selectedOptionId,
          selected_option_ids: params.selectedOptionIds,
          user_text: params.userText,
          response_type: params.responseType,
          time_spent_seconds: params.timespentSeconds,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const nextAction = Array.isArray(body.next_actions) ? body.next_actions[0] : undefined
        throw new Error(body.status === 'not_ready'
          ? [body.summary, nextAction].filter(Boolean).join(' ')
          : body.error ?? `Submit failed: ${res.status}`)
      }
      const result: SubmitResult = await res.json()
      setSubmitResult(result)
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [challengeId, step])

  const submitStep = useCallback(async (params: {
    attemptId: string
    answers: StepAnswerDraft[]
  }): Promise<StepBatchResult | null> => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/step/${step}/submit-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: params.attemptId,
          answers: params.answers,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const nextAction = Array.isArray(body.next_actions) ? body.next_actions[0] : undefined
        throw new Error(body.status === 'not_ready'
          ? [body.summary, nextAction].filter(Boolean).join(' ')
          : body.error ?? `Step submit failed: ${res.status}`)
      }
      const result: StepBatchResult = await res.json()
      return result
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [challengeId, step])

  const fetchCoaching = useCallback(async (params: {
    attemptId: string
    questionId: string
    optionId: string | null
    roleId: string
    userText?: string | null
  }): Promise<{ role_context: string; career_signal: string } | null> => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/coaching`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: params.attemptId,
          question_id: params.questionId,
          option_id: params.optionId,
          role_id: params.roleId,
          user_text: params.userText ?? null,
          step,
        }),
      })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  }, [challengeId, step])

  const clearStepData = useCallback(() => {
    setStepData(null)
    setError(null)
  }, [])

  return { stepData, loading, submitting, error, submitResult, clearStepData, loadStep, submitAnswer, submitStep, fetchCoaching }
}
