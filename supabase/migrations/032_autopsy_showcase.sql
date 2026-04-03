-- ============================================================
-- HackProduct — Prod Showcase (Autopsy) Feature
-- Migration: 032_autopsy_showcase.sql
-- Run via: supabase db push OR paste into SQL Editor
-- Idempotent: safe to re-run against existing databases
-- ============================================================


-- ── autopsy_products ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autopsy_products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT        UNIQUE NOT NULL,
  name            TEXT        NOT NULL,
  tagline         TEXT        NOT NULL,
  logo_emoji      TEXT,
  logo_url        TEXT,
  cover_color     TEXT,
  industry        TEXT,
  paradigm        TEXT,
  decision_count  INTEGER     NOT NULL DEFAULT 0,
  is_published    BOOLEAN     NOT NULL DEFAULT false,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── autopsy_decisions ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS autopsy_decisions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES autopsy_products(id) ON DELETE CASCADE,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  title           TEXT        NOT NULL,
  area            TEXT        NOT NULL,
  difficulty      TEXT        NOT NULL DEFAULT 'standard'
                              CHECK (difficulty IN ('warmup', 'standard', 'advanced')),
  icon            TEXT,
  screenshot_url  TEXT,
  what_they_did   TEXT        NOT NULL,
  real_reasoning  TEXT        NOT NULL,
  principle       TEXT        NOT NULL,
  challenge_question TEXT     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── autopsy_challenges ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS autopsy_challenges (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id   UUID    NOT NULL UNIQUE REFERENCES autopsy_decisions(id) ON DELETE CASCADE,
  context       TEXT    NOT NULL,
  options       JSONB   NOT NULL,
  insight       TEXT    NOT NULL,
  principle     TEXT    NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_autopsy_decisions_product
  ON autopsy_decisions(product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_autopsy_challenges_decision
  ON autopsy_challenges(decision_id);


-- ── RLS — autopsy_products ──────────────────────────────────

ALTER TABLE autopsy_products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "autopsy_products_read" ON autopsy_products
    FOR SELECT USING (is_published = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── RLS — autopsy_decisions ─────────────────────────────────

ALTER TABLE autopsy_decisions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "autopsy_decisions_read" ON autopsy_decisions
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── RLS — autopsy_challenges ─────────────────────────────────

ALTER TABLE autopsy_challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "autopsy_challenges_read" ON autopsy_challenges
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
