-- Phase 3: Service Marketplace, Requests, and Premium Features

-- =====================================================
-- 1. Services System
-- =====================================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('fixed', 'hourly', 'custom')),
  price_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  delivery_time INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service requests from buyers
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
  budget DECIMAL(10, 2),
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '{}'::jsonb,
  deadline DATE,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'escrowed', 'released', 'refunded')),
  payment_method TEXT,
  payment_tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services"
ON services FOR SELECT
USING (active = true);

CREATE POLICY "Users can create their own services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own services"
ON services FOR UPDATE
TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own services"
ON services FOR DELETE
TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- RLS Policies for Service Requests
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests they're involved in"
ON service_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid() OR 
  seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create service requests"
ON service_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Seller or buyer can update request"
ON service_requests FOR UPDATE
TO authenticated
USING (
  requester_id = auth.uid() OR 
  seller_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Update timestamp trigger
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- 2. Premium Membership System
-- =====================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'premium_user', 'premium_seller');

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier subscription_tier DEFAULT 'free' NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Update timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Function to check if user has premium
CREATE OR REPLACE FUNCTION has_premium(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM subscriptions
    WHERE user_id = target_user_id
      AND tier IN ('premium_user', 'premium_seller')
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;