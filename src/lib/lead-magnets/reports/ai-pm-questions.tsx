// Report content for /go/ai-pm-questions.
import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'
import { AI_PM_QUESTIONS, FULL_SET, ANSWER_SKELETONS } from '@/lib/lead-magnets/quizzes/ai-pm-questions'

const MOVE_LABEL: Record<string, string> = {
  frame: 'Frame',
  list: 'List',
  optimize: 'Optimize',
  win: 'Win',
}

const ALL_QUESTIONS = [...AI_PM_QUESTIONS, ...FULL_SET].sort((a, b) => a.rank - b.rank)

const HIGH_RISK_IDS = ['q01', 'q02', 'q03', 'q05', 'q06', 'q08']

export function buildAiPmQuestionsReport(
  result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  void result
  const greeting = name ? `${name}, here` : 'Here'

  return {
    title: 'The AI-PM question set: all 24, ranked by rejection risk',
    intro: `${greeting} is the full set. Each question is tagged by the reasoning move it exercises, followed by the answer skeletons for the six questions that trip up candidates most often.`,
    sections: [
      {
        id: 'how-to-use',
        title: 'How to use this set',
        body: (
          <div>
            <p style={{ lineHeight: 1.65, marginBottom: '0.9rem' }}>
              These questions are ordered by the speed at which they separate candidates who
              understand AI products from those who have learned AI vocabulary. The top three
              are diagnostic tools. Within the first two minutes of an answer, an interviewer
              knows whether you are reasoning about the product layer or just about the model.
            </p>
            <p style={{ lineHeight: 1.65, marginBottom: '0.9rem' }}>
              Each question maps to one of four reasoning moves: Frame (define the problem before
              proposing the fix), List (generate structurally different options), Optimize (name
              the criterion and the sacrifice), and Win (close with a falsifiable outcome). Strong
              answers run the relevant moves before reaching a conclusion. Thin answers reach the
              conclusion first and fill in the reasoning after.
            </p>
            <p style={{ lineHeight: 1.65, margin: 0 }}>
              The answer skeletons at the end of this report are not scripts. They are the moves
              of a strong answer, in the order that interviewers expect to hear them.
            </p>
          </div>
        ),
      },
      {
        id: 'all-24',
        title: 'All 24 questions, ranked',
        body: (
          <div>
            {ALL_QUESTIONS.map((q) => (
              <div
                key={q.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0 16px',
                  padding: '18px 0',
                  borderBottom: '1px solid var(--line-1)',
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: 'var(--forest)',
                    minWidth: 28,
                    paddingTop: 2,
                  }}
                >
                  {q.rank}
                </span>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--ink-1)', margin: '0 0 6px', lineHeight: 1.45 }}>
                    {q.question}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--forest)',
                        background: 'var(--forest-soft)',
                        padding: '2px 8px',
                        borderRadius: 'var(--r-xs)',
                      }}
                    >
                      {MOVE_LABEL[q.move] ?? q.move}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--ink-2)' }}>Tests:</strong> {q.signal}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: 'skeletons',
        title: 'Answer skeletons for the six highest-risk questions',
        body: (
          <div>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '1.4rem' }}>
              These are the reasoning moves of a strong answer, not a model answer. Say them
              in your own words. The goal is to hit the moves in order, not to recite a script.
            </p>
            {HIGH_RISK_IDS.map((id) => {
              const q = ALL_QUESTIONS.find((item) => item.id === id)
              const beats = ANSWER_SKELETONS[id]
              if (!q || !beats) return null
              return (
                <div
                  key={id}
                  style={{
                    marginBottom: '1.8rem',
                    padding: '20px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                    borderLeft: '3px solid var(--forest)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-3)',
                      margin: '0 0 6px',
                    }}
                  >
                    Rank {q.rank} / {MOVE_LABEL[q.move]}
                  </p>
                  <p style={{ fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 14px', lineHeight: 1.4 }}>
                    {q.question}
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-1)' }}>
                    {beats.map((beat, i) => (
                      <li key={i} style={{ lineHeight: 1.6, marginBottom: 10 }}>
                        {beat}
                      </li>
                    ))}
                  </ol>
                </div>
              )
            })}
          </div>
        ),
      },
      {
        id: 'rubric',
        title: 'The rubric behind the scoring',
        body: (
          <div>
            <p style={{ color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: '1.2rem' }}>
              Interviewers do not score AI-PM candidates on AI knowledge alone. They map your
              answer onto four reasoning moves and check whether you run them in the right order.
              A technically accurate answer that skips the Frame move still reads as thin.
            </p>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                {
                  move: 'Frame',
                  description:
                    'Name the problem, the person blocked by it, and the downstream cost before proposing any solution. The Frame move tells interviewers you understand why the company cares, not just what the feature does.',
                },
                {
                  move: 'List',
                  description:
                    'Surface the full space: every stakeholder affected, every option with a structurally different shape, and the second-order effects of each. Thin lists have three variations of the same idea. Strong lists have options that trade off against each other.',
                },
                {
                  move: 'Optimize',
                  description:
                    'Name the criterion you are optimizing for, then name what you are giving up and why that sacrifice is acceptable. A preference says one option feels better. A tradeoff names the cost and defends the decision.',
                },
                {
                  move: 'Win',
                  description:
                    'Close with a falsifiable outcome: a specific metric, a threshold, a timeline, and a counter-signal that tells you the approach failed. Answers that end with "it should improve retention" without a number do not pass the Win move.',
                },
              ].map((item) => (
                <div
                  key={item.move}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr',
                    gap: 16,
                    alignItems: 'start',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--line-1)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 14,
                      color: 'var(--forest)',
                    }}
                  >
                    {item.move}
                  </span>
                  <p style={{ margin: 0, color: 'var(--ink-1)', lineHeight: 1.6 }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  }
}
