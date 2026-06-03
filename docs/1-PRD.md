# PRD — Product Requirements Document
# Project: SHURA
# Date: 2026-06-03
# Status: APPROVED

---

## Problem Statement
Content creators, indie hackers, and entrepreneurs consume enormous amounts of social media content — YouTube videos, Reddit threads, blog posts — but have no systematic way to extract the market opportunities hidden in that content. They see pain points discussed daily but lack the tool to translate "people complaining about X" into "here is the product to build, here is who pays for it, here is how."

## Target Users
- **Primary:** Indie hackers and solopreneurs who want to build products but struggle with idea validation and spec writing
- **Secondary:** Content creators who want to monetize their domain knowledge by building tools for their audience; freelancers scoping new service offerings

## Goals (3-month horizon)
- 500 registered users, 54+ paying at $19/month ($1,026+/month revenue)
- Average analysis-to-spec generation time under 60 seconds
- 70%+ of free users who run all 3 free analyses convert to paid within 30 days

## Non-Goals (v1)
- Code generation (Phase 4)
- Instagram / TikTok / LinkedIn integration (never scraped, official APIs not viable)
- Team/collaboration features
- Marketplace for selling generated ideas
- Mobile app
- Podcast or newsletter ingestion (Phase 5)

## Core Features (MVP)

| Priority | Feature | User Story |
|---|---|---|
| P0 | YouTube analysis | As a user, I paste a YouTube URL and get a full trend analysis + 3 product ideas + 1 spec |
| P0 | Reddit analysis | As a user, I enter a subreddit or topic and get the same output based on top posts |
| P0 | Product idea cards | As a user, I see 3 ranked product ideas with name, pitch, target user, opportunity score |
| P0 | PRD spec generation | As a user, I get a full PRD for the #1 idea: problem, users, features, stack, monetization |
| P0 | Save and revisit | As a user, all my analyses are saved and accessible from my dashboard |
| P0 | Usage gating | Free = 3 analyses/month. Pro = unlimited. Enforced server-side. |
| P0 | Auth (email + Google) | As a user, I can sign up with email or Google in under 30 seconds |
| P0 | Stripe billing | As a user, I can upgrade to Pro with a card in under 60 seconds |
| P1 | PDF export | As a user, I can download my spec as a PDF to share or print |
| P1 | General URL analysis | As a user, I can paste any public URL (article, blog, Reddit thread) |
| P1 | Trending topic previews | As a user, the homepage shows 6 trending topics as starting points |
| P2 | Regenerate ideas | As a user, I can regenerate different ideas from the same analysis |

## Post-MVP Features
- No-code artifact generation (landing pages, Notion templates, Zapier blueprints)
- Code generation for paid tier
- Topic-based content discovery (platform fetches content for a topic automatically)
- Twitter/X API integration
- Podcast transcript analysis

## Success Metrics
- Time-to-first-analysis (from signup): under 3 minutes
- Analysis completion rate: >90% (no timeouts, no failures)
- Free-to-paid conversion rate: >15% within 7 days
- Monthly churn rate: <5%

## Open Questions
- None — all resolved.
