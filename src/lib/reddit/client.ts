export interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  numComments: number;
  subreddit: string;
  url: string;
  createdUtc: number;
}

export interface RedditData {
  topic: string;
  posts: RedditPost[];
  topComments: string[];
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Reddit credentials not configured");

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "SHURA/1.0 (content analysis tool; contact byosekumbuga@gmail.com)",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${res.status}`);
  const data = await res.json();

  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cachedToken.value;
}

async function redditGet(path: string): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "SHURA/1.0 (content analysis tool; contact byosekumbuga@gmail.com)",
    },
  });
  if (!res.ok) throw new Error(`Reddit API error: ${res.status} ${path}`);
  return res.json();
}

function parsePost(child: Record<string, unknown>): RedditPost {
  const d = child.data as Record<string, unknown>;
  return {
    title: String(d.title ?? ""),
    selftext: String(d.selftext ?? "").slice(0, 800),
    score: Number(d.score ?? 0),
    numComments: Number(d.num_comments ?? 0),
    subreddit: String(d.subreddit ?? ""),
    url: `https://reddit.com${d.permalink}`,
    createdUtc: Number(d.created_utc ?? 0),
  };
}

export async function fetchRedditData(topic: string): Promise<RedditData> {
  const cleanTopic = topic.replace(/^r\//, "").trim();

  // Try as a subreddit first, then fall back to search
  let posts: RedditPost[] = [];
  try {
    const data = await redditGet(`/r/${cleanTopic}/hot.json?limit=25`) as {
      data: { children: { data: unknown }[] };
    };
    posts = data.data.children.map((c) => parsePost(c as Record<string, unknown>));
  } catch {
    const encoded = encodeURIComponent(cleanTopic);
    const data = await redditGet(
      `/search.json?q=${encoded}&sort=top&t=month&limit=25`
    ) as { data: { children: { data: unknown }[] } };
    posts = data.data.children.map((c) => parsePost(c as Record<string, unknown>));
  }

  // Fetch top comments from the highest-scored post
  const topComments: string[] = [];
  if (posts.length > 0) {
    try {
      const topPost = posts[0];
      const postId = topPost.url.split("/comments/")[1]?.split("/")[0];
      if (postId) {
        const commentsData = await redditGet(
          `/r/${posts[0].subreddit}/comments/${postId}.json?limit=10&depth=1`
        ) as [unknown, { data: { children: { data: { body: string } }[] } }];
        const commentListing = commentsData[1];
        topComments.push(
          ...commentListing.data.children
            .filter((c) => c.data.body && c.data.body !== "[deleted]")
            .slice(0, 8)
            .map((c) => c.data.body.slice(0, 300))
        );
      }
    } catch {
      // Comments are nice-to-have; failure is acceptable
    }
  }

  return { topic: cleanTopic, posts, topComments };
}
