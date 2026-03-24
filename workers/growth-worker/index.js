/**
 * HackProduct Growth Worker
 *
 * Standalone script (no HTTP server) that runs every Sunday night.
 * Fetches engagement metrics from Substack + Buffer,
 * writes a weekly snapshot row to the Notion Growth Tracker,
 * and flags the top performing post for CEO Agent context.
 *
 * Run: node workers/growth-worker/index.js
 * Scheduled via Paperclip Growth Agent heartbeat (cron: 0 22 * * 0)
 */

import { Client } from '@notionhq/client';
import fetch from 'node-fetch';

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_TOKEN });
const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;
const SUBSTACK_API_KEY = process.env.SUBSTACK_API_KEY;
const SUBSTACK_PUBLICATION_URL = process.env.SUBSTACK_PUBLICATION_URL;

const GROWTH_TRACKER_PAGE_ID = '32c00bae-8699-8121-a270-eeca967e4d7b';
const CONTENT_CALENDAR_DB_ID = '3ea490b1-74de-483d-b79b-54c49700276b';

async function run() {
  console.log('[growth-worker] Starting weekly metrics collection...');

  try {
    const [substackStats, bufferStats] = await Promise.all([
      fetchSubstackStats(),
      fetchBufferStats(),
    ]);

    console.log('[growth-worker] Substack:', substackStats);
    console.log('[growth-worker] Buffer top post:', bufferStats.topPost?.text?.substring(0, 60));

    await writeToGrowthTracker(substackStats, bufferStats);
    await flagTopPerformer(bufferStats.topPost);

    console.log('[growth-worker] Done.');
  } catch (err) {
    console.error('[growth-worker] Error:', err);
    process.exit(1);
  }
}

async function fetchSubstackStats() {
  if (!SUBSTACK_API_KEY || !SUBSTACK_PUBLICATION_URL) {
    console.warn('[growth-worker] Substack credentials not set — using placeholder data');
    return { subscribers: '—', openRate: '—', newThisWeek: '—' };
  }

  try {
    const response = await fetch(
      `https://substack.com/api/v1/publication/stats`,
      {
        headers: { 'Authorization': `Bearer ${SUBSTACK_API_KEY}` },
      }
    );

    if (!response.ok) throw new Error(`Substack stats API ${response.status}`);
    const data = await response.json();

    return {
      subscribers: data.total_subscribers ?? '—',
      openRate: data.average_open_rate ? `${(data.average_open_rate * 100).toFixed(1)}%` : '—',
      newThisWeek: data.new_subscribers_last_7_days ?? '—',
    };
  } catch (err) {
    console.warn('[growth-worker] Substack stats error:', err.message);
    return { subscribers: '—', openRate: '—', newThisWeek: '—' };
  }
}

async function fetchBufferStats() {
  if (!BUFFER_ACCESS_TOKEN) {
    console.warn('[growth-worker] Buffer token not set — using placeholder data');
    return { topPost: null, totalEngagement: '—' };
  }

  try {
    // Get sent posts from the last 7 days
    const response = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${BUFFER_ACCESS_TOKEN}`
    );

    if (!response.ok) throw new Error(`Buffer profiles API ${response.status}`);
    const profiles = await response.json();

    let topPost = null;
    let maxEngagement = 0;

    for (const profile of profiles) {
      const sentResponse = await fetch(
        `https://api.bufferapp.com/1/profiles/${profile.id}/updates/sent.json?access_token=${BUFFER_ACCESS_TOKEN}&count=20`
      );

      if (!sentResponse.ok) continue;
      const { updates } = await sentResponse.json();

      for (const update of (updates || [])) {
        const engagement =
          (update.statistics?.clicks || 0) +
          (update.statistics?.likes || 0) +
          (update.statistics?.shares || 0);

        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          topPost = { text: update.text, engagement, channel: profile.service };
        }
      }
    }

    return { topPost, totalEngagement: maxEngagement };
  } catch (err) {
    console.warn('[growth-worker] Buffer stats error:', err.message);
    return { topPost: null, totalEngagement: '—' };
  }
}

async function writeToGrowthTracker(substackStats, bufferStats) {
  const weekStr = getWeekString();
  const topPostLabel = bufferStats.topPost
    ? `${bufferStats.topPost.text.substring(0, 60)}... (${bufferStats.topPost.engagement} engagements)`
    : '—';

  // Append a new row to the Weekly Snapshot table in the Growth Tracker page
  await notion.blocks.children.append({
    block_id: GROWTH_TRACKER_PAGE_ID,
    children: [
      {
        type: 'table_row',
        table_row: {
          cells: [
            [{ type: 'text', text: { content: weekStr } }],
            [{ type: 'text', text: { content: String(substackStats.subscribers) } }],
            [{ type: 'text', text: { content: String(substackStats.newThisWeek) } }],
            [{ type: 'text', text: { content: String(substackStats.openRate) } }],
            [{ type: 'text', text: { content: String(bufferStats.totalEngagement) } }],
            [{ type: 'text', text: { content: topPostLabel } }],
          ],
        },
      },
    ],
  });

  console.log(`[growth-worker] Wrote weekly snapshot for ${weekStr}`);
}

async function flagTopPerformer(topPost) {
  if (!topPost) return;

  // Find the matching Content Calendar entry and add a note
  const response = await notion.databases.query({
    database_id: CONTENT_CALENDAR_DB_ID,
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Publish Date', direction: 'descending' }],
    page_size: 10,
  });

  // Find the post whose title appears in the top post text
  for (const page of response.results) {
    const title = page.properties['Post Title']?.title?.[0]?.plain_text || '';
    if (topPost.text.toLowerCase().includes(title.toLowerCase().substring(0, 20))) {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Notes: {
            rich_text: [{
              type: 'text',
              text: { content: `⭐ Top performer this week — ${topPost.engagement} engagements on ${topPost.channel}` },
            }],
          },
        },
      });
      console.log(`[growth-worker] Flagged top performer: "${title}"`);
      break;
    }
  }
}

function getWeekString() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `Week ${weekNum} (${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
}

run();
