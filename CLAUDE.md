# SHURA — Claude Code Project Config

## What This Is
AI content-to-product intelligence platform. Users paste YouTube URLs or Reddit topics → platform extracts transcripts via official APIs → Claude Sonnet 4.6 analyzes for market gaps → generates ranked product ideas + full PRD spec.

Name: "Hishura" (Kinyarwanda for "reveal").

## Commands
```bash
npm run dev       # dev server http://localhost:3000
npm run build     # production build
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm audit         # dependency vulnerability check
```

## Stack
- **Framework:** Next.js 16 (App Router, TypeScript strict) — READ node_modules/next/dist/docs/ for breaking changes vs older Next.js
- **Hosting:** Vercel (Hobby free tier)
- **Database:** Supabase PostgreSQL + RLS
- **Auth:** Supabase Auth via @supabase/ssr
- **AI:** Claude API — Sonnet 4.6 for analysis/specs, Haiku 4.5 for cheap utility tasks
- **YouTube:** `youtube-transcript` npm package + YouTube Data API v3
- **Reddit:** Direct Reddit OAuth2 REST API (no library — snoowrap was CVE-riddled)
- **Payments:** Stripe
- **Email:** Resend
- **Styling:** Tailwind CSS + design tokens in `src/styles/tokens.css`

## Environment Variables (never commit values)
```
ANTHROPIC_API_KEY
YOUTUBE_API_KEY
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## File Structure
```
src/
  app/
    (auth)/login, signup       — auth pages
    (dashboard)/dashboard      — main app, requires auth
    (dashboard)/analysis/[id]  — view saved analysis
    (dashboard)/settings       — billing + account
    api/analyze/               — POST: run analysis pipeline
    api/auth/callback/         — Supabase OAuth callback
    api/webhooks/stripe/       — Stripe webhook handler
    page.tsx                   — landing page (public)
  lib/
    supabase/client.ts         — browser client
    supabase/server.ts         — server client (cookies)
    supabase/middleware.ts     — auth middleware
    claude/analyze.ts          — full analysis pipeline
    claude/prompts.ts          — all system prompts
    youtube/transcript.ts      — fetch YouTube transcript + metadata
    reddit/client.ts           — Reddit OAuth2 client
    stripe/client.ts           — Stripe helpers
  components/
    ui/                        — Button, Input, Card, Badge, Spinner
    analysis/                  — AnalysisInput, ProductCard, SpecView
    layout/                    — Nav, Sidebar, PageHeader
  styles/
    tokens.css                 — ONLY place hex codes live
```

## AI Architecture
Three sequential Claude calls per analysis:
1. **Trend Analysis** — identifies top 5 pain points / market gaps from content
2. **Product Ideation** — generates 3 ranked product ideas with opportunity scores
3. **Spec Generation** — full PRD for the #1 idea (Sonnet 4.6, ~2k output tokens)

Prompt caching: system prompts are cached (saves ~70% input cost on repeated calls).
All AI calls are server-side only. API key never reaches the client.

## Data Sources (compliant only)
- YouTube transcripts: `youtube-transcript` npm (reads public auto-captions, no API key)
- YouTube metadata: YouTube Data API v3 (official, 10k units/day free)
- Reddit: Official Reddit API OAuth2 (app-only flow, 100 req/min free)
- General URLs: public HTTP fetch + Cheerio
- Instagram / TikTok / LinkedIn: NOT included (ToS risk)

## Security Notes
- RLS enabled on all Supabase tables — users can only read their own rows
- Rate limiting: 10 analyses/hour per user via Supabase counter
- No secrets in NEXT_PUBLIC_* vars except Stripe publishable key
- Stripe webhook signature verified before processing
- All user inputs validated + sanitized before passing to Claude
- Claude outputs treated as untrusted — rendered as markdown only

## Reddit API Commercial Use
Free tier (100 req/min OAuth) is non-commercial. Fine while revenue = $0.
Once charging users: upgrade to Reddit commercial API plan.
Monitor: track monthly Reddit API call count in api_usage Supabase table.

## Design Standard
Vercel/Linear tier. Full rules in ~/.claude/design-discipline.md.
Tokens in src/styles/tokens.css. No raw hex codes elsewhere.
No gradients, no glassmorphism, no emoji in UI chrome, no exclamation points in copy.
