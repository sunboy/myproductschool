/**
 * Shared input payloads for the API test harness.
 */

export const CALIBRATION_RESPONSES = {
  frame: 'Q1: A | Q2: B',
  list: 'Q1: C | Q2: A',
  optimize: 'Q1: B | Q2: C',
  win: 'Q1: A | Q2: A',
}

export const LUMA_FEEDBACK_PAYLOAD = {
  challengeTitle: 'Test Challenge',
  challengePrompt: 'How would you improve Spotify podcast discovery?',
  response: 'I would focus on personalization by analyzing listening history and using collaborative filtering. The key metric would be podcast starts per session.',
  userId: 'mock-user-00000000-0000-0000-0000-000000000000',
}

export const LUMA_CHAT_PAYLOAD = {
  challengePrompt: 'How would you improve Spotify podcast discovery?',
  message: 'Can you explain what framing means in product thinking?',
  history: [] as unknown[],
}

export const LUMA_NUDGE_PAYLOAD = {
  challengePrompt: 'How would you improve Spotify podcast discovery?',
  draft: 'I would add better search filters and personalized recommendations based on listening history.',
}

export const SIMULATION_TURN_CONTENT =
  'I would approach this by first understanding the user problem through research, then defining success metrics before proposing any solutions.'
