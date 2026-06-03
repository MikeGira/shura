# Implementation Plan
# Project: SHURA
# Date: 2026-06-03
# Target MVP launch: 2026-06-17 (2 weeks)

---

## Phases

### Phase 0: Foundation (Day 1) ✅ IN PROGRESS
- [x] Next.js 16 initialized
- [x] Core dependencies installed
- [x] CLAUDE.md written
- [x] 6 planning docs written
- [x] Design tokens in src/styles/tokens.css
- [ ] GitHub repo created + pushed
- [ ] Vercel project connected to GitHub
- [ ] Supabase project created
- [ ] Schema applied (SQL from 5-SCHEMA.md)
- [ ] All env vars added to Vercel dashboard
- [ ] .env.local created locally (never committed)
- [ ] .env.example committed (names only)
- [ ] GitHub Actions: Gitleaks + CodeQL (copy from Bio)
- [ ] Confirm deploy pipeline: push → Vercel auto-deploys

### Phase 1: Core Pipeline (Days 2–4)
The analysis engine — the heart of SHURA.
- [ ] src/lib/youtube/transcript.ts — fetch transcript + metadata
- [ ] src/lib/reddit/client.ts — Reddit OAuth2 app-only token + post fetch
- [ ] src/lib/claude/prompts.ts — all 3 system prompts (trend analysis, ideation, spec)
- [ ] src/lib/claude/analyze.ts — orchestrate 3-call pipeline, save to DB
- [ ] POST /api/analyze — validate input, check usage limits, stream SSE response
- [ ] Test pipeline end-to-end locally with real YouTube URL
- [ ] Test pipeline end-to-end locally with Reddit topic

### Phase 2: UI Shell (Days 4–6)
- [ ] Global layout (fonts, tokens imported in globals.css, dark default)
- [ ] src/components/ui/ — Button, Input, Card, Badge, Spinner
- [ ] Landing page (/) — input field, tagline, example cards (static)
- [ ] Auth pages — /login, /signup (Supabase magic link + Google)
- [ ] /api/auth/callback route
- [ ] Middleware — protect /dashboard and /analysis/* routes
- [ ] Dashboard page — new analysis input + past analyses list
- [ ] Analysis results page — insights, 3 product cards, spec view
- [ ] Settings page — plan + usage display + Stripe portal button

### Phase 3: Auth + Billing (Days 6–9)
- [ ] Supabase Auth configured (email magic link + Google OAuth)
- [ ] POST /api/billing/checkout — create Stripe checkout session
- [ ] POST /api/billing/portal — create Stripe customer portal
- [ ] POST /api/webhooks/stripe — handle checkout.session.completed, subscription events
- [ ] Usage gating in /api/analyze — block free users at 3/month
- [ ] Plan badge in dashboard sidebar
- [ ] "Upgrade" modal triggered at limit

### Phase 4: Polish (Days 10–12)
- [ ] PDF export (use browser print CSS — no library needed for MVP)
- [ ] Empty states on dashboard and analysis list
- [ ] Error states for all failure scenarios (see APP-FLOW.md)
- [ ] Loading/streaming progress indicator in analyze flow
- [ ] Trending topic cards on homepage (6 static curated examples for launch)
- [ ] Mobile responsive (≥ 640px)
- [ ] Accessibility audit (keyboard nav, ARIA, contrast)

### Phase 5: Launch Prep (Days 13–14)
- [ ] npm audit — zero critical/high findings
- [ ] Gitleaks scan — zero secrets in history
- [ ] End-to-end smoke test (all journeys from APP-FLOW.md)
- [ ] Supabase Security Advisor — zero warnings
- [ ] Test Stripe in test mode (checkout, webhook, portal)
- [ ] Test RLS: user A cannot see user B's data
- [ ] Write Product Hunt launch post draft
- [ ] Reddit launch post draft (r/SideProject, r/indiehackers)
- [ ] Deploy to production URL

---

## Dependencies Between Phases
- Phase 0 must complete before Phase 1 (no CI/CD = no deployments)
- Phase 1 pipeline must work before Phase 2 UI (UI is a wrapper around it)
- Phase 3 billing must complete before launch (free tier is not a business)
- Phase 4 polish happens in parallel with Phase 3 where possible

## Definition of Done
A task is done when:
- [ ] Feature works end-to-end in production (not just localhost)
- [ ] No console errors or TypeScript errors
- [ ] No hardcoded secrets
- [ ] Security checklist passed for this feature
- [ ] Committed with conventional commit and pushed

## Post-MVP Roadmap
- Month 2: No-code artifacts (generated landing pages, Notion templates)
- Month 3: Topic-based discovery (auto-fetch trending content by topic)
- Month 4–6: Code generation for Builder tier
- Month 6+: Twitter/X API, podcast transcript analysis
- Reddit commercial API upgrade: when MRR > $500 (can comfortably afford it)
