import { YoutubeTranscript } from "youtube-transcript";

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  channelName: string;
  viewCount: number;
  publishedAt: string;
  thumbnailUrl: string;
  description: string;
}

export interface YouTubeData {
  metadata: YouTubeMetadata;
  transcript: string;
  transcriptAvailable: boolean;
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not configured");

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("id", videoId);
  url.searchParams.set("part", "snippet,statistics");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error("Video not found");

  return {
    videoId,
    title: item.snippet.title,
    channelName: item.snippet.channelTitle,
    viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    description: (item.snippet.description ?? "").slice(0, 500),
  };
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    return segments.map((s) => s.text).join(" ").trim();
  } catch {
    return null;
  }
}

export async function fetchYouTubeData(url: string): Promise<YouTubeData> {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube URL");

  const [metadata, transcriptText] = await Promise.all([
    fetchYouTubeMetadata(videoId),
    fetchTranscript(videoId),
  ]);

  return {
    metadata,
    transcript: transcriptText ?? "",
    transcriptAvailable: transcriptText !== null && transcriptText.length > 100,
  };
}
