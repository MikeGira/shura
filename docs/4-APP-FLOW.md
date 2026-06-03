# App Flow — User Journey Map
# Project: SHURA
# Date: 2026-06-03

---

## User Types
- **Guest** — not signed in, can start one analysis (then gated to sign up)
- **Free user** — signed in, 3 analyses/month limit
- **Pro user** — signed in, unlimited analyses ($19/month)
- **Builder user** — signed in, unlimited + code generation ($49/month) [Phase 4]

## Core Journeys

### Journey 1: Guest → First Analysis → Sign Up
**Actor:** New visitor from Reddit/Product Hunt/X post  
**Goal:** See value before committing  
**Steps:**
1. Lands on `/` — sees input field, tagline "Reveal what to build"
2. Pastes a YouTube URL or types a Reddit topic
3. Clicks "Analyze"
4. System shows progress: "Fetching transcript... Analyzing gaps... Generating ideas..."
5. User sees results: 5 insights, 3 product idea cards, #1 spec preview (blurred after first paragraph)
6. User clicks "View full spec" — gated: "Sign up free to see the full spec"
7. User signs up (Google or email magic link)
8. Full spec unlocks immediately — no re-run needed
9. User is on dashboard with 2/3 free analyses remaining

**Success state:** User sees full spec, now a registered free user  
**Failure state (no transcript):** "This video has no captions. Try a different video or paste a Reddit topic."

---

### Journey 2: Free User → Runs 3 Analyses → Upgrade
**Actor:** Free user who has found value  
**Goal:** Get more analyses  
**Steps:**
1. User logs in, dashboard shows 0/3 remaining
2. User tries to run new analysis — gated: "You've used your 3 free analyses this month"
3. Modal shows: "Upgrade to Pro — unlimited analyses, $19/month"
4. User clicks "Upgrade" → Stripe Checkout (pre-filled with their email)
5. Payment complete → Stripe webhook fires → user's plan upgraded in DB
6. User redirected back to dashboard — counter now shows "Pro — unlimited"
7. User runs the analysis they wanted

**Success state:** User is on Pro plan, analysis runs  
**Failure state (Stripe decline):** Stripe handles, user sees Stripe error, returns to dashboard as free

---

### Journey 3: Pro User — Daily Use
**Actor:** Paying user building a product  
**Goal:** Research a new product idea  
**Steps:**
1. User logs in to dashboard
2. Pastes YouTube URL of a popular creator in their niche
3. System fetches transcript + YouTube metadata (title, views, channel)
4. Analysis runs, streams progress in real time
5. User sees 3 ideas with opportunity scores — clicks into #1
6. Reads full PRD spec, clicks "Export PDF"
7. PDF downloads with SHURA header, analysis date, all sections

**Success state:** User has a PDF spec ready to share or start building from

---

### Journey 4: Auth Flow (email magic link)
**Actor:** User who chose email signup  
**Steps:**
1. User enters email on `/signup`
2. System sends magic link via Resend
3. User clicks link in email → redirected to `/api/auth/callback`
4. Supabase exchanges code for session → user redirected to `/dashboard`

**Success state:** User is logged in  
**Failure state (expired link):** "/auth/callback?error=..." → redirect to `/login?error=link_expired` with clear message

---

## Edge Cases & Error States

| Scenario | What happens |
|---|---|
| YouTube video has no captions | Clear message: "No captions found. Try a different video or use a Reddit topic." Analysis does NOT run. |
| YouTube URL is invalid | Inline validation error before submission: "Enter a valid YouTube URL" |
| Reddit topic returns no posts | "No recent posts found for this topic. Try a different search term." |
| Claude API call fails / times out | "Analysis failed. Your free analysis was not used. Try again." |
| Vercel function timeout (60s) | Partial results saved, user sees what completed, error banner for what didn't |
| User hits rate limit (10/hour) | "You've run 10 analyses this hour. Rate limit resets at [time]." |
| Stripe webhook duplicate | Idempotency key + check-before-update prevents double upgrades |
| Session expires mid-analysis | Results lost. User redirected to login with "Session expired" message. |
| User tries to access another user's analysis | 404 (RLS returns no row — treated as not found, not unauthorized) |

## Navigation Map
```
/ (Landing)
├── /login
│   └── /api/auth/callback → /dashboard
├── /signup
│   └── /api/auth/callback → /dashboard
└── /dashboard (auth required)
    ├── /analysis/[id] (auth required + ownership)
    └── /settings
        └── → Stripe Customer Portal (external)
```
