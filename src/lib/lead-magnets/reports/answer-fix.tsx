import type { MagnetResultPayload } from '@/lib/lead-magnets/quiz-types'
import type { ReportContent } from './index'

/**
 * Report builder for the answer-fix magnet.
 *
 * Delivers the printable four-move answer structure plus the three canonical
 * reasoning templates strong candidates run without thinking.
 */
export function buildAnswerFixReport(
  _result: MagnetResultPayload,
  name?: string | null,
): ReportContent {
  const greeting = name ? `${name}, here` : 'Here'

  return {
    title: 'Your interview-answer structure',
    intro: `${greeting} is the reusable version: the four-move structure and the three reasoning templates that separate strong answers from rambling ones.`,
    sections: [
      {
        id: 'four-moves',
        title: 'The four moves',
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              Every strong product answer runs four moves, in order. Skipping one is what makes answers feel thin.
            </p>
            <div className="lm-report-moves">
              {FOUR_MOVES.map((move) => (
                <div key={move.key} className="lm-report-move-card">
                  <div className="lm-report-move-header">
                    <span className="lm-report-move-key">{move.key}</span>
                    <span className="lm-report-move-name">{move.name}</span>
                  </div>
                  <p className="lm-report-move-def">{move.definition}</p>
                  <div className="lm-report-move-template">
                    <span className="lm-report-template-label">Template</span>
                    <span className="lm-report-template-text">{move.template}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'reasoning-templates',
        title: 'Three reasoning templates',
        body: (
          <div>
            <p style={{ marginBottom: '1.1rem', lineHeight: 1.6 }}>
              These are the sentence-level structures interviewers recognise as signals of real product thinking.
              Fill in the brackets. Say them out loud before your next screen.
            </p>
            <div className="lm-report-templates">
              {REASONING_TEMPLATES.map((t) => (
                <div key={t.id} className="lm-report-template-card">
                  <div className="lm-report-template-header">
                    <span className="lm-report-template-tag">{t.move}</span>
                    <span className="lm-report-template-title">{t.title}</span>
                  </div>
                  <blockquote className="lm-report-template-quote">{t.template}</blockquote>
                  <p className="lm-report-template-note">{t.note}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        id: 'how-to-use',
        title: 'How to use this in a live screen',
        body: (
          <div>
            <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
              Before answering any product question, take five seconds to run through
              the four moves mentally. The goal is not to recite them, it is to check
              whether your answer skips one.
            </p>
            <ol className="lm-report-steps">
              <li>Frame the problem before proposing a solution. Name the person, the blocker, and the consequence.</li>
              <li>List the signals, not the features. Stakeholders and second-order effects belong here.</li>
              <li>Optimize with a named criterion. Say what you are trading off, not just what you would pick.</li>
              <li>Win the room with a falsifiable outcome. A metric, a threshold, and a timeline.</li>
            </ol>
          </div>
        ),
      },
    ],
  }
}

const FOUR_MOVES = [
  {
    key: 'F',
    name: 'Frame',
    definition: 'Name the problem before designing the fix. State whose goal is blocked and what the downstream cost is.',
    template: '[Person] is trying to [accomplish X]. [Blocker] is in the way.',
  },
  {
    key: 'L',
    name: 'List',
    definition: 'Surface the signals: every stakeholder affected and the second-order effects of each option.',
    template: 'The people affected are [A], [B], and [C]. The option that helps [A] does [X] to [B].',
  },
  {
    key: 'O',
    name: 'Optimize',
    definition: 'Name the criterion you are optimizing for, then state what you are giving up and why that trade is acceptable.',
    template: 'We get [gain]. We give up [sacrifice]. That trade works because [reason].',
  },
  {
    key: 'W',
    name: 'Win',
    definition: 'Close with a falsifiable outcome. A specific metric, a threshold, and a timeline.',
    template: 'We know this worked if [metric] reaches [threshold] by [timeline].',
  },
]

const REASONING_TEMPLATES = [
  {
    id: 'frame-template',
    move: 'Frame',
    title: 'The problem statement',
    template:
      '[Person] is trying to [accomplish X]. [Blocker] is preventing them. If unresolved, [business consequence].',
    note: 'The third clause is what most candidates drop. It tells the interviewer you understand why the company cares.',
  },
  {
    id: 'optimize-template',
    move: 'Optimize',
    title: 'The tradeoff statement',
    template: 'We get [gain]. We give up [sacrifice]. [Sacrifice] is acceptable because [reason].',
    note: 'Naming the sacrifice is the move. An answer that only names the gain is a preference, not a tradeoff.',
  },
  {
    id: 'win-template',
    move: 'Win',
    title: 'The falsifiable outcome',
    template:
      'We will know this worked if [metric] reaches [threshold] by [timeline]. We will know it failed if [counter-signal].',
    note: 'The counter-signal clause is what separates a confident candidate from a generic one. Say what failure looks like.',
  },
]
