import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchYouTubeData, extractVideoId } from "@/lib/youtube/transcript";
import { fetchRedditData } from "@/lib/reddit/client";
import { runAnalysis } from "@/lib/claude/analyze";

const FREE_LIMIT = 3;
const HOURLY_LIMIT = 10;

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function detectInputType(input: string): "youtube" | "reddit" | "url" {
  if (input.includes("youtube.com") || input.includes("youtu.be")) return "youtube";
  if (input.startsWith("r/") || input.match(/^[a-zA-Z0-9_]+$/) || input.includes("reddit.com"))
    return "reddit";
  if (isValidUrl(input)) return "url";
  return "reddit"; // treat plain text as a Reddit topic search
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service = await createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check plan and usage limits
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";

  if (plan === "free") {
    const { data: usage } = await supabase
      .from("usage_limits")
      .select("analyses_this_month, reset_at")
      .eq("user_id", user.id)
      .single();

    const used = usage?.analyses_this_month ?? 0;
    if (used >= FREE_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "limit_reached",
          message: `You have used all ${FREE_LIMIT} free analyses this month.`,
          reset_at: usage?.reset_at,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Hourly rate limit (all plans)
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= HOURLY_LIMIT) {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: `Maximum ${HOURLY_LIMIT} analyses per hour.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json().catch(() => null);
  const input: string = typeof body?.input === "string" ? body.input.trim() : "";

  if (!input || input.length > 500) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const inputType = detectInputType(input);

  // Create analysis record
  const { data: analysis, error: insertError } = await service
    .from("analyses")
    .insert({
      user_id: user.id,
      input_type: inputType,
      input_value: input,
      status: "running",
    })
    .select("id")
    .single();

  if (insertError || !analysis) {
    return new Response(JSON.stringify({ error: "Failed to create analysis" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const analysisId = analysis.id;

  // Stream SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        send("progress", { step: "Fetching content..." });

        let content = "";
        let inputTitle = input;
        let inputThumbnail: string | undefined;

        if (inputType === "youtube") {
          const yt = await fetchYouTubeData(input);
          if (!yt.transcriptAvailable) {
            throw new Error(
              "This video has no captions. Try a different video or use a Reddit topic."
            );
          }
          content = `Title: ${yt.metadata.title}\nChannel: ${yt.metadata.channelName}\nViews: ${yt.metadata.viewCount.toLocaleString()}\n\n${yt.transcript}`;
          inputTitle = yt.metadata.title;
          inputThumbnail = yt.metadata.thumbnailUrl;

          await service
            .from("analyses")
            .update({ input_title: inputTitle, input_thumbnail: inputThumbnail })
            .eq("id", analysisId);
        } else if (inputType === "reddit") {
          const reddit = await fetchRedditData(input);
          const postsText = reddit.posts
            .slice(0, 15)
            .map(
              (p) =>
                `Title: ${p.title}\nScore: ${p.score}\nContent: ${p.selftext}`
            )
            .join("\n\n---\n\n");
          const commentsText =
            reddit.topComments.length > 0
              ? `\n\nTop comments:\n${reddit.topComments.join("\n")}`
              : "";
          content = postsText + commentsText;
          inputTitle = `r/${reddit.topic}`;

          await service
            .from("analyses")
            .update({ input_title: inputTitle })
            .eq("id", analysisId);
        } else {
          throw new Error("URL analysis coming soon. Try a YouTube URL or Reddit topic.");
        }

        const result = await runAnalysis(
          content,
          inputType === "youtube" ? "YouTube video" : "Reddit community",
          (step) => send("progress", { step })
        );

        // Persist ideas and spec
        const { data: ideas } = await service
          .from("product_ideas")
          .insert(
            result.ideas.map((idea) => ({
              analysis_id: analysisId,
              rank: idea.rank,
              title: idea.title,
              pitch: idea.pitch,
              target_user: idea.target_user,
              problem_solved: idea.problem_solved,
              opportunity_score: idea.opportunity_score,
            }))
          )
          .select("id, rank");

        const topIdeaRow = ideas?.find((i) => i.rank === 1);
        if (topIdeaRow) {
          await service.from("specs").insert({
            analysis_id: analysisId,
            product_idea_id: topIdeaRow.id,
            prd_markdown: result.spec,
          });
        }

        await service
          .from("analyses")
          .update({
            status: "complete",
            input_title: inputTitle,
            transcript_excerpt: content.slice(0, 500),
            completed_at: new Date().toISOString(),
          })
          .eq("id", analysisId);

        // Increment usage count for free users
        if (plan === "free") {
          await service.rpc("increment_usage", { uid: user.id });
        }

        // Track API usage
        const month = new Date().toISOString().slice(0, 7);
        await service.rpc("track_api_usage", {
          p_month: month,
          p_reddit_calls: inputType === "reddit" ? 1 : 0,
          p_youtube_units: inputType === "youtube" ? 3 : 0,
        });

        send("complete", { analysis_id: analysisId, result });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Analysis failed. Please try again.";

        await service
          .from("analyses")
          .update({ status: "failed", error_message: message })
          .eq("id", analysisId);

        send("error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
