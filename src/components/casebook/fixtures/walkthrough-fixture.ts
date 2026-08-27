import type { WalkthroughPayload } from '../types'

/**
 * Small hand-written fixture matching the server-projected payload shape for
 * the Walkthrough player. Mirrors the real "Tuesday dip" module content
 * (content/casebook/tuesday-dip/expert-session.json) at a fraction of the
 * size, so the player can be built and eyeballed without the API.
 *
 * The API owner (another dev) is responsible for producing the real payload
 * from cc_cases / cc_case_attempts. This file is for local dev/testing only.
 */
export const walkthroughFixture: WalkthroughPayload = {
  module: {
    id: 'tuesday-dip',
    title: 'The Tuesday dip',
    hook: 'Signup volume drops about 25 percent every single Tuesday and the obvious suspect turns out to be a coincidence.',
  },
  duration_s: 569,
  transcript: [
    {
      t: 0,
      role: 'user',
      text: 'List the tables and views in the hackproduct.module_tuesday_dip dataset, then show me the schema of the events table.',
    },
    {
      t: 5,
      role: 'assistant',
      text: 'Listing tables and fetching the events schema in parallel.',
    },
    {
      t: 5,
      role: 'tool',
      text: '[tool_use] mcp__bigquery__bq_list_tables',
    },
    {
      t: 16,
      role: 'tool',
      text: 'daily_signups (VIEW)\ndaily_signups_by_channel (VIEW)\ndeploys (TABLE)\nevents (TABLE)\npayment_attempts (TABLE)\nsignup_payment_outcomes (VIEW)\ntuesday_dip_vs_deploys (VIEW)\nusers (TABLE)',
    },
    {
      t: 27,
      role: 'tool',
      text:
        "SELECT\n  DATE(ts) AS date,\n  COUNT(*) AS signups\nFROM `hackproduct.module_tuesday_dip.events`\nWHERE event_name = 'signup_completed'\n  AND ts >= '2026-06-29'\n  AND ts < '2026-07-27'\nGROUP BY 1\nORDER BY 1",
    },
    {
      t: 74,
      role: 'assistant',
      text:
        'The dip is real and consistent. All four Tuesdays in the window are low, and Monday through Friday excluding Tuesday run about 33 to 36 percent higher than Tuesday.',
    },
    {
      t: 160,
      role: 'user',
      text: 'The checkout deploy on 2026-07-14 lines up with one of the dips. Is that the cause?',
    },
    {
      t: 170,
      role: 'tool',
      text:
        "SELECT\n  t.date,\n  t.signups,\n  d.deploy_type\nFROM `hackproduct.module_tuesday_dip.tuesday_dip_vs_deploys` t\nLEFT JOIN `hackproduct.module_tuesday_dip.deploys` d\n  ON d.deploy_date = t.date\nORDER BY t.date",
    },
    {
      t: 210,
      role: 'assistant',
      text:
        'Three of the four dipped Tuesdays have no code_deploy row at all, only a recurring maintenance_window row. The deploy explanation cannot account for those three, so it is ruled out.',
    },
    {
      t: 340,
      role: 'user',
      text: 'What actually explains the suppressed volume on maintenance-window Tuesdays?',
    },
    {
      t: 420,
      role: 'assistant',
      text:
        'Push and email together drive about 35 percent of signups on every non-Tuesday day, but only 14.8 percent on Tuesday. The maintenance window pauses the push and email re-engagement sender from 02:00 to 06:00 UTC, which is where most of that volume would otherwise come from.',
    },
    {
      t: 540,
      role: 'assistant',
      text:
        'Final read: the recurring maintenance window suppresses the push and email channel every Tuesday. The code deploy is a coincidence, not a cause.',
    },
  ],
  checkpoints: [
    {
      id: 'tuesday-dip-cp-1',
      t: 74,
      question: 'The dip shows up on every Tuesday in the window. What would you check next?',
      options: [
        { id: 'a', text: 'Jump straight to the 2026-07-14 code deploy since it lines up with a dip' },
        { id: 'b', text: 'Cross-reference every dipped Tuesday against deploy history before naming a cause' },
        { id: 'c', text: 'Assume seasonality and move on to another table' },
        { id: 'd', text: 'Re-run the same query with a longer date range and stop there' },
      ],
    },
    {
      id: 'tuesday-dip-cp-2',
      t: 210,
      question: 'Three of the four dipped Tuesdays have no code deploy at all. What does that rule out, and what should you check next?',
      options: [
        { id: 'a', text: 'It rules out nothing. Keep the deploy as the leading explanation' },
        { id: 'b', text: 'It rules out the deploy as a universal cause. Check what else recurs every Tuesday' },
        { id: 'c', text: 'It means the fourth Tuesday is an outlier and can be dropped from the analysis' },
        { id: 'd', text: 'It means the events table has a data quality problem on non-deploy Tuesdays' },
      ],
    },
    {
      id: 'tuesday-dip-cp-3',
      t: 420,
      question: 'Push and email drive 35 percent of signups on non-Tuesdays but 14.8 percent on Tuesday. What is the falsifiable check for this explanation?',
      options: [
        { id: 'a', text: 'There is no way to falsify a channel mix difference like this' },
        { id: 'b', text: 'If a future maintenance-window Tuesday showed push and email back near 35 percent, the explanation would be disproven' },
        { id: 'c', text: 'Compare Tuesday to Wednesday only, since they are adjacent days' },
        { id: 'd', text: 'Rerun the query with a shorter time window to confirm the percentage' },
      ],
    },
  ],
}
