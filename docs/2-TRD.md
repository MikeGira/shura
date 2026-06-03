# TRD — Technical Requirements Document
# Project: SHURA
# Date: 2026-06-03

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | Server components, streaming, API routes — one repo for everything |
| Hosting | Vercel Hobby (free) | Zero cost, auto-deploy, edge network, serverless functions |
| Database | Supabase PostgreSQL | Free tier (500MB), RLS built-in, Auth included |
| Auth | Supabase Auth + @supabase/ssr | Official SSR integration, handles cookies correctly in App Router |
| YouTube | youtube-transcript npm + YouTube Data API v3 | No API key for transcripts; official API for metadata |
| Reddit | Direct Reddit OAuth2 REST calls (no library) | snoowrap has critical CVEs via `request` chain; native fetch is safer |
| AI | Claude API Sonnet 4.6 + Haiku 4.5 | Sonnet for analysis/spec (quality), Haiku for cheap utility calls |
| Payments | Stripe | No monthly fee, pay-as-you-go, excellent webhook support |
| Email | Resend | 100 emails/day free, clean API |
| Styling | Tailwind CSS + CSS custom properties (tokens.css) | Design tokens enforced, no inline styles |
| CI/CD | GitHub Actions — Gitleaks + CodeQL | Secret scanning + static analysis on every push |

## Architecture Overview
All data processing is server-side. The browser receives only rendered HTML and JSON. The Claude API key, Reddit credentials, and Supabase service role key never leave the server. Supabase RLS enforces row-level isolation — no server-side auth bypass can expose another user's data even if API route logic has a bug.

The AI pipeline runs as a single long-lived serverless function (Vercel allows up to 60s on Hobby). Three sequential Claude calls produce the full analysis. Responses stream to the client via server-sent events so the user sees progress in real time.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/analyze | Required | Start analysis pipeline; streams SSE response |
| GET | /api/analyses | Required | List user's saved analyses |
| GET | /api/analyses/[id] | Required + ownership | Fetch single analysis |
| POST | /api/billing/checkout | Required | Create Stripe checkout session |
| POST | /api/billing/portal | Required | Create Stripe customer portal session |
| POST | /api/webhooks/stripe | Stripe signature | Handle subscription events |
| GET | /api/auth/callback | None | Supabase OAuth callback |

## Environment Variables

| Variable | Purpose |
|---|---|
| ANTHROPIC_API_KEY | Claude API |
| YOUTUBE_API_KEY | YouTube Data API v3 (metadata) |
| REDDIT_CLIENT_ID | Reddit app OAuth2 client ID |
| REDDIT_CLIENT_SECRET | Reddit app OAuth2 client secret |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_ANON_KEY | Supabase browser-safe key |
| SUPABASE_SERVICE_ROLE_KEY | Supabase server-only key (bypasses RLS for admin ops) |
| STRIPE_SECRET_KEY | Stripe server key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signature verification |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe browser key |
| RESEND_API_KEY | Resend email key |
| NEXT_PUBLIC_APP_URL | Full URL (https://shura.app or localhost:3000) |

## Security Requirements
- [x] Auth: Supabase Auth (not custom) — email + Google OAuth
- [x] RLS on every table — users see only their own rows
- [x] Rate limiting: 10 analyses/hour per user, tracked in DB
- [x] CORS: locked to NEXT_PUBLIC_APP_URL
- [x] Security headers via next.config.ts (CSP, HSTS, X-Frame-Options, etc.)
- [x] Stripe webhook: verify signature before processing
- [x] Input validation: URL format, max length, allowed input types
- [x] No secrets in NEXT_PUBLIC_* (except Stripe publishable key — safe by design)

## Performance Requirements
- Analysis pipeline: complete within 45 seconds (Vercel 60s limit)
- Page load (dashboard): under 2 seconds (static shell + streaming data)
- Transcript fetch: under 5 seconds for typical YouTube video

## External Services & Dependencies

| Service | Purpose | Free tier sufficient? |
|---|---|---|
| Vercel Hobby | Hosting | Yes — 100GB bandwidth, 1M function invocations |
| Supabase Free | DB + Auth | Yes — 500MB, 50k MAU |
| YouTube Data API v3 | Video metadata | Yes — 10k units/day |
| youtube-transcript npm | Transcript fetch | Yes — no quota |
| Reddit API (OAuth app-only) | Post data | Yes — 100 req/min (non-commercial) |
| Anthropic Claude API | AI pipeline | Pay-per-use (~$0.03/analysis) |
| Stripe | Payments | Yes — 0 monthly fee, 2.9% + $0.30 per tx |
| Resend | Email | Yes — 100 emails/day |

## Known Technical Risks
- YouTube transcript availability: ~85% of videos have auto-captions. If none exist, fallback to metadata-only analysis with a clear user message.
- Vercel 60s function timeout: Three Claude calls + two API fetches must complete in time. Mitigation: stream SSE so user sees progress; if timeout, partial results are saved.
- Reddit rate limits: 100 req/min on free tier. At scale this will need commercial upgrade.
- Next.js 16 breaking changes: API conventions differ from Next.js 13/14. Read node_modules/next/dist/docs/ before any Next.js API work.
