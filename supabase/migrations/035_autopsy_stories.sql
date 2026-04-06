-- Migration 035: autopsy_stories table + Notion block architecture seed story

CREATE TABLE IF NOT EXISTS autopsy_stories (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID        NOT NULL REFERENCES autopsy_products(id) ON DELETE CASCADE,
  slug                  TEXT        NOT NULL,
  title                 TEXT        NOT NULL,
  read_time             TEXT        NOT NULL DEFAULT '5 min read',
  sections              JSONB       NOT NULL DEFAULT '[]',
  related_challenge_ids TEXT[]      NOT NULL DEFAULT '{}',
  sort_order            INTEGER     NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_autopsy_stories_product ON autopsy_stories(product_id, sort_order);

ALTER TABLE autopsy_stories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "autopsy_stories_read" ON autopsy_stories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed: Notion — How Notion Bet Everything on Blocks
INSERT INTO autopsy_stories (product_id, slug, title, read_time, sections, related_challenge_ids, sort_order)
SELECT
  p.id,
  'notion-block-architecture',
  'How Notion Bet Everything on Blocks',
  '7 min read',
  '[
    {
      "id": "cover",
      "layout": "fullbleed_cover",
      "content": {
        "label": "Product Architecture",
        "headline": "How Notion Bet Everything on Blocks",
        "subline": "The decision that turned a note-taking app into a $10B platform",
        "meta": "7 min · Strategy & Architecture"
      }
    },
    {
      "id": "founding-bet",
      "layout": "split_panel",
      "content": {
        "label": "THE FOUNDING BET",
        "title": "One Building Block, Infinite Surfaces",
        "paragraphs": [
          "In 2018, Notion scrapped two years of work and rewrote everything. The bet: make every piece of content — a paragraph, a heading, an image, a database row — a discrete, composable block.",
          "This was not a UI decision. It was an infrastructure decision. Blocks meant that a page could embed another page. A database could filter blocks. The same atom of content could appear in a kanban view, a calendar, and a table — without duplication.",
          "At the time, it looked like over-engineering. Their competitors were shipping features. Notion was building a grammar."
        ],
        "textSide": "left"
      },
      "illustration": {
        "type": "block_anatomy",
        "data": {
          "blocks": [
            {"type": "heading", "label": "H1", "color": "primary"},
            {"type": "paragraph", "label": "Text", "color": "secondary"},
            {"type": "database", "label": "DB", "color": "tertiary"},
            {"type": "page", "label": "Page", "color": "primary"},
            {"type": "image", "label": "Image", "color": "secondary"}
          ]
        },
        "animationTrigger": "onVisible"
      }
    },
    {
      "id": "stat",
      "layout": "fullbleed_stat",
      "content": {
        "stat": "$0 → $10B",
        "context": "Notion valuation growth driven by a single architectural decision made in 2018",
        "source": "The Information, 2021"
      }
    },
    {
      "id": "displacement",
      "layout": "split_panel",
      "content": {
        "label": "THE DISPLACEMENT PLAY",
        "title": "12 Tools, One Workspace",
        "paragraphs": [
          "By the time Notion had blocks, they could do something no competitor could: collapse five different tools into one surface without losing fidelity.",
          "Evernote for notes. Trello for tasks. Airtable for data. Confluence for docs. Google Sheets for spreadsheets. Each one replaced — not by building a better version of each, but by making the underlying primitive flexible enough to become all of them.",
          "The integration tax — the friction of switching between tools — disappeared. Not because Notion built integrations. Because they made integrations unnecessary."
        ],
        "textSide": "right"
      },
      "illustration": {
        "type": "tool_stack",
        "data": {
          "replaced": [
            {"name": "Evernote"},
            {"name": "Trello"},
            {"name": "Confluence"},
            {"name": "Airtable"},
            {"name": "Google Sheets"}
          ],
          "replacement": "Notion"
        },
        "animationTrigger": "onVisible"
      }
    },
    {
      "id": "before-after",
      "layout": "before_after",
      "content": {
        "title": "The Editor Paradigm Shift",
        "before": {
          "label": "Rich-Text World",
          "items": [
            "Content is locked inside document structure",
            "Copy-paste breaks formatting across tools",
            "No way to link or embed between docs natively",
            "Every view requires a different tool",
            "Data lives in silos — notes here, tasks there"
          ],
          "summary": "Five tools. Five contexts. Five monthly bills."
        },
        "after": {
          "label": "Block World",
          "items": [
            "Every element is a draggable, reusable primitive",
            "Pages embed inside pages — no context switch",
            "Databases and docs share the same block layer",
            "Switch between table, kanban, and calendar views instantly",
            "One workspace. One source of truth."
          ],
          "summary": "One tool. Zero integration tax."
        }
      }
    },
    {
      "id": "principle",
      "layout": "fullbleed_principle",
      "content": {
        "principle": "Structure is the product. Not features — the underlying grammar of how information connects.",
        "attribution": "Observed from Notion''s block architecture decision, 2018"
      }
    },
    {
      "id": "cta",
      "layout": "fullbleed_cta",
      "content": {
        "headline": "Now put it into practice",
        "subline": "You have read the strategy — test if you saw it coming",
        "buttonText": "Take the Block Architecture Challenge",
        "targetPath": "/explore/showcase/notion"
      }
    }
  ]'::jsonb,
  ARRAY[]::TEXT[],
  1
FROM autopsy_products p
WHERE p.slug = 'notion'
ON CONFLICT (product_id, slug) DO NOTHING;
