/**
 * HackProduct Publisher Worker
 *
 * Reads an approved post draft from Notion, publishes to Substack,
 * and schedules adapted versions (X thread, LinkedIn, Instagram) via Buffer.
 * Updates the Notion Content Calendar entry to Published.
 *
 * POST /publish
 * Body: {
 *   notion_page_id: string,       // the Post Drafts sub-page
 *   calendar_page_id: string,     // the Content Calendar entry
 *   channels: string[],           // ["substack","x","linkedin","instagram"]
 *   publish_date: string          // ISO date
 * }
 */

import express from 'express';
import { Client } from '@notionhq/client';
import Anthropic from '@anthropic-ai/sdk';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PORT = process.env.PORT || 8081;
const WORKER_SECRET = process.env.WORKER_SECRET;
const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;
const SUBSTACK_API_KEY = process.env.SUBSTACK_API_KEY;
const SUBSTACK_PUBLICATION_URL = process.env.SUBSTACK_PUBLICATION_URL; // e.g. hackproduct.substack.com

// Buffer profile IDs for each channel — set after connecting Buffer
const BUFFER_PROFILES = {
  x: process.env.BUFFER_PROFILE_X,
  linkedin: process.env.BUFFER_PROFILE_LINKEDIN,
  instagram: process.env.BUFFER_PROFILE_INSTAGRAM,
};

app.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (WORKER_SECRET && auth !== `Bearer ${WORKER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/publish', async (req, res) => {
  const { notion_page_id, calendar_page_id, channels = ['substack', 'x', 'linkedin', 'instagram'], publish_date } = req.body;

  if (!notion_page_id || !calendar_page_id) {
    return res.status(400).json({ error: 'notion_page_id and calendar_page_id required' });
  }

  console.log(`[publisher] Publishing page ${notion_page_id} to channels: ${channels.join(', ')}`);

  try {
    // 1. Read the draft from Notion
    const { title, content } = await readNotionDraft(notion_page_id);
    console.log(`[publisher] Read draft: "${title}" (${content.length} chars)`);

    const results = {};

    // 2. Publish to Substack
    if (channels.includes('substack')) {
      const substackUrl = await publishToSubstack(title, content);
      results.substack = substackUrl;
      console.log(`[publisher] Substack: ${substackUrl}`);
    }

    // 3. Adapt and schedule social posts via Buffer
    if (channels.includes('x') && BUFFER_PROFILES.x) {
      const thread = await adaptForX(title, content);
      await scheduleBuffer(BUFFER_PROFILES.x, thread, publish_date);
      results.x = 'scheduled';
      console.log(`[publisher] X thread scheduled`);
    }

    if (channels.includes('linkedin') && BUFFER_PROFILES.linkedin) {
      const post = await adaptForLinkedIn(title, content);
      await scheduleBuffer(BUFFER_PROFILES.linkedin, post, publish_date);
      results.linkedin = 'scheduled';
      console.log(`[publisher] LinkedIn post scheduled`);
    }

    if (channels.includes('instagram') && BUFFER_PROFILES.instagram) {
      const caption = await adaptForInstagram(title, content);
      await scheduleBuffer(BUFFER_PROFILES.instagram, caption, publish_date);
      results.instagram = 'scheduled';
      console.log(`[publisher] Instagram caption scheduled`);
    }

    // 4. Update Notion calendar entry
    await updateNotionCalendar(calendar_page_id, results.substack);
    console.log(`[publisher] Notion calendar updated`);

    // 5. Log to Growth Tracker
    await logToGrowthTracker(title, publish_date, channels, results.substack);
    console.log(`[publisher] Growth tracker updated`);

    res.json({ status: 'published', results });
  } catch (err) {
    console.error('[publisher] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function readNotionDraft(pageId) {
  // Get page title
  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = page.properties.title?.title?.[0]?.plain_text || 'Untitled';

  // Get page content blocks
  const { results: blocks } = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });

  // Convert blocks to plain text, skipping metadata header and image placeholders
  const lines = [];
  let skipHeader = true;

  for (const block of blocks) {
    const text = extractBlockText(block);
    if (!text) continue;

    // Skip metadata header (first callout or paragraph containing Status/Publish Date)
    if (skipHeader && (text.includes('**Status:**') || text.includes('Est. read time'))) continue;
    if (text.includes('---') && skipHeader) { skipHeader = false; continue; }

    // Skip image placeholder callouts
    if (text.includes('IMAGE PLACEHOLDER') || text.includes('Nano Banana prompt')) continue;

    skipHeader = false;
    lines.push(text);
  }

  return { title, content: lines.join('\n\n') };
}

function extractBlockText(block) {
  const richText = block[block.type]?.rich_text;
  if (!richText) return '';
  return richText.map(t => t.plain_text).join('');
}

async function publishToSubstack(title, content) {
  if (!SUBSTACK_API_KEY || !SUBSTACK_PUBLICATION_URL) {
    console.warn('[publisher] Substack credentials not set — skipping publish, returning placeholder URL');
    return `https://${SUBSTACK_PUBLICATION_URL}/p/draft`;
  }

  const response = await fetch(`https://substack.com/api/v1/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUBSTACK_API_KEY}`,
    },
    body: JSON.stringify({
      draft_title: title,
      draft_body: content,
      draft_subtitle: '',
      audience: 'everyone',
      should_send_email: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Substack API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.canonical_url || `https://${SUBSTACK_PUBLICATION_URL}/p/${data.slug}`;
}

async function adaptForX(title, content) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Convert this HackProduct blog post into a punchy X/Twitter thread of 8-10 tweets.

Rules:
- Tweet 1: the hook — most surprising/sharp line from the post, standalone
- Tweets 2-8: the argument, one idea per tweet, short sentences
- Tweet 9: the insight/takeaway
- Tweet 10: CTA — "HackProduct is a practice gym for product thinking. Built for engineers. Join the waitlist: hackproduct.com"
- Each tweet max 280 chars
- No hashtags except on final tweet: #ProductThinking #Engineers
- Maintain HackProduct voice: direct, specific, anti-fluff

Title: ${title}

Post:
${content}

Return ONLY the tweets, numbered 1/ through 10/, one per line.`
    }]
  });

  return message.content[0].text;
}

async function adaptForLinkedIn(title, content) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Convert this HackProduct blog post into a LinkedIn post (300-400 words).

Rules:
- Hook: first line must stop the scroll — bold claim or surprising insight
- Body: 3-4 short paragraphs, professional but direct tone
- End with: "HackProduct is a practice gym for product thinking — built for engineers who want to think like PMs without becoming one. Launching soon → hackproduct.com"
- No excessive hashtags — max 3 at the end: #ProductThinking #SoftwareEngineering #CareerGrowth
- LinkedIn tone: slightly more professional than X but still direct, not corporate

Title: ${title}

Post:
${content}

Return ONLY the LinkedIn post text.`
    }]
  });

  return message.content[0].text;
}

