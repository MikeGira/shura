-- SHURA Database Schema
-- Run in Supabase SQL editor in this order.

-- 1. profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'builder')),
  stripe_customer_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. analyses
CREATE TABLE analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type text NOT NULL CHECK (input_type IN ('youtube', 'reddit', 'url')),
  input_value text NOT NULL,
  input_title text,
  input_thumbnail text,
  transcript_excerpt text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE INDEX analyses_user_id_idx ON analyses(user_id, created_at DESC);
CREATE POLICY "Users see own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own analyses" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own analyses" ON analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own analyses" ON analyses FOR DELETE USING (auth.uid() = user_id);

-- 3. product_ideas
CREATE TABLE product_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  rank int NOT NULL CHECK (rank IN (1, 2, 3)),
  title text NOT NULL,
  pitch text NOT NULL,
  target_user text NOT NULL,
  problem_solved text NOT NULL,
  opportunity_score int NOT NULL CHECK (opportunity_score BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE product_ideas ENABLE ROW LEVEL SECURITY;
CREATE INDEX product_ideas_analysis_id_idx ON product_ideas(analysis_id, rank);
CREATE POLICY "Users see own ideas" ON product_ideas FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM analyses WHERE id = analysis_id));
CREATE POLICY "Service role inserts ideas" ON product_ideas FOR INSERT WITH CHECK (true);

-- 4. specs
CREATE TABLE specs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE,
  product_idea_id uuid NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  prd_markdown text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own specs" ON specs FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM analyses WHERE id = analysis_id));
CREATE POLICY "Service role inserts specs" ON specs FOR INSERT WITH CHECK (true);

-- 5. usage_limits
CREATE TABLE usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  analyses_this_month int NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON usage_limits FOR SELECT USING (auth.uid() = user_id);

-- 6. api_usage (admin only)
CREATE TABLE api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL UNIQUE,
  reddit_calls int NOT NULL DEFAULT 0,
  youtube_units int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
-- No user policies — service role only

-- Trigger: auto-create profile + usage row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO usage_limits (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RPC: increment monthly usage counter
CREATE OR REPLACE FUNCTION increment_usage(uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE usage_limits
  SET analyses_this_month = analyses_this_month + 1,
      updated_at = now()
  WHERE user_id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: track API call volumes
CREATE OR REPLACE FUNCTION track_api_usage(p_month text, p_reddit_calls int, p_youtube_units int)
RETURNS void AS $$
BEGIN
  INSERT INTO api_usage (month, reddit_calls, youtube_units)
  VALUES (p_month, p_reddit_calls, p_youtube_units)
  ON CONFLICT (month) DO UPDATE
    SET reddit_calls = api_usage.reddit_calls + EXCLUDED.reddit_calls,
        youtube_units = api_usage.youtube_units + EXCLUDED.youtube_units,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron: monthly usage reset (enable pg_cron extension first in Supabase)
-- SELECT cron.schedule('reset-monthly-usage', '5 0 1 * *',
--   'UPDATE usage_limits SET analyses_this_month = 0, reset_at = date_trunc(''month'', now()) + interval ''1 month'', updated_at = now()');

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
