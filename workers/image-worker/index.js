/**
 * HackProduct Image Worker
 *
 * Receives Nano Banana image prompts from a Notion draft page,
 * generates images via Google Imagen (Nano Banana Pro),
 * and uploads them back to Notion replacing the placeholder callout blocks.
 *
 * POST /generate
 * Body: { notion_page_id: string, prompts: [{ label: string, prompt: string }] }
 */

import express from 'express';
import { Client } from '@notionhq/client';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

const notion = new Client({ auth: process.env.NOTION_INTEGRATION_TOKEN });
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const PORT = process.env.PORT || 8080;
const WORKER_SECRET = process.env.WORKER_SECRET;

// Auth middleware
app.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (WORKER_SECRET && auth !== `Bearer ${WORKER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/generate', async (req, res) => {
  const { notion_page_id, prompts } = req.body;

  if (!notion_page_id || !Array.isArray(prompts) || prompts.length === 0) {
    return res.status(400).json({ error: 'notion_page_id and prompts[] required' });
  }

  console.log(`[image-worker] Generating ${prompts.length} images for page ${notion_page_id}`);

  try {
    const imageUrls = [];

    for (const { label, prompt } of prompts) {
      console.log(`[image-worker] Generating: ${label}`);
      const imageUrl = await generateImage(prompt);
      imageUrls.push({ label, url: imageUrl });
      console.log(`[image-worker] Generated: ${label} → ${imageUrl}`);
    }

    // Replace placeholder callout blocks in Notion with real images
    await replacePlaceholdersInNotion(notion_page_id, imageUrls);

    res.json({ status: 'done', image_urls: imageUrls });
  } catch (err) {
    console.error('[image-worker] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function generateImage(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        safetyFilterLevel: 'block_some',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Nano Banana API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const base64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!base64) throw new Error('No image returned from Nano Banana API');

  // Upload to a public image host — using Notion's file upload or a temp host
  // For now, return a data URL (works for Notion external image blocks)
  return `data:image/png;base64,${base64}`;
}

async function replacePlaceholdersInNotion(pageId, imageUrls) {
  // Get all blocks from the page
  const { results: blocks } = await notion.blocks.children.list({ block_id: pageId });

  for (const block of blocks) {
    // Find callout blocks containing IMAGE PLACEHOLDER
    if (block.type !== 'callout') continue;
    const text = block.callout?.rich_text?.map(t => t.plain_text).join('') || '';
    if (!text.includes('IMAGE PLACEHOLDER')) continue;

    // Match which image this placeholder is for
    const matchedImage = imageUrls.find(({ label }) => text.includes(label));
    if (!matchedImage) continue;

    // Replace the callout block with an image block
    await notion.blocks.update({
      block_id: block.id,
      callout: {
        rich_text: [
          {
            type: 'text',
            text: { content: `✅ Image generated: ${matchedImage.label}` },
          },
        ],
        icon: { emoji: '🖼️' },
      },
    });

    // Append the image as a child block after the callout
    await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          type: 'image',
          image: {
            type: 'external',
            external: { url: matchedImage.url },
          },
        },
      ],
    });
  }
}

app.listen(PORT, () => {
  console.log(`[image-worker] Listening on port ${PORT}`);
});
