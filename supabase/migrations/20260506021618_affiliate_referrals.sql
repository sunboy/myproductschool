CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  stripe_promo_code_id TEXT UNIQUE,
  stripe_connect_account_id TEXT UNIQUE,
  commission_pct NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliates_code_format_check
    CHECK (code = UPPER(code) AND code ~ '^[A-Z0-9][A-Z0-9-]{2,23}$'),
  CONSTRAINT affiliates_commission_pct_check
    CHECK (commission_pct >= 0 AND commission_pct <= 100),
  CONSTRAINT affiliates_status_check
    CHECK (status IN ('pending', 'active', 'disabled'))
);

CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  ip_hash TEXT,
  ua_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  invoice_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_commissions_amount_check CHECK (amount_cents > 0),
  CONSTRAINT affiliate_commissions_status_check CHECK (status IN ('pending', 'paid', 'void')),
  CONSTRAINT affiliate_commissions_unique_invoice UNIQUE (affiliate_id, invoice_id)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.protect_profile_affiliate_attribution()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
    AND (
      NEW.referral_source IS DISTINCT FROM OLD.referral_source
      OR NEW.affiliate_id IS DISTINCT FROM OLD.affiliate_id
    )
  THEN
    RAISE EXCEPTION 'affiliate attribution is managed server-side';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_affiliates_stripe_promo_code_id ON public.affiliates(stripe_promo_code_id);
CREATE INDEX idx_affiliate_clicks_affiliate_id_created_at ON public.affiliate_clicks(affiliate_id, created_at DESC);
CREATE INDEX idx_affiliate_clicks_code_created_at ON public.affiliate_clicks(code, created_at DESC);
CREATE INDEX idx_affiliate_commissions_affiliate_status ON public.affiliate_commissions(affiliate_id, status);
CREATE INDEX idx_affiliate_commissions_status_created_at ON public.affiliate_commissions(status, created_at);
CREATE INDEX idx_profiles_affiliate_id ON public.profiles(affiliate_id);

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER protect_profile_affiliate_attribution
  BEFORE UPDATE OF referral_source, affiliate_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_affiliate_attribution();

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can view own affiliate clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_clicks.affiliate_id
      AND affiliates.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage affiliate clicks"
  ON public.affiliate_clicks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

CREATE POLICY "Users can view own affiliate commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE affiliates.id = affiliate_commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage affiliate commissions"
  ON public.affiliate_commissions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ));

COMMENT ON TABLE public.affiliates IS 'Affiliate referral identities and Stripe Connect payout routing.';
COMMENT ON TABLE public.affiliate_clicks IS 'Hashed referral click telemetry keyed by affiliate code.';
COMMENT ON TABLE public.affiliate_commissions IS 'Invoice-level affiliate commission accrual and payout status.';
