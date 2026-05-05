-- supabase/migrations/073_company_profiles_disciplines.sql
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS disciplines TEXT[] NOT NULL DEFAULT ARRAY['product_sense'];

UPDATE company_profiles SET disciplines = ARRAY['product_sense', 'system_design'] WHERE slug IN ('google', 'meta', 'stripe', 'amazon', 'microsoft', 'apple');
UPDATE company_profiles SET disciplines = ARRAY['product_sense', 'system_design', 'data_modeling'] WHERE slug IN ('netflix', 'uber', 'airbnb', 'linkedin');
