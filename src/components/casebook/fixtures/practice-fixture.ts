import type { PracticePayload } from '../practice/types'

/**
 * Small hand-written fixture matching the server-projected payload shape for
 * the Practice workspace. Mirrors the real "Tuesday dip" module content
 * (content/casebook/tuesday-dip/scenes.json, scene 1 of 6) without the
 * `rubric` block, which never reaches the client.
 *
 * The API owner (another dev) is responsible for producing the real payload
 * from cc_scenes (stripping rubric server-side). This file is for local
 * dev/testing only.
 */
export const practiceFixture: PracticePayload = {
  module: {
    id: 'tuesday-dip',
    title: 'The Tuesday dip',
  },
  sceneIndex: 1,
  sceneCount: 6,
  scene: {
    id: 'tuesday-dip-s1',
    moduleId: 'tuesday-dip',
    ordinal: 1,
    title: 'Where to start',
    goal_md:
      'The dataset has events, users, payment_attempts, and deploys, plus three prebuilt views, and events alone has 3,477 rows across event_id, user_id, session_id, ts, event_name, and channel. Decide the fastest way to confirm the Tuesday dip is real before chasing a cause.',
    skill_lane: 'driving-the-agent',
    preload: {
      context_md:
        '## What you know so far\n\n- List the tables and views in the hackproduct.module_tuesday_dip dataset, then show me the schema of the events table.\n- Listing tables and fetching the events schema in parallel.',
      visible_tables: ['events', 'daily_signups', 'daily_signups_by_channel'],
      seed_transcript: [
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
          t: 5,
          role: 'tool',
          text: '[tool_use] mcp__bigquery__bq_describe_table\ntable: events',
        },
        {
          t: 16,
          role: 'tool',
          text: 'daily_signups (VIEW)\ndaily_signups_by_channel (VIEW)\ndeploys (TABLE)\nevents (TABLE)\npayment_attempts (TABLE)\nsignup_payment_outcomes (VIEW)\ntuesday_dip_vs_deploys (VIEW)\nusers (TABLE)',
        },
        {
          t: 22,
          role: 'tool',
          text: 'Table: events\nRows: 3477\nColumns:\n  event_id: STRING\n  user_id: STRING\n  session_id: STRING\n  ts: TIMESTAMP\n  event_name: STRING\n  device: STRING\n  channel: STRING',
        },
      ],
    },
    time_budget_s: 300,
  },
}