async function adaptForInstagram(title, content) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Write an Instagram caption for this HackProduct content (150-200 words).

Rules:
- Opening line (before "more"): punchy hook that works on its own as a preview
- Body: 2-3 short paragraphs distilling the key insight
- End with: "Join the waitlist: hackproduct.com (link in bio)"
- Hashtags (10-15): mix of niche (#ProductThinking #TechCareer #EngineerLife) and broader (#CareerAdvice #SoftwareDeveloper #ProductManagement)
- Tone: warm, direct, Instagram-native but still smart

Title: ${title}

Post:
${content}

Return ONLY the Instagram caption text including hashtags.`
    }]
  });

  return message.content[0].text;
}

async function scheduleBuffer(profileId, text, publishDate) {
  if (!BUFFER_ACCESS_TOKEN) {
    console.warn('[publisher] Buffer token not set — skipping schedule');
    return;
  }

  const scheduledAt = publishDate
    ? new Date(publishDate).toISOString()
    : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2h from now

  const response = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${BUFFER_ACCESS_TOKEN}`,
    },
    body: new URLSearchParams({
      profile_ids: profileId,
      text,
      scheduled_at: scheduledAt,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Buffer API error ${response.status}: ${err}`);
  }
}

async function updateNotionCalendar(calendarPageId, substackUrl) {
  const properties = {
    Status: { select: { name: 'Published' } },
  };

  if (substackUrl) {
    properties['Substack URL'] = { url: substackUrl };
  }

  await notion.pages.update({ page_id: calendarPageId, properties });
}

async function logToGrowthTracker(title, publishDate, channels, substackUrl) {
  const GROWTH_TRACKER_PAGE_ID = '32c00bae-8699-8121-a270-eeca967e4d7b';

  await notion.blocks.children.append({
    block_id: GROWTH_TRACKER_PAGE_ID,
    children: [{
      type: 'table_row',
      table_row: {
        cells: [
          [{ type: 'text', text: { content: publishDate || new Date().toISOString().split('T')[0] } }],
          [{ type: 'text', text: { content: title } }],
          [{ type: 'text', text: { content: channels.join(', ') } }],
          [{ type: 'text', text: { content: substackUrl || '' } }],
          [{ type: 'text', text: { content: '—' } }], // opens
          [{ type: 'text', text: { content: '—' } }], // waitlist clicks
        ],
      },
    }],
  });
}

app.listen(PORT, () => {
  console.log(`[publisher] Listening on port ${PORT}`);
});
