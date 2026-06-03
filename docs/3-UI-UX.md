# UI/UX Design
# Project: SHURA
# Date: 2026-06-03

---

## Design Principles
- Purposeful — every element earns its place or gets cut
- Calm — no animation unless it communicates state; no noise
- Dense-but-readable — builder tools are dense; embrace it with tight typograhy
- Premium-quiet — Vercel dashboard / Linear tier, never default-shadcn demo

## Color & Typography
All values defined in `src/styles/tokens.css`. Do not use raw hex elsewhere.

- Accent: `--accent` (#4F6EF7 dark / #3B56E0 light) — deep indigo
- Background: `--bg-base` (#111214 dark / #F9FAFB light)
- Font (UI): Inter Variable — body 14px/400, labels 12px/500, headings 20px/600
- Font (code/spec output): JetBrains Mono — 13px/400

## Key Screens

### Screen 1: Landing Page (/)
**Purpose:** Convert visitors. Show the value in one glance.
**Key elements:**
- Wordmark "SHURA" top-left, tagline "Reveal what to build"
- Single large input field (focal point): "Paste a YouTube URL or Reddit topic"
- Subtext: "Get 3 product ideas + a full spec in 60 seconds"
- 3 example output cards (static, showing the kind of output) below the fold
- "Try free — no card required" button below input
- Minimal footer: Privacy · Terms · GitHub

```
+--------------------------------------------------+
|  SHURA                           Log in  Sign up |
+--------------------------------------------------+
|                                                  |
|     Reveal what to build.                        |
|                                                  |
|  +--------------------------------------------+ |
|  |  youtube.com/watch?v=...                   | |
|  |  or paste a Reddit topic                  | |
|  +--------------------------------------------+ |
|  [ Analyze →  ]  Try free — no card required    |
|                                                  |
|  ── Example output ──────────────────────────── |
|  [Product card 1]  [Product card 2]  [Card 3]   |
|                                                  |
+--------------------------------------------------+
```

### Screen 2: Dashboard (/dashboard)
**Purpose:** Central hub — start new analysis, revisit past ones.
**Key elements:**
- Left sidebar: wordmark, nav links (Dashboard, Settings), usage indicator
- Main area: "New Analysis" input (same as landing) at top
- Below: list of past analyses (title, date, # ideas generated, source type badge)
- Empty state: centered, one sentence, one button

```
+-------+------------------------------------------+
| SHURA |                                           |
|       |  New Analysis                             |
| Dash  |  +--------------------------------------+ |
| Set.  |  |  Paste YouTube URL or Reddit topic  | |
|       |  +--------------------------------------+ |
| Free  |  [ Analyze → ]                           |
| 2/3   |                                           |
|       |  ── Past analyses ────────────────────── |
|       |  [Title]  YouTube  Jun 2  3 ideas  [→]   |
|       |  [Title]  Reddit   Jun 1  3 ideas  [→]   |
+-------+------------------------------------------+
```

### Screen 3: Analysis Results (/analysis/[id])
**Purpose:** Show the full output — trend analysis + 3 product ideas + spec.
**Key elements:**
- Source summary at top (YouTube video title + channel, or Reddit topic)
- "Key insights" section: 5 bullet points of market gaps found
- 3 product idea cards in a row, ranked #1 #2 #3
  - Each card: product name, one-line pitch, target user, opportunity score badge
  - #1 card has "View full spec" button; #2 and #3 have "Generate spec" (paid only)
- Below #1 card: full PRD spec in markdown, rendered cleanly
- "Export PDF" button top-right
- "Run new analysis" button

### Screen 4: Auth (login / signup)
**Purpose:** Minimal, fast.
**Key elements:**
- Centered card, wordmark at top
- "Continue with Google" button (primary)
- Divider "or"
- Email input + "Continue with email" (magic link)
- No password fields

### Screen 5: Settings (/settings)
**Purpose:** Account + billing management.
**Key elements:**
- Two sections: Account (email, name), Billing (plan, usage, Stripe portal button)
- Current plan badge, monthly usage counter
- "Manage billing" button → opens Stripe portal in new tab
- "Upgrade to Pro" CTA if on free plan

## Component Inventory
- [ ] Button (primary, secondary, ghost, danger) — no emoji, no exclamation
- [ ] Input (text, URL validation state)
- [ ] Card (analysis result, product idea, past analysis list item)
- [ ] Badge (plan tier, input source type, opportunity score)
- [ ] Spinner / progress indicator (thin line, no bouncing dots)
- [ ] SpecView (markdown renderer with code font for tech specs)
- [ ] UsageBar (compact, in sidebar — shows 2/3 free analyses used)
- [ ] EmptyState (centered, one sentence, one action)
- [ ] Toast / notification (success/error, auto-dismiss 4s)

## Responsive Breakpoints
- Mobile first: no (this is a builder tool — desktop primary)
- Desktop-first with mobile-usable at ≥ 640px
- Sidebar collapses to top nav on mobile

## Accessibility Requirements
- [ ] Keyboard navigable (tab order matches visual order)
- [ ] ARIA labels on all icon-only buttons
- [ ] Color contrast ratio ≥ 4.5:1 for all text
- [ ] Focus indicators visible (border-strong ring)
- [ ] Streaming progress announced via aria-live region
