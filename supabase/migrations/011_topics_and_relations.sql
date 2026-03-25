-- ============================================================
-- HackProduct — Topics, Relations & Study Plans
-- Migration: 011_topics_and_relations.sql
-- Adds topic taxonomy, challenge/company join tables, and
-- structured study plans for the Explore Redesign (SUN-168)
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

-- 1. topics (sub-groupings within a domain)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  difficulty_range TEXT DEFAULT 'beginner-advanced',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. challenge_topics (many-to-many: challenges ↔ topics)
CREATE TABLE challenge_topics (
  challenge_id UUID NOT NULL REFERENCES challenge_prompts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (challenge_id, topic_id)
);

-- 3. concept_topics (many-to-many: concepts ↔ topics)
CREATE TABLE concept_topics (
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (concept_id, topic_id)
);

-- 4. challenge_companies (many-to-many: challenges ↔ companies)
CREATE TABLE challenge_companies (
  challenge_id UUID NOT NULL REFERENCES challenge_prompts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
  relevance TEXT CHECK (relevance IN ('asked_in_interview', 'relevant_to', 'inspired_by')),
  PRIMARY KEY (challenge_id, company_id)
);

-- 5. study_plans (curated learning paths)
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  difficulty TEXT DEFAULT 'mixed',
  estimated_hours NUMERIC(4,1),
  is_published BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. study_plan_items (ordered items within a study plan)
CREATE TABLE study_plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('challenge', 'concept', 'article')),
  challenge_id UUID REFERENCES challenge_prompts(id),
  concept_id UUID REFERENCES concepts(id),
  chapter_title TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ALTER EXISTING TABLES
-- ============================================================

-- Add topic_id to concepts for direct topic association
ALTER TABLE concepts ADD COLUMN topic_id UUID REFERENCES topics(id);

-- Add sub_questions to challenge_prompts for multi-part challenges
ALTER TABLE challenge_prompts ADD COLUMN sub_questions TEXT[] DEFAULT '{}';


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_topics_domain_id ON topics(domain_id);
CREATE INDEX idx_challenge_topics_topic_id ON challenge_topics(topic_id);
CREATE INDEX idx_concept_topics_topic_id ON concept_topics(topic_id);
CREATE INDEX idx_study_plan_items_plan_id ON study_plan_items(plan_id);
CREATE INDEX idx_challenge_companies_company_id ON challenge_companies(company_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plan_items ENABLE ROW LEVEL SECURITY;

-- ---- topics ----
CREATE POLICY "Anyone can view published topics"
  ON topics FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---- challenge_topics ----
CREATE POLICY "Anyone can view challenge topics"
  ON challenge_topics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage challenge topics"
  ON challenge_topics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---- concept_topics ----
CREATE POLICY "Anyone can view concept topics"
  ON concept_topics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage concept topics"
  ON concept_topics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---- challenge_companies ----
CREATE POLICY "Anyone can view challenge companies"
  ON challenge_companies FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage challenge companies"
  ON challenge_companies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---- study_plans ----
CREATE POLICY "Anyone can view published study plans"
  ON study_plans FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage study plans"
  ON study_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ---- study_plan_items ----
CREATE POLICY "Anyone can view study plan items"
  ON study_plan_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage study plan items"
  ON study_plan_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
