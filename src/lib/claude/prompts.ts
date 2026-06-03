export const TREND_ANALYSIS_SYSTEM = `You are a market research analyst specializing in identifying commercial opportunities from content. Your job is to analyze transcripts, posts, and discussions to surface the real pain points, frustrations, and unmet needs expressed by people.

Be specific and evidence-based. Quote or closely paraphrase actual language from the content. Avoid generic observations. Focus on pain points that could be addressed by a digital product or service.

Output valid JSON only. No markdown, no explanation outside the JSON structure.`;

export const TREND_ANALYSIS_USER = (content: string, source: string) => `
Analyze this ${source} content and identify the top 5 market gaps or pain points:

<content>
${content.slice(0, 12000)}
</content>

Return JSON in exactly this structure:
{
  "gaps": [
    {
      "title": "short pain point title",
      "description": "2-3 sentences describing the pain, with evidence from the content",
      "demand_signal": "direct quote or paraphrase from content showing people want a solution",
      "existing_solutions": "brief note on what exists today (or 'none identified')"
    }
  ],
  "content_summary": "2-sentence summary of what the content is about",
  "audience": "who is expressing these pain points (be specific)"
}
`;

export const IDEATION_SYSTEM = `You are a product strategist who specializes in turning market pain points into viable digital product ideas. You think like a solo founder with limited resources — ideas must be buildable by one person, have a clear monetization path, and solve a real problem people will pay for.

Score opportunities honestly. A score of 80+ means exceptional, 60-79 means solid, below 60 means risky. Most ideas should score 50-75.

Output valid JSON only.`;

export const IDEATION_USER = (gaps: string, audience: string) => `
Given these market gaps identified from real content:

<gaps>
${gaps}
</gaps>

<audience>${audience}</audience>

Generate exactly 3 product ideas, ranked by opportunity score (highest first). Each idea must be a digital product or SaaS tool — no physical products.

Return JSON:
{
  "ideas": [
    {
      "rank": 1,
      "title": "product name (2-4 words)",
      "pitch": "one sentence — what it does and who it's for (max 20 words)",
      "target_user": "specific person with a specific job/goal",
      "problem_solved": "the specific pain from the gaps this addresses",
      "why_now": "why this is a good time to build this (market timing, trend, etc.)",
      "opportunity_score": 72,
      "score_rationale": "one sentence explaining the score"
    }
  ]
}
`;

export const SPEC_SYSTEM = `You are a senior product manager writing a Product Requirements Document (PRD) for a solo founder who will build this product with AI coding tools. Be practical, specific, and opinionated. Avoid generic filler. Every section should contain information a developer could act on.

Output markdown only. Use the exact section structure provided.`;

export const SPEC_USER = (idea: {
  title: string;
  pitch: string;
  target_user: string;
  problem_solved: string;
  why_now: string;
}) => `
Write a full PRD for this product:

Product: ${idea.title}
Pitch: ${idea.pitch}
Target user: ${idea.target_user}
Problem: ${idea.problem_solved}
Why now: ${idea.why_now}

Use this exact structure:

# ${idea.title} — Product Requirements Document

## Problem
[2 paragraphs: the pain in detail, why existing solutions fail]

## Target User
[Specific persona — job title, context, what they're trying to accomplish, what they currently do instead]

## MVP Features
[Table with columns: Priority (P0/P1/P2), Feature, User Story. P0 = required for launch. Maximum 3 P0 features.]

## What This Is NOT (v1)
[3-5 explicit non-goals — prevents scope creep]

## Suggested Tech Stack
[One recommendation per layer: frontend, backend/hosting, database, auth, payments, AI if applicable. Include why.]

## Monetization
[Pricing tiers with price points, what each tier includes, and reasoning]

## Go-to-Market (Day 1)
[3 specific launch actions — where to post, who to reach, what to say. No generic advice.]

## Success Metrics (Month 1)
[3-5 measurable KPIs with target numbers]

## Key Risks
[Top 3 risks that could kill this product, with mitigation for each]
`;
