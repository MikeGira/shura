# Backend Schema
# Project: SHURA
# Date: 2026-06-03
# Database: Supabase PostgreSQL

---

## Tables

### Table: profiles
**Purpose:** User display data and plan tier, linked to auth.users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE | |
| email | text | NOT NULL | Denormalized from auth.users for query convenience |
| full_name | text | | Optional, from Google OAuth |
| avatar_url | text | | From Google OAuth |
| plan | text | NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','builder')) | |
| stripe_customer_id | text | UNIQUE | Set on first checkout |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

**RLS Policies:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- INSERT handled by trigger (see below), not client
```

---

### Table: analyses
**Purpose:** One row per analysis run

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | |
| input_type | text | NOT NULL CHECK (input_type IN ('youtube','reddit','url')) | |
| input_value | text | NOT NULL | The URL or topic string |
| input_title | text | | Video title, subreddit name, or page title |
| input_thumbnail | text | | YouTube thumbnail URL |
| transcript_excerpt | text | | First 500 chars of transcript (for display) |
| status | text | NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')) | |
| error_message | text | | Populated on failure |
| created_at | timestamptz | NOT NULL DEFAULT now() | |
| completed_at | timestamptz | | |

**Indexes:**
- `CREATE INDEX analyses_user_id_idx ON analyses(user_id, created_at DESC);`

**RLS Policies:**
```sql
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses" ON analyses
  FOR DELETE USING (auth.uid() = user_id);
```

---

### Table: product_ideas
**Purpose:** 3 product ideas per analysis

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| analysis_id | uuid | NOT NULL REFERENCES analyses(id) ON DELETE CASCADE | |
| rank | int | NOT NULL CHECK (rank IN (1,2,3)) | 1 = top idea |
| title | text | NOT NULL | Product name |
| pitch | text | NOT NULL | One-line value proposition |
| target_user | text | NOT NULL | Who pays for this |
| problem_solved | text | NOT NULL | What pain it resolves |
| opportunity_score | int | NOT NULL CHECK (opportunity_score BETWEEN 1 AND 100) | AI-scored 1–100 |
| created_at | timestamptz | NOT NULL DEFAULT now() | |

**Indexes:**
- `CREATE INDEX product_ideas_analysis_id_idx ON product_ideas(analysis_id, rank);`

**RLS Policies:**
```sql
ALTER TABLE product_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own ideas" ON product_ideas
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM analyses WHERE id = analysis_id)
  );

CREATE POLICY "Service role inserts ideas" ON product_ideas
  FOR INSERT WITH CHECK (true);
-- Insert is done server-side with service role key; users cannot insert directly
```

---

### Table: specs
**Purpose:** Full PRD spec for rank-1 product idea

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| analysis_id | uuid | NOT NULL REFERENCES analyses(id) ON DELETE CASCADE UNIQUE | One spec per analysis |
| product_idea_id | uuid | NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE | |
| prd_markdown | text | NOT NULL | Full PRD in markdown |
| generated_at | timestamptz | NOT NULL DEFAULT now() | |

**RLS Policies:**
```sql
ALTER TABLE specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own specs" ON specs
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM analyses WHERE id = analysis_id)
  );

CREATE POLICY "Service role inserts specs" ON specs
  FOR INSERT WITH CHECK (true);
```

---

### Table: usage_limits
**Purpose:** Track monthly analysis count per user for free tier gating

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE | |
| analyses_this_month | int | NOT NULL DEFAULT 0 | |
| reset_at | timestamptz | NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month' | |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

**RLS Policies:**
```sql
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own usage" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);
-- Updates done server-side with service role key only
```

---

### Table: api_usage
**Purpose:** Track Reddit API call volume for commercial upgrade monitoring

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | |
| month | text | NOT NULL | Format: 'YYYY-MM' |
| reddit_calls | int | NOT NULL DEFAULT 0 | |
| youtube_units | int | NOT NULL DEFAULT 0 | YouTube Data API quota units used |
| updated_at | timestamptz | NOT NULL DEFAULT now() | |

**RLS Policies:**
```sql
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
-- No user access — read/write only via service role key
-- Admin reads this via Supabase dashboard
```

---

## Triggers

### Auto-create profile on user signup
```sql
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
```

### Auto-reset monthly usage
```sql
-- Run via Supabase cron (pg_cron) — first day of each month at 00:05 UTC
SELECT cron.schedule(
  'reset-monthly-usage',
  '5 0 1 * *',
  $$
    UPDATE usage_limits
    SET analyses_this_month = 0,
        reset_at = date_trunc('month', now()) + interval '1 month',
        updated_at = now();
  $$
);
```

---

## Grants
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
```

## Migrations Checklist
- [ ] Enable RLS on every table
- [ ] Apply all policies
- [ ] Create triggers
- [ ] Schedule pg_cron monthly reset
- [ ] Run Supabase Security Advisor
- [ ] Test: create two users, confirm user A cannot see user B's analyses
