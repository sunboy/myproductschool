import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CalibrationSubmitSchema,
  buildCalibrationPersistencePayload,
} from '@/lib/onboarding/calibration-submit'

describe('calibration submit persistence payload', () => {
  it('writes role, archetype, weakness move, scores, and completion timestamp', () => {
    const parsed = CalibrationSubmitSchema.parse({
      role: 'swe',
      answers: {
        frame: 'A',
        list: 'B',
        optimize: 'C',
        win: 'D',
      },
    })

    const payload = buildCalibrationPersistencePayload({
      userId: 'user-1',
      role: parsed.role,
      answers: parsed.answers,
      archetype: 'The Strategist',
      archetypeDescription: 'Frames clearly and lands recommendations.',
      weaknessMove: 'optimize',
      scores: {
        frame: 100,
        list: 92,
        optimize: 58,
        win: 17,
      },
      now: '2026-05-05T23:00:00.000Z',
    })

    assert.deepEqual(payload.profileUpdate, {
      preferred_role: 'swe',
      archetype: 'The Strategist',
      archetype_description: 'Frames clearly and lands recommendations.',
      weakness_move: 'optimize',
      calibration_scores: {
        frame: 100,
        list: 92,
        optimize: 58,
        win: 17,
      },
      onboarding_completed_at: '2026-05-05T23:00:00.000Z',
      updated_at: '2026-05-05T23:00:00.000Z',
    })

    assert.deepEqual(payload.onboardingResponseUpsert, {
      user_id: 'user-1',
      preferred_role: 'swe',
      calibration_scores: {
        frame: 100,
        list: 92,
        optimize: 58,
        win: 17,
      },
      archetype: 'The Strategist',
      calibration_answers: [parsed.answers],
    })
  })
})
