-- Paywall and Promo Code System Migration
-- Creates tables for subscriptions, promo codes, and transactions

-- ============================================================================
-- TYPE DEFINITIONS
-- ============================================================================

-- Subscription status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('inactive', 'active', 'past_due', 'canceled', 'trialing');
  END IF;
END $$;

-- Transaction status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

-- Subscription plan enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('free', 'standard', 'pro', 'enterprise');
  END IF;
END $$;

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan);

-- ============================================================================
-- PROMO CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  free_access BOOLEAN DEFAULT false,
  free_duration_days INTEGER, -- NULL = permanent, number = days of free access
  max_uses INTEGER DEFAULT 1 CHECK (max_uses > 0),
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT promo_codes_code_check CHECK (char_length(code) >= 3 AND char_length(code) <= 50),
  CONSTRAINT promo_codes_code_unique UNIQUE (code),
  CONSTRAINT promo_codes_used_count_max CHECK (used_count <= max_uses)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires ON public.promo_codes(expires_at);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status transaction_status NOT NULL DEFAULT 'pending',
  plan subscription_plan NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_promo_code ON public.transactions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment ON public.transactions(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);

-- ============================================================================
-- PROMO CODE REDEMPTIONS (Track who used which codes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT promo_redemptions_unique UNIQUE (promo_code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_promo ON public.promo_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON public.promo_redemptions(user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users see own, admins see all
DROP POLICY IF EXISTS subscriptions_user_own ON public.subscriptions;
CREATE POLICY subscriptions_user_own ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS subscriptions_admin_all ON public.subscriptions;
CREATE POLICY subscriptions_admin_all ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions: Service role can update (for webhook)
DROP POLICY IF EXISTS subscriptions_service_update ON public.subscriptions;
CREATE POLICY subscriptions_service_update ON public.subscriptions
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS subscriptions_service_insert ON public.subscriptions;
CREATE POLICY subscriptions_service_insert ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Promo codes: Admins manage, users can read active codes for validation
DROP POLICY IF EXISTS promo_codes_admin_all ON public.promo_codes;
CREATE POLICY promo_codes_admin_all ON public.promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS promo_codes_user_read ON public.promo_codes;
CREATE POLICY promo_codes_user_read ON public.promo_codes
  FOR SELECT USING (is_active = true);

-- Transactions: Users see own, admins see all
DROP POLICY IF EXISTS transactions_user_own ON public.transactions;
CREATE POLICY transactions_user_own ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS transactions_admin_all ON public.transactions;
CREATE POLICY transactions_admin_all ON public.transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS transactions_service_insert ON public.transactions;
CREATE POLICY transactions_service_insert ON public.transactions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS transactions_service_update ON public.transactions;
CREATE POLICY transactions_service_update ON public.transactions
  FOR UPDATE USING (true);

-- Promo redemptions: Users see own, admins see all
DROP POLICY IF EXISTS promo_redemptions_user_own ON public.promo_redemptions;
CREATE POLICY promo_redemptions_user_own ON public.promo_redemptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS promo_redemptions_admin_all ON public.promo_redemptions;
CREATE POLICY promo_redemptions_admin_all ON public.promo_redemptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS promo_redemptions_service_insert ON public.promo_redemptions;
CREATE POLICY promo_redemptions_service_insert ON public.promo_redemptions
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Validate promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  promo_id UUID,
  discount_percent NUMERIC,
  free_access BOOLEAN,
  free_duration_days INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo RECORD;
BEGIN
  -- Find promo code (case-insensitive)
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(p_code)
  LIMIT 1;
  
  -- Code not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, false, NULL::INTEGER, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if active
  IF NOT v_promo.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, false, NULL::INTEGER, 'This promo code is no longer active'::TEXT;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, false, NULL::INTEGER, 'This promo code has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check usage limit
  IF v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, 0::NUMERIC, false, NULL::INTEGER, 'This promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;
  
  -- Valid code
  RETURN QUERY SELECT 
    true,
    v_promo.id,
    v_promo.discount_percent,
    v_promo.free_access,
    v_promo.free_duration_days,
    'Promo code applied successfully'::TEXT;
END;
$$;

-- Redeem promo code
CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_transaction_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo_id UUID;
  v_free_access BOOLEAN;
  v_free_duration_days INTEGER;
BEGIN
  -- Validate code
  SELECT promo_id, free_access, free_duration_days
  INTO v_promo_id, v_free_access, v_free_duration_days
  FROM public.validate_promo_code(p_code)
  WHERE valid = true;
  
  IF v_promo_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid or unavailable promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM public.promo_redemptions
    WHERE promo_code_id = v_promo_id AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false, 'You have already used this promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Record redemption
  INSERT INTO public.promo_redemptions (promo_code_id, user_id, transaction_id)
  VALUES (v_promo_id, p_user_id, p_transaction_id);
  
  -- Increment used count
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE id = v_promo_id;
  
  -- If free access, grant subscription
  IF v_free_access THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan,
      status,
      current_period_start,
      current_period_end,
      metadata
    )
    VALUES (
      p_user_id,
      'standard',
      'active',
      now(),
      CASE 
        WHEN v_free_duration_days IS NULL THEN NULL
        ELSE now() + (v_free_duration_days || ' days')::INTERVAL
      END,
      jsonb_build_object('source', 'promo_code', 'code', p_code)
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan = 'standard',
      status = 'active',
      current_period_start = now(),
      current_period_end = CASE 
        WHEN v_free_duration_days IS NULL THEN NULL
        ELSE now() + (v_free_duration_days || ' days')::INTERVAL
      END,
      metadata = jsonb_build_object('source', 'promo_code', 'code', p_code);
  END IF;
  
  RETURN QUERY SELECT true, 'Promo code redeemed successfully'::TEXT;
END;
$$;

-- Get user subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(p_user_id UUID)
RETURNS TABLE (
  has_access BOOLEAN,
  plan TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN s.status IN ('active', 'trialing') THEN true
      WHEN s.status = 'inactive' AND s.plan = 'free' THEN true
      ELSE false
    END as has_access,
    s.plan::TEXT,
    s.status::TEXT,
    s.current_period_end
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
  LIMIT 1;
$$;

-- ============================================================================
-- AUTO-CREATE FREE SUBSCRIPTION FOR NEW USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_free_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create free subscription for new user
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create free subscription
DROP TRIGGER IF EXISTS create_subscription_on_signup ON public.profiles;
CREATE TRIGGER create_subscription_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription();

-- ============================================================================
-- SEED DATA (Sample promo codes for testing)
-- ============================================================================

-- Insert sample promo codes
INSERT INTO public.promo_codes (code, description, discount_percent, max_uses)
VALUES 
  ('WELCOME10', '10% off for new users', 10, 100),
  ('SAVE20', '20% discount', 20, 50),
  ('FREE30', 'Free 30-day trial', 0, 1000)
ON CONFLICT (code) DO NOTHING;

-- Insert free access promo code
INSERT INTO public.promo_codes (code, description, free_access, free_duration_days, max_uses)
VALUES 
  ('EARLYACCESS', 'Free access for early adopters', true, 90, 100),
  ('LIFETIME', 'Lifetime free access', true, NULL, 10)
ON CONFLICT (code) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status TO authenticated;

