-- ============================================================
-- Affiliate + Stripe Connect payout primitives
-- Referral links, attribution, commission ledger, and connected
-- account state for affiliate revenue share.
-- ============================================================

CREATE TABLE IF NOT EXISTS affiliate_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT,
  commission_bps INTEGER NOT NULL DEFAULT 2000
    CHECK (commission_bps >= 0 AND commission_bps <= 10000),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'paused', 'disabled')),
  stripe_account_id TEXT UNIQUE,
  stripe_account_livemode BOOLEAN,
  stripe_account_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (stripe_account_status IN ('not_started', 'created', 'onboarding', 'active', 'restricted', 'disabled')),
  stripe_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partners_user
  ON affiliate_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_status
  ON affiliate_partners(status, stripe_account_status);

ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users view own affiliate partner record"
    ON affiliate_partners FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users create own affiliate partner record"
    ON affiliate_partners FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own affiliate partner basics"
    ON affiliate_partners FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage affiliate partners"
    ON affiliate_partners FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER affiliate_partners_updated_at
    BEFORE UPDATE ON affiliate_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  landing_path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  converted_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate
  ON affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_visitor
  ON affiliate_clicks(visitor_id, created_at DESC);

ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Affiliates view own clicks"
    ON affiliate_clicks FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM affiliate_partners ap
        WHERE ap.id = affiliate_clicks.affiliate_id
          AND ap.user_id = (select auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage affiliate clicks"
    ON affiliate_clicks FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE RESTRICT,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'refunded', 'disputed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate
  ON affiliate_referrals(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_user
  ON affiliate_referrals(referred_user_id);

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Affiliates view own referrals"
    ON affiliate_referrals FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM affiliate_partners ap
        WHERE ap.id = affiliate_referrals.affiliate_id
          AND ap.user_id = (select auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage affiliate referrals"
    ON affiliate_referrals FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER affiliate_referrals_updated_at
    BEFORE UPDATE ON affiliate_referrals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE RESTRICT,
  referral_id UUID REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT UNIQUE,
  gross_amount INTEGER NOT NULL CHECK (gross_amount >= 0),
  commission_bps INTEGER NOT NULL CHECK (commission_bps >= 0 AND commission_bps <= 10000),
  commission_amount INTEGER NOT NULL CHECK (commission_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'paid', 'skipped', 'failed', 'reversed')),
  error TEXT,
  event_id TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate
  ON affiliate_commissions(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status
  ON affiliate_commissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_subscription
  ON affiliate_commissions(stripe_subscription_id);

ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Affiliates view own commissions"
    ON affiliate_commissions FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM affiliate_partners ap
        WHERE ap.id = affiliate_commissions.affiliate_id
          AND ap.user_id = (select auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage affiliate commissions"
    ON affiliate_commissions FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER affiliate_commissions_updated_at
    BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
