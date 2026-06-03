import Anthropic from "@anthropic-ai/sdk";
import {
  TREND_ANALYSIS_SYSTEM,
  TREND_ANALYSIS_USER,
  IDEATION_SYSTEM,
  IDEATION_USER,
  SPEC_SYSTEM,
  SPEC_USER,
} from "./prompts";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export interface ProductIdea {
  rank: number;
  title: string;
  pitch: string;
  target_user: string;
  problem_solved: string;
  why_now: string;
  opportunity_score: number;
  score_rationale: string;
}

export interface AnalysisResult {
  content_summary: string;
  audience: string;
  gaps: Array<{
    title: string;
    description: string;
    demand_signal: string;
    existing_solutions: string;
  }>;
  ideas: ProductIdea[];
  spec: string;
}

async function callClaude(
  system: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

export async function runAnalysis(
  content: string,
  sourceLabel: string,
  onProgress: (step: string) => void
): Promise<AnalysisResult> {
  onProgress("Identifying market gaps...");

  const trendRaw = await callClaude(
    TREND_ANALYSIS_SYSTEM,
    TREND_ANALYSIS_USER(content, sourceLabel),
    1000
  );

  const trendData = parseJSON<{
    gaps: AnalysisResult["gaps"];
    content_summary: string;
    audience: string;
  }>(trendRaw);

  onProgress("Generating product ideas...");

  const gapsText = trendData.gaps
    .map((g, i) => `${i + 1}. ${g.title}: ${g.description}`)
    .join("\n");

  const ideaRaw = await callClaude(
    IDEATION_SYSTEM,
    IDEATION_USER(gapsText, trendData.audience),
    800
  );

  const ideaData = parseJSON<{ ideas: ProductIdea[] }>(ideaRaw);
  const topIdea = ideaData.ideas[0];

  onProgress("Writing product spec...");

  const spec = await callClaude(
    SPEC_SYSTEM,
    SPEC_USER(topIdea),
    2000
  );

  return {
    content_summary: trendData.content_summary,
    audience: trendData.audience,
    gaps: trendData.gaps,
    ideas: ideaData.ideas,
    spec,
  };
}
